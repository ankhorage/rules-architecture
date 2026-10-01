import type {
  SourceCapability,
  SourceEdgeData,
  SourceGraph,
  SourceNodeData,
} from '@ankhorage/dependency-graph';

import type {
  ArchitectureContradiction,
  ArchitectureDetectionCandidate,
  ArchitectureDetectionEvidence,
  ArchitectureDetectionResult,
  ArchitectureRoleAssignment,
} from '../../../types/architectureAnalysis.js';
import type { ArchitectureModel } from '../../../types/architectureModel.js';
import { listArchitectureModels } from '../../models/domain/listArchitectureModels.js';
import { inferArchitectureRoles } from './inferArchitectureRoles.js';

const DETECTION_CAPABILITIES: readonly SourceCapability[] = [
  'declarations',
  'extends',
  'implements',
  'imports',
];

/*** Detect plausible architecture models from observed graph facts without selecting an enforcement target. */
export function detectArchitecture(graph: SourceGraph): ArchitectureDetectionResult {
  const candidates = listArchitectureModels()
    .map((model) => candidateForModel(graph, model))
    .sort((left, right) => right.score - left.score || compareText(left.modelId, right.modelId));

  return { candidates };
}

interface ClassifiedDependency {
  readonly allowed: boolean;
  readonly edge: {
    readonly data: SourceEdgeData;
    readonly source: number;
    readonly target: number;
  };
  readonly source: SourceNodeData;
  readonly sourceRole: ArchitectureRoleAssignment;
  readonly target: SourceNodeData;
  readonly targetRole: ArchitectureRoleAssignment;
}

/*** Build one scored model candidate while preserving ambiguity, evidence, and contradictions. */
function candidateForModel(
  graph: SourceGraph,
  model: ArchitectureModel,
): ArchitectureDetectionCandidate {
  const roleAssignments = inferArchitectureRoles(graph, model);
  const classified = classifyDependencies(graph, model, roleAssignments);
  const supportingEdges = classified.filter(({ allowed }) => allowed);
  const contradictions = classified
    .filter(({ allowed }) => !allowed)
    .map(({ edge, source, target, sourceRole, targetRole }) =>
      contradiction(
        edge.data.kind,
        source.semanticPath,
        target.semanticPath,
        sourceRole,
        targetRole,
      ),
    );
  const confidence = candidateConfidence(
    graph,
    model,
    roleAssignments,
    classified,
    supportingEdges,
  );

  return {
    modelId: model.id,
    confidence,
    score: Math.round(confidence * 100),
    roleAssignments,
    supportingEvidence: supportingEvidence(
      roleAssignments,
      supportingEdges.length,
      classified.length,
    ),
    contradictions,
    unavailableCapabilities: unavailableDetectionCapabilities(graph),
  };
}

/*** Classify only dependencies whose endpoints have inferred semantic roles. */
function classifyDependencies(
  graph: SourceGraph,
  model: ArchitectureModel,
  assignments: readonly ArchitectureRoleAssignment[],
): readonly ClassifiedDependency[] {
  const roleByPath = new Map(
    assignments.map((assignment) => [assignment.semanticPath, assignment]),
  );
  const nodeById = new Map(graph.graph.nodes.map((node) => [node.id, node.data]));

  return graph.graph.edges.flatMap((edge) => {
    if (
      edge.data.kind !== 'imports' &&
      edge.data.kind !== 'extends' &&
      edge.data.kind !== 'implements'
    ) {
      return [];
    }
    const source = nodeById.get(edge.source);
    const target = nodeById.get(edge.target);
    if (source === undefined || target === undefined) return [];
    const sourceRole = roleByPath.get(source.semanticPath);
    const targetRole = roleByPath.get(target.semanticPath);
    if (sourceRole === undefined || targetRole === undefined) return [];
    const allowed = model.allowedDependencies.some(
      (dependency) =>
        dependency.source === sourceRole.roleId && dependency.target === targetRole.roleId,
    );
    return [{ edge, source, target, sourceRole, targetRole, allowed }];
  });
}

