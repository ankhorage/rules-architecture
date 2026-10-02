export { detectArchitecture } from './features/detection/domain/detectArchitecture.js';
export { inferArchitectureRoles } from './features/detection/domain/inferArchitectureRoles.js';
export { evaluateArchitecture } from './features/evaluation/domain/evaluateArchitecture.js';
export { createArchitectureProfileRuleSet } from './features/profiles/domain/createArchitectureProfileRuleSet.js';
export { evaluateArchitectureProfile } from './features/profiles/domain/evaluateArchitectureProfile.js';
export { listArchitectureProfiles } from './features/profiles/domain/listArchitectureProfiles.js';
export { listArchitectureModels } from './features/models/domain/listArchitectureModels.js';
export { createArchitectureRuleSet } from './features/rules/domain/createArchitectureRuleSet.js';
export type {
  ArchitectureContradiction,
  ArchitectureDetectionCandidate,
  ArchitectureDetectionEvidence,
  ArchitectureDetectionResult,
  ArchitectureEvaluationOptions,
  ArchitectureEvaluationResult,
  ArchitectureRoleAssignment,
  ArchitectureRuleContext,
} from './types/architectureAnalysis.js';
export type {
  ArchitectureModel,
  ArchitectureRole,
  ArchitectureRoleDependency,
} from './types/architectureModel.js';

export type {
  ArchitectureProfile,
  ArchitectureProfileEvaluationOptions,
  ArchitectureProfileEvaluationResult,
  ArchitectureProfileFeatureCombination,
  ArchitectureProfileRole,
  ArchitectureProfileRuleContext,
} from './types/architectureProfile.js';
