import type { SourceGraph, SourceNodeData } from '@ankhorage/dependency-graph';

import type {
  ArchitectureDetectionEvidence,
  ArchitectureRoleAssignment,
} from '../../../types/architectureAnalysis.js';
import type { ArchitectureModel } from '../../../types/architectureModel.js';

type RoleHints = Readonly<Record<string, readonly string[]>>;

const ROLE_HINTS: Readonly<Record<ArchitectureModel['id'], RoleHints>> = {
  hexagonal: {
    core: ['application', 'core', 'domain', 'service', 'usecase'],
    port: ['gateway', 'interface', 'port', 'repository'],
    adapter: ['adapter', 'client', 'controller', 'database', 'http', 'infra', 'infrastructure', 'persistence'],
    composition: ['bootstrap', 'composition', 'container', 'main', 'wiring'],
  },
  clean: {
    entity: ['domain', 'entities', 'entity', 'model'],
    'use-case': ['application', 'interactor', 'service', 'usecase'],
    'interface-adapter': ['adapter', 'controller', 'gateway', 'mapper', 'presenter'],
    framework: ['database', 'framework', 'http', 'infra', 'infrastructure', 'persistence', 'web'],
    composition: ['bootstrap', 'composition', 'container', 'main', 'wiring'],
  },
  onion: {
    'domain-model': ['domain', 'entity', 'model', 'value'],
    'domain-service': ['domainservice', 'policy', 'service'],
    'application-service': ['application', 'applicationservice', 'usecase'],
    infrastructure: ['database', 'infra', 'infrastructure', 'persistence', 'repository'],
    presentation: ['api', 'controller', 'http', 'presentation', 'ui', 'web'],
    composition: ['bootstrap', 'composition', 'container', 'main', 'wiring'],
  },
  layered: {
    presentation: ['api', 'controller', 'http', 'presentation', 'ui', 'web'],
    domain: ['application', 'business', 'domain', 'service'],
    'data-source': ['dao', 'data', 'database', 'db', 'persistence', 'repository'],
    composition: ['bootstrap', 'composition', 'container', 'main', 'wiring'],
  },
};

/*** Infer semantic model roles from generic source facts while keeping path names weak evidence. */
export function inferArchitectureRoles(
  graph: SourceGraph,
  model: ArchitectureModel,
): readonly ArchitectureRoleAssignment[] {
  const implementedTargets = new Set(
    graph.graph.edges.filter(({ data }) => data.kind === 'implements').map(({ target }) => target),
  );
  const implementingSources = new Set(
    graph.graph.edges.filter(({ data }) => data.kind === 'implements').map(({ source }) => source),
  );
  const vendorImportSources = new Set(
    graph.graph.edges
      .filter(({ data }) => data.kind === 'imports')
      .filter(({ target }) => graph.graph.nodes.find(({ id }) => id === target)?.data.classification === 'vendor')
      .map(({ source }) => source),
  );

  return graph.graph.nodes.flatMap((node) => {
    if (!isRoleCandidate(node.data)) return [];
    const ranked = model.roles
      .map(({ id }) => scoreRole(node.id, node.data, model.id, id, implementedTargets, implementingSources, vendorImportSources))
      .sort((left, right) => right.score - left.score || left.roleId.localeCompare(right.roleId));
    const best = ranked[0];
    if (best === undefined || best.score < 0.3) return [];
    const second = ranked[1]?.score ?? 0;
    const ambiguityPenalty = Math.max(0, 0.15 - Math.max(0, best.score - second));
    return [{
      semanticPath: node.data.semanticPath,
      roleId: best.roleId,
      confidence: round(Math.max(0, Math.min(1, best.score - ambiguityPenalty))),
      evidence: best.evidence,
    }];
  });
}

