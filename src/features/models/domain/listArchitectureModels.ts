import type { ArchitectureModel } from '../../../types/architectureModel.js';
import { ARCHITECTURE_MODELS } from '../constants/architectureModels.js';

/*** List established architecture models without inferring a project's target. */
export function listArchitectureModels(): readonly ArchitectureModel[] {
  return ARCHITECTURE_MODELS;
}
