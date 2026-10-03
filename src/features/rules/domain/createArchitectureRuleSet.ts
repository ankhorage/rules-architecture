import type { SourceRelationKind } from '@ankhorage/dependency-graph';
import type { Rule, RuleFinding, RuleSet } from '@ankhorage/rules';

import type { ArchitectureRuleContext } from '../../../types/architectureAnalysis.js';
import type { ArchitectureModel } from '../../../types/architectureModel.js';
import { findArchitectureModel } from '../../models/domain/findArchitectureModel.js';
import { createCyclicDependenciesRule } from './createArchitectureGraphRuleSet.js';

const IMPORTS_CAPABILITY = 'source-graph.imports';

/*** Create architecture rules for one explicitly selected target model. */
export function createArchitectureRuleSet(
  modelId: ArchitectureModel['id'],
): RuleSet<ArchitectureRuleContext> {
  const model = findArchitectureModel(modelId);
  return {
    id: `architecture.${model.id}`,
    rules: [createCyclicDependenciesRule<ArchitectureRuleContext>(), dependencyDirectionRule()],
  };
}

/*** Enforce dependency direction only against the explicit selected target model. */
function dependencyDirectionRule(): Rule<ArchitectureRuleContext> {
  return {
    id: 'architecture-dependency-direction',
    summary: 'Classified source dependencies must follow the selected architecture model.',
    defaultSeverity: 'warning',
    requiredCapabilities: [IMPORTS_CAPABILITY],
    evaluate: ({ context }) => directionFindings(context),
  };
}

/*** Report selected-model dependency violations for confidently inferred endpoint roles. */
function directionFindings(context: ArchitectureRuleContext): readonly RuleFinding[] {
  const roleByPath = new Map(
    context.roleAssignments.map((assignment) => [assignment.semanticPath, assignment]),
  );
  const nodeById = new Map(context.graph.graph.nodes.map((node) => [node.id, node.data]));

  return context.graph.graph.edges.flatMap((edge) => {
    if (!isDependencyRelation(edge.data.kind)) return [];
    const source = nodeById.get(edge.source);
    const target = nodeById.get(edge.target);
    if (source === undefined || target === undefined) return [];
    const sourceRole = roleByPath.get(source.semanticPath);
    const targetRole = roleByPath.get(target.semanticPath);
    if (sourceRole === undefined || targetRole === undefined) return [];
    if (sourceRole.confidence < 0.3 || targetRole.confidence < 0.3) return [];
    const allowed = context.model.allowedDependencies.some(
      (dependency) =>
        dependency.source === sourceRole.roleId && dependency.target === targetRole.roleId,
    );
    if (allowed) return [];

    const [evidence] = edge.data.evidence;
    return [
      {
        ruleId: 'architecture-dependency-direction',
        severity: 'warning',
        message: `${sourceRole.roleId} must not depend on ${targetRole.roleId} in ${context.model.name}.`,
        subjects: [
          { id: source.semanticPath, kind: source.kind, path: source.filePath ?? source.path },
          { id: target.semanticPath, kind: target.kind, path: target.filePath ?? target.path },
        ],
        sourceLocation:
          evidence?.location === undefined
            ? undefined
            : { ...evidence.location, path: evidence.sourcePath },
        evidence: {
          modelId: context.model.id,
          relationKind: edge.data.kind,
          sourceRole: sourceRole.roleId,
          sourceSemanticPath: source.semanticPath,
          targetRole: targetRole.roleId,
          targetSemanticPath: target.semanticPath,
        },
      },
    ];
  });
}

/*** Restrict architecture direction rules to static source dependency relations. */
function isDependencyRelation(kind: SourceRelationKind): boolean {
  return kind === 'imports' || kind === 'extends' || kind === 'implements';
}