/*** Score one role using weak naming evidence plus language-neutral topology facts. */
function scoreRole(
  nodeId: number,
  node: SourceNodeData,
  modelId: ArchitectureModel['id'],
  roleId: string,
  implementedTargets: ReadonlySet<number>,
  implementingSources: ReadonlySet<number>,
  vendorImportSources: ReadonlySet<number>,
): { readonly evidence: readonly ArchitectureDetectionEvidence[]; readonly roleId: string; readonly score: number } {
  const tokens = semanticTokens(node);
  const hints = ROLE_HINTS[modelId][roleId] ?? [];
  const matchedHints = hints.filter((hint) => tokens.has(hint));
  const pathScore = Math.min(0.55, matchedHints.length * 0.22);
  const evidence: ArchitectureDetectionEvidence[] = matchedHints.map((hint) => ({
    kind: 'path',
    semanticPath: node.semanticPath,
    message: `Semantic name/path contains architecture hint "${hint}".`,
    weight: 0.22,
  }));

  const topology = topologyScore(nodeId, node, modelId, roleId, implementedTargets, implementingSources, vendorImportSources);
  return {
    roleId,
    score: Math.min(1, pathScore + topology.score),
    evidence: [...evidence, ...topology.evidence],
  };
}

/*** Add stronger graph-structural evidence without branching on source language. */
function topologyScore(
  nodeId: number,
  node: SourceNodeData,
  modelId: ArchitectureModel['id'],
  roleId: string,
  implementedTargets: ReadonlySet<number>,
  implementingSources: ReadonlySet<number>,
  vendorImportSources: ReadonlySet<number>,
): { readonly evidence: readonly ArchitectureDetectionEvidence[]; readonly score: number } {
  const evidence: ArchitectureDetectionEvidence[] = [];
  let score = 0;

  if (modelId === 'hexagonal' && roleId === 'port' && node.kind === 'interface' && implementedTargets.has(nodeId)) {
    score += 0.45;
    evidence.push({
      kind: 'topology',
      semanticPath: node.semanticPath,
      message: 'Interface is implemented by another source node, supporting a port role.',
      weight: 0.45,
    });
  }
  if (modelId === 'hexagonal' && roleId === 'adapter' && implementingSources.has(nodeId)) {
    score += 0.3;
    evidence.push({
      kind: 'topology',
      semanticPath: node.semanticPath,
      message: 'Source node implements an interface, supporting an adapter role.',
      weight: 0.3,
    });
  }
  if (isOuterRole(modelId, roleId) && vendorImportSources.has(nodeId)) {
    score += 0.25;
    evidence.push({
      kind: 'dependency',
      semanticPath: node.semanticPath,
      message: 'Source node directly imports vendor code, supporting an outer-boundary role.',
      weight: 0.25,
    });
  }

  return { score, evidence };
}

/*** Keep architecture inference on internal executable/declaration nodes rather than containers/vendors. */
function isRoleCandidate(node: SourceNodeData): boolean {
  return node.classification !== 'vendor' && node.kind !== 'project' && node.kind !== 'package' && node.kind !== 'directory';
}

/*** Normalize semantic identifiers into language-neutral hint tokens. */
function semanticTokens(node: SourceNodeData): ReadonlySet<string> {
  const raw = [node.semanticPath, node.name, node.path, node.filePath].filter((value): value is string => value !== undefined).join(' ');
  return new Set(
    raw
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean)
      .map((token) => token.replace(/[-_]/g, '')),
  );
}

/*** Identify model roles expected to sit near external technology. */
function isOuterRole(modelId: ArchitectureModel['id'], roleId: string): boolean {
  const outerByModel: Readonly<Record<ArchitectureModel['id'], readonly string[]>> = {
    hexagonal: ['adapter', 'composition'],
    clean: ['framework', 'interface-adapter', 'composition'],
    onion: ['infrastructure', 'presentation', 'composition'],
    layered: ['data-source', 'presentation', 'composition'],
  };
  return outerByModel[modelId].includes(roleId);
}

/*** Stabilize serializable confidence values for deterministic consumers. */
function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
