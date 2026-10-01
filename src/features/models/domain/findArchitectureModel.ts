import type { ArchitectureModel } from '../../../types/architectureModel.js';
import { ARCHITECTURE_MODELS } from '../constants/architectureModels.js';

/*** Resolve one built-in architecture model or reject an unsupported explicit target. */
export function findArchitectureModel(modelId: ArchitectureModel['id']): ArchitectureModel {
  const model = ARCHITECTURE_MODELS.find(({ id }) => id === modelId);
  if (model === undefined) throw new Error(`Unknown architecture model: ${modelId}`);
  return model;
}
