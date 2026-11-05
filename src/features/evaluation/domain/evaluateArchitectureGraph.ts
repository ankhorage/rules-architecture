import type { SourceGraph } from '@ankhorage/dependency-graph';
import { createRuleRegistry, evaluateConfiguredRules, evaluateRules } from '@ankhorage/rules';

import type {
  ArchitectureGraphEvaluationOptions,
  ArchitectureGraphEvaluationResult,
  ArchitectureGraphRuleContext,
} from '../../../types/architectureAnalysis.js';
import { hasSourceCapability } from '../../../utils/hasSourceCapability.js';
import { createArchitectureGraphRuleSet } from '../../rules/domain/createArchitectureGraphRuleSet.js';

/*** Evaluate target-independent source-graph rules without inferring or enforcing an architecture model. */
export function evaluateArchitectureGraph(
  graph: SourceGraph,
  options: ArchitectureGraphEvaluationOptions = {},
): ArchitectureGraphEvaluationResult {
  const context: ArchitectureGraphRuleContext = { graph };
  const ruleSet = createArchitectureGraphRuleSet();
  const evaluationOptions = {
    capabilities: hasSourceCapability(graph, 'imports') ? ['source-graph.imports'] : [],
    scope: { id: 'architecture-graph', kind: 'source-graph' },
  };

  return options.config === undefined
    ? evaluateRules(context, ruleSet.rules, evaluationOptions)
    : evaluateConfiguredRules(
        context,
        options.config,
        createRuleRegistry([ruleSet]),
        evaluationOptions,
      );
}
