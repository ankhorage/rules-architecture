import type { SourceCapability, SourceGraph } from '@ankhorage/dependency-graph';
import type { RuleEvaluationResult, RulesConfig } from '@ankhorage/rules';

import type { ArchitectureModel } from './architectureModel.js';

/*** One serializable reason supporting an inferred architecture role or candidate. */
export interface ArchitectureDetectionEvidence {
  readonly kind: 'capability' | 'declaration' | 'dependency' | 'path' | 'topology';
  readonly message: string;
  readonly semanticPath?: string;
  readonly weight: number;
}

/*** One semantic role inferred from graph evidence without changing observed source facts. */
export interface ArchitectureRoleAssignment {
  readonly confidence: number;
  readonly evidence: readonly ArchitectureDetectionEvidence[];
  readonly roleId: string;
  readonly semanticPath: string;
}

/*** One observed dependency that contradicts an inferred model role direction. */
export interface ArchitectureContradiction {
  readonly message: string;
  readonly relationKind: string;
  readonly sourceRole: string;
  readonly sourceSemanticPath: string;
  readonly targetRole: string;
  readonly targetSemanticPath: string;
}

/*** A plausible architecture interpretation with explicit uncertainty and limitations. */
export interface ArchitectureDetectionCandidate {
  readonly confidence: number;
  readonly contradictions: readonly ArchitectureContradiction[];
  readonly modelId: ArchitectureModel['id'];
  readonly roleAssignments: readonly ArchitectureRoleAssignment[];
  readonly score: number;
  readonly supportingEvidence: readonly ArchitectureDetectionEvidence[];
  readonly unavailableCapabilities: readonly SourceCapability[];
}

/*** Architecture analysis result that may contain several plausible models. */
export interface ArchitectureDetectionResult {
  readonly candidates: readonly ArchitectureDetectionCandidate[];
}

/*** Architecture-specific Rules context built from an explicit target model. */
export interface ArchitectureRuleContext {
  readonly graph: SourceGraph;
  readonly model: ArchitectureModel;
  readonly roleAssignments: readonly ArchitectureRoleAssignment[];
}

/*** Optional generic Rules configuration for explicit architecture evaluation. */
export interface ArchitectureEvaluationOptions {
  readonly config?: RulesConfig;
}

/*** Generic Rules result plus the explicit target and inferred role evidence used for evaluation. */
export interface ArchitectureEvaluationResult extends RuleEvaluationResult {
  readonly modelId: ArchitectureModel['id'];
  readonly roleAssignments: readonly ArchitectureRoleAssignment[];
}
