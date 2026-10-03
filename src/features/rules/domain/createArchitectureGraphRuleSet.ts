import {
  createSourceGraphIndex,
  rollupSourceRelations,
  type SourceGraph,
  type SourceRollupEdge,
} from '@ankhorage/dependency-graph';
import { findCyclicComponents, type Graph } from '@ankhorage/graph';
import type { Rule, RuleFinding, RuleOptionDiagnostic, RuleSet } from '@ankhorage/rules';

import type {
  ArchitectureCycleRuleOptions,
  ArchitectureGraphRuleContext,
} from '../../../types/architectureAnalysis.js';

const IMPORTS_CAPABILITY = 'source-graph.imports';

/*** Create target-independent Architecture Rules over canonical source facts. */
export function createArchitectureGraphRuleSet(): RuleSet<ArchitectureGraphRuleContext> {
  return {
    id: 'architecture.graph',
    rules: [createCyclicDependenciesRule()],
  };
}

/*** Create the reusable cyclic-dependencies rule for any context that exposes one SourceGraph. */
export function createCyclicDependenciesRule<
  TContext extends ArchitectureGraphRuleContext,
>(): Rule<TContext, ArchitectureCycleRuleOptions> {
  return {
    id: 'cyclic-dependencies',
    summary: 'Source dependencies must not form cyclic intrinsic components.',
    defaultSeverity: 'warning',
    requiredCapabilities: [IMPORTS_CAPABILITY],
    validateOptions: validateCycleOptions,
    evaluate: ({ context, options }) =>
      cycleFindings(context.graph, options?.aggregation ?? 'file'),
  };
}

/*** Validate the optional cycle aggregation level without consumer-specific configuration. */
function validateCycleOptions(options: unknown): readonly RuleOptionDiagnostic[] {
  if (options === undefined) return [];
  if (!isRecord(options)) return [{ code: 'invalid-options', message: 'Options must be an object.' }];
  const aggregation = options.aggregation;
  if (aggregation === undefined || aggregation === 'file' || aggregation === 'package') return [];
  return [
    {
      code: 'invalid-options',
      message: 'aggregation must be "file" or "package".',
      path: 'aggregation',
    },
  ];
}

/*** Convert canonical source dependencies into deterministic generic cycle findings. */
function cycleFindings(
  sourceGraph: SourceGraph,
  aggregation: NonNullable<ArchitectureCycleRuleOptions['aggregation']>,
): readonly RuleFinding[] {
  const cycleGraph =
    aggregation === 'file' ? fileCycleGraph(sourceGraph) : packageCycleGraph(sourceGraph);
  const nodeById = new Map(cycleGraph.graph.nodes.map((node) => [node.id, node.data]));
  return findCyclicComponents(cycleGraph.graph).map((component) => {
    const componentIds = new Set(component);
    const semanticPaths = component
      .flatMap((id) => {
        const node = nodeById.get(id);
        return node === undefined ? [] : [node.semanticPath];
      })
      .sort();
    const evidenceEdgeIds = cycleGraph.evidence
      .filter(({ source, target }) => componentIds.has(source) && componentIds.has(target))
      .flatMap(({ evidenceEdgeIds }) => evidenceEdgeIds)
      .sort((left, right) => left - right);

    return {
      ruleId: 'cyclic-dependencies',
      severity: 'warning',
      message: `Cyclic ${aggregation} dependency component: ${semanticPaths.join(' -> ')}`,
      subjects: semanticPaths.map((path) => ({ id: path, kind: 'source-node', path })),
      evidence: {
        aggregation,
        evidenceEdgeIds,
        relationKind: 'imports',
        semanticPaths,
      },
    };
  });
}

interface CycleGraph {
  readonly graph: Graph<SourceGraph['graph']['nodes'][number]['data'], unknown, number>;
  readonly evidence: readonly SourceRollupEdge[];
}

/*** Build a file-level cycle graph while preserving original edge IDs as evidence references. */
function fileCycleGraph(sourceGraph: SourceGraph): CycleGraph {
  const fileIds = new Set(
    sourceGraph.graph.nodes
      .filter(({ data }) => data.kind === 'file' && data.classification === 'intrinsic')
      .map(({ id }) => id),
  );
  const edges = sourceGraph.graph.edges.filter(
    ({ source, target, data }) =>
      data.kind === 'imports' && fileIds.has(source) && fileIds.has(target),
  );
  return {
    graph: {
      nodes: sourceGraph.graph.nodes.filter(({ id }) => fileIds.has(id)),
      edges: edges.map(({ id, source, target }) => ({ id, source, target, data: {} })),
    },
    evidence: edges.map(({ id, source, target }) => ({
      source,
      target,
      sourceSemanticPath: '',
      targetSemanticPath: '',
      weight: 1,
      evidenceEdgeIds: [id],
    })),
  };
}

/*** Build a package-level cycle graph from the canonical deterministic import rollup. */
function packageCycleGraph(sourceGraph: SourceGraph): CycleGraph {
  const index = createSourceGraphIndex(sourceGraph);
  const rollups = rollupSourceRelations(sourceGraph, index, 'package', 'imports');
  const intrinsicPackageIds = new Set(
    sourceGraph.graph.nodes
      .filter(
        ({ data }) =>
          data.kind === 'package' &&
          data.classification !== 'vendor' &&
          data.classification !== 'unknown',
      )
      .map(({ id }) => id),
  );
  const edges = rollups.filter(
    ({ source, target }) => intrinsicPackageIds.has(source) && intrinsicPackageIds.has(target),
  );
  return {
    graph: {
      nodes: sourceGraph.graph.nodes.filter(({ id }) => intrinsicPackageIds.has(id)),
      edges: edges.map(({ source, target }, index) => ({ id: index, source, target, data: {} })),
    },
    evidence: edges,
  };
}

/*** Narrow generic Rules options without adding a runtime schema dependency. */
function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
