import type { RuleSet } from '@ankhorage/rules';

import type { ArchitectureGraphRuleContext } from '../../../types/architectureAnalysis.js';
import { createCyclicDependenciesRule } from './createCyclicDependenciesRule.js';

/*** Create target-independent Architecture Rules over canonical source facts. */
export function createArchitectureGraphRuleSet(): RuleSet<ArchitectureGraphRuleContext> {
  return {
    id: 'architecture.graph',
    rules: [createCyclicDependenciesRule<ArchitectureGraphRuleContext>()],
  };
}
