import type { SourceGraph } from '@ankhorage/dependency-graph';
import type { RuleEvaluationResult, RulesConfig } from '@ankhorage/rules';

import type { ArchitectureModel } from './architectureModel.js';

/*** One inward source role whose imports must not cross into configured outward segments. */
export interface ArchitectureProfileRole {
  readonly forbiddenOutwardSegments: readonly string[];
  readonly id: 'application' | 'domain' | 'ports';
  readonly label: string;
  readonly segments: readonly string[];
  readonly ruleId: string;
}

/*** One feature-role combination that requires at least one inward owner to exist. */
export interface ArchitectureProfileFeatureCombination {
  readonly requiresAnyOf: readonly string[];
  readonly role: 'adapters' | 'composition';
  readonly ruleId: string;
}

/*** Project-specific source conventions layered on top of one generic architecture model. */
export interface ArchitectureProfile {
  readonly baseModelId: ArchitectureModel['id'];
  readonly id: 'ankhorage';
  readonly interpretation: string;
  readonly name: string;
  readonly source: {
    readonly deliveryEdgeDirectories: readonly string[];
    readonly facadeFiles: readonly string[];
    readonly featureCombinations: readonly ArchitectureProfileFeatureCombination[];
    readonly featureRoot: string;
    readonly inwardFeatureRoles: readonly string[];
    readonly packageWideDirectories: readonly string[];
    readonly roles: readonly ArchitectureProfileRole[];
    readonly thinDeliveryAdapter: {
      readonly concreteAdapterSegment: string;
      readonly pathSegments: readonly string[];
      readonly ruleId: string;
    };
  };
}

/*** Architecture-profile Rules context built from language-neutral source facts. */
export interface ArchitectureProfileRuleContext {
  readonly graph: SourceGraph;
  readonly profile: ArchitectureProfile;
}

/*** Optional generic Rules configuration for explicit architecture-profile evaluation. */
export interface ArchitectureProfileEvaluationOptions {
  readonly config?: RulesConfig;
}

/*** Generic Rules result plus the explicitly selected architecture profile. */
export interface ArchitectureProfileEvaluationResult extends RuleEvaluationResult {
  readonly baseModelId: ArchitectureModel['id'];
  readonly profileId: ArchitectureProfile['id'];
}
