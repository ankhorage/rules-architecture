import type { SourceCapability, SourceGraph } from '@ankhorage/dependency-graph';
import { createRuleRegistry, evaluateConfiguredRules, evaluateRules } from '@ankhorage/rules';

import type {
  ArchitectureEvaluationOptions,
  ArchitectureEvaluationResult,
  ArchitectureRuleContext,
} from '../../../types/architectureAnalysis.js';
import type { ArchitectureModel } from '../../../types/architectureModel.js';
import { inferArchitectureRoles } from '../../detection/domain/inferArchitectureRoles.js';
import { findArchitectureModel } from '../../models/domain/findArchitectureModel.js';
import { createArchitectureRuleSet } from '../../rules/domain/createArchitectureRuleSet.js';

const CAPABILITY_NAMES: readonly (readonly [SourceCapability, string])[] = [
  ['imports', 'source-graph.imports'],
  ['extends', 'source-graph.extends'],
  ['implements', 'source-graph.implements'],
];

/*** Evaluate one explicitly selected architecture model through the generic Rules engine. */
export function evaluateArchitecture(
  graph: SourceGraph,
  modelId: ArchitectureModel['id'],
  options: ArchitectureEvaluationOptions = {},
): ArchitectureEvaluationResult {
  const model = findArchitectureModel(modelId);
  const roleAssignments = inferArchitectureRoles(graph, model);
  const context: ArchitectureRuleContext = { graph, model, roleAssignments };
  const ruleSet = createArchitectureRuleSet(modelId);
  const capabilities = availableRuleCapabilities(graph);
  const result =
    options.config === undefined
      ? evaluateRules(context, ruleSet.rules, { capabilities })
      : evaluateConfiguredRules(context, options.config, createRuleRegistry([ruleSet]), {
          capabilities,
        });

  return {
    ...result,
    modelId,
    roleAssignments,
  };
}

/*** Translate analyzer capability reports into generic Rules capability identifiers. */
function availableRuleCapabilities(graph: SourceGraph): readonly string[] {
  if (graph.capabilities.length === 0) return [];
  return CAPABILITY_NAMES.flatMap(([sourceCapability, ruleCapability]) =>
    graph.capabilities.every(({ available }) => available.includes(sourceCapability))
      ? [ruleCapability]
      : [],
  );
}
