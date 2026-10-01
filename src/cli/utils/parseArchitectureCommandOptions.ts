import { listArchitectureModels } from '../../features/models/domain/listArchitectureModels.js';
import type { ArchitectureCommandOptions } from '../../types/architectureCli.js';
import type { ArchitectureModel } from '../../types/architectureModel.js';

/*** Parse shared architecture CLI flags without selecting a default enforcement model. */
export function parseArchitectureCommandOptions(
  argv: readonly string[],
): ArchitectureCommandOptions {
  return parseTokens(argv, { json: false, target: '.' });
}

/*** Recursively parse flags and the optional positional target without mutable parser state. */
function parseTokens(
  tokens: readonly string[],
  state: ArchitectureCommandOptions,
): ArchitectureCommandOptions {
  const [token, ...rest] = tokens;
  if (token === undefined) return state;
  if (token === '--json') return parseTokens(rest, { ...state, json: true });
  if (token === '--model') {
    const [value, ...remaining] = rest;
    if (value === undefined || !isArchitectureModelId(value)) {
      throw new Error(
        `--model requires one of: ${listArchitectureModels()
          .map(({ id }) => id)
          .join(', ')}`,
      );
    }
    return parseTokens(remaining, { ...state, modelId: value });
  }
  if (token === '--config') {
    const [value, ...remaining] = rest;
    if (value === undefined) throw new Error('--config requires a file path.');
    return parseTokens(remaining, { ...state, configPath: value });
  }
  if (token.startsWith('-')) throw new Error(`Unknown option: ${token}`);
  if (state.target !== '.') throw new Error('Only one project target may be supplied.');
  return parseTokens(rest, { ...state, target: token });
}

/*** Narrow arbitrary CLI input to a supported built-in architecture model ID. */
function isArchitectureModelId(value: string): value is ArchitectureModel['id'] {
  return listArchitectureModels().some(({ id }) => id === value);
}