/*** Score one candidate from role coverage, confidence, topology conformance, and capabilities. */
function candidateConfidence(
  graph: SourceGraph,
  model: ArchitectureModel,
  assignments: readonly ArchitectureRoleAssignment[],
  classified: readonly ClassifiedDependency[],
  supporting: readonly ClassifiedDependency[],
): number {
  const eligibleNodes = graph.graph.nodes.filter(({ data }) => isEligibleNode(data)).length;
  const assignmentCoverage = eligibleNodes === 0 ? 0 : assignments.length / eligibleNodes;
  const averageConfidence =
    assignments.length === 0
      ? 0
      : assignments.reduce((sum, assignment) => sum + assignment.confidence, 0) /
        assignments.length;
  const topologyConformance = classified.length === 0 ? 0.5 : supporting.length / classified.length;
  const representedRoles = new Set(assignments.map(({ roleId }) => roleId)).size;
  const roleCoverage = model.roles.length === 0 ? 0 : representedRoles / model.roles.length;
  const unavailable = unavailableDetectionCapabilities(graph);
  const capabilityFactor = 1 - unavailable.length / (DETECTION_CAPABILITIES.length * 2);
  const rawScore =
    averageConfidence * 0.35 +
    assignmentCoverage * 0.25 +
    topologyConformance * 0.25 +
    roleCoverage * 0.15;

  return round(Math.max(0, Math.min(1, rawScore * capabilityFactor)));
}

/*** Keep candidate coverage focused on internal executable/declaration source nodes. */
function isEligibleNode(node: SourceNodeData): boolean {
  return (
    node.classification !== 'vendor' &&
    node.kind !== 'project' &&
    node.kind !== 'package' &&
    node.kind !== 'directory'
  );
}

/*** Convert one forbidden inferred dependency into explicit contradictory evidence. */
function contradiction(
  relationKind: string,
  sourceSemanticPath: string,
  targetSemanticPath: string,
  sourceRole: ArchitectureRoleAssignment,
  targetRole: ArchitectureRoleAssignment,
): ArchitectureContradiction {
  return {
    relationKind,
    sourceSemanticPath,
    targetSemanticPath,
    sourceRole: sourceRole.roleId,
    targetRole: targetRole.roleId,
    message: `${sourceRole.roleId} -> ${targetRole.roleId} is not allowed by the inferred model.`,
  };
}

/*** Summarize role and topology support without overwhelming consumers with every observed edge. */
function supportingEvidence(
  assignments: readonly ArchitectureRoleAssignment[],
  supportingEdges: number,
  classifiedEdges: number,
): readonly ArchitectureDetectionEvidence[] {
  const roleEvidence = assignments
    .filter(({ confidence }) => confidence >= 0.45)
    .slice(0, 20)
    .map(({ semanticPath, roleId, confidence }) => ({
      kind: 'topology' as const,
      semanticPath,
      message: `Inferred role "${roleId}" with confidence ${confidence}.`,
      weight: confidence,
    }));
  const dependencyEvidence: ArchitectureDetectionEvidence[] =
    classifiedEdges === 0
      ? []
      : [
          {
            kind: 'dependency',
            message: `${supportingEdges} of ${classifiedEdges} classified dependencies follow this model's direction.`,
            weight: supportingEdges / classifiedEdges,
          },
        ];
  return [...roleEvidence, ...dependencyEvidence];
}

/*** Report capabilities that cannot safely be treated as negative architecture evidence. */
function unavailableDetectionCapabilities(graph: SourceGraph): readonly SourceCapability[] {
  if (graph.capabilities.length === 0) return DETECTION_CAPABILITIES;
  return DETECTION_CAPABILITIES.filter((capability) =>
    graph.capabilities.some(({ available }) => !available.includes(capability)),
  );
}

/*** Stabilize serializable detection confidence. */
function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/*** Compare stable identifiers by code units instead of locale-sensitive collation. */
function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
