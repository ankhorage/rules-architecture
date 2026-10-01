import type { ArchitectureModel } from './architectureModel.js';

/*** Parsed command options shared by architecture detection and explicit evaluation delivery edges. */
export interface ArchitectureCommandOptions {
  readonly configPath?: string;
  readonly json: boolean;
  readonly modelId?: ArchitectureModel['id'];
  readonly target: string;
}
