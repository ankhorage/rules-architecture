import type { SourceGraph } from '@ankhorage/dependency-graph';
import { createRuleRegistry, evaluateConfiguredRules, evaluateRules } from '@ankhorage/rules';

import type {
  ArchitectureProfile,
  ArchitectureProfileEvaluationOptions,
  ArchitectureProfileEvaluationResult,
  ArchitectureProfileRuleContext,
} from '../../../types/architectureProfile.js';
import { hasSourceCapability } from '../../../utils/hasSourceCapability.js';
import { createArchitectureProfileRuleSet } from './createArchitectureProfileRuleSet.js';
import { findArchitectureProfile } from './findArchitectureProfile.js';

/*** Evaluate one explicitly selected project profile through the generic Rules engine. */
export function evaluateArchitectureProfile(
  graph: SourceGraph,
  profileId: ArchitectureProfile['id'],
  options: ArchitectureProfileEvaluationOptions = {},
): ArchitectureProfileEvaluationResult {
  const profile = findArchitectureProfile(profileId);
  const context: ArchitectureProfileRuleContext = { graph, profile };
  const ruleSet = createArchitectureProfileRuleSet(profileId);
  const capabilities = hasSourceCapability(graph, 'imports') ? ['source-graph.imports'] : [];
  const result =
    options.config === undefined
      ? evaluateRules(context, ruleSet.rules, { capabilities })
      : evaluateConfiguredRules(context, options.config, createRuleRegistry([ruleSet]), {
          capabilities,
        });
  return {
    ...result,
    baseModelId: profile.baseModelId,
    profileId: profile.id,
  };
}
