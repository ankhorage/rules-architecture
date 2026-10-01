import type { SourceCapability, SourceGraph } from '@ankhorage/dependency-graph';

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
    .sort((left, right) => right.score - left.score || left.modelId.localeCompare(right.modelId));

  return { candidates };
}

/*** Build one scored model candidate while preserving ambiguity, evidence, and contradictions. */
function candidateForModel(graph: SourceGraph, model: ArchitectureModel): ArchitectureDetectionCandidate {
  const roleAssignments = inferArchitectureRoles(graph, model);
  const roleByPath = new Map(roleAssignments.map((assignment) => [assignment.semanticPath, assignment]));
  const dependencies = graph.graph.edges.filter(({ data }) =>
    data.kind === 'imports' || data.kind === 'extends' || data.kind === 'implements',
  );
  const nodeById = new Map(graph.graph.nodes.map((node) => [node.id, node.data]));
  const classified = dependencies.flatMap((edge) => {
    const source = nodeById.get(edge.source);
    const target = nodeById.get(edge.target);
    if (source === undefined || target === undefined) return [];
    const sourceRole = roleByPath.get(source.semanticPath);
    const targetRole = roleByPath.get(target.semanticPath);
    if (sourceRole === undefined || targetRole === undefined) return [];
    const allowed = model.allowedDependencies.some(
      (dependency) => dependency.source === sourceRole.roleId && dependency.target === targetRole.roleId,
    );
    return [{ edge, source, target, sourceRole, targetRole, allowed }];
  });
  const contradictions = classified
    .filter(({ allowed }) => !allowed)
    .map(({ edge, source, target, sourceRole, targetRole }) =>
      contradiction(edge.data.kind, source.semanticPath, target.semanticPath, sourceRole, targetRole),
    );
  const supportingEdges = classified.filter(({ allowed }) => allowed);
  const eligibleNodes = graph.graph.nodes.filter(({ data }) =>
    data.classification !== 'vendor' && data.kind !== 'project' && data.kind !== 'package' && data.kind !== 'directory',
  ).length;
  const assignmentCoverage = eligibleNodes === 0 ? 0 : roleAssignments.length / eligibleNodes;
  const averageConfidence = roleAssignments.length === 0
    ? 0
    : roleAssignments.reduce((sum, assignment) => sum + assignment.confidence, 0) / roleAssignments.length;
  const topologyConformance = classified.length === 0 ? 0.5 : supportingEdges.length / classified.length;
  const representedRoles = new Set(roleAssignments.map(({ roleId }) => roleId)).size;
  const roleCoverage = model.roles.length === 0 ? 0 : representedRoles / model.roles.length;
  const unavailableCapabilities = unavailableDetectionCapabilities(graph);
  const capabilityFactor = 1 - unavailableCapabilities.length / (DETECTION_CAPABILITIES.length * 2);
  const rawScore =
    averageConfidence * 0.35 +
    assignmentCoverage * 0.25 +
    topologyConformance * 0.25 +
    roleCoverage * 0.15;
  const confidence = round(Math.max(0, Math.min(1, rawScore * capabilityFactor)));

  return {
    modelId: model.id,
    confidence,
    score: Math.round(confidence * 100),
    roleAssignments,
    supportingEvidence: supportingEvidence(roleAssignments, supportingEdges.length, classified.length),
    contradictions,
    unavailableCapabilities,
  };
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
  const dependencyEvidence: ArchitectureDetectionEvidence[] = classifiedEdges === 0
    ? []
    : [{
        kind: 'dependency',
        message: `${supportingEdges} of ${classifiedEdges} classified dependencies follow this model's direction.`,
        weight: supportingEdges / classifiedEdges,
      }];
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
