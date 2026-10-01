import { resolve } from 'node:path';

import { createSourceGraphAsync } from '@ankhorage/dependency-graph';

import { detectArchitecture } from '../../features/detection/domain/detectArchitecture.js';
import { parseArchitectureCommandOptions } from '../utils/parseArchitectureCommandOptions.js';

/*** Execute architecture detection without converting inference into enforcement. */
export async function detect(
  argv: readonly string[],
  cwd: string,
): Promise<{ readonly exitCode: number; readonly stdout: string }> {
  const options = parseArchitectureCommandOptions(argv);
  if (options.configPath !== undefined) {
    throw new Error('ankh rules-architecture detect does not accept --config.');
  }
  const target = resolve(cwd, options.target);
  const graph = await createSourceGraphAsync({ projects: [{ id: 'target', rootPath: target }] });
  const detected = detectArchitecture(graph);
  const candidates =
    options.modelId === undefined
      ? detected.candidates
      : detected.candidates.filter(({ modelId }) => modelId === options.modelId);

  return {
    exitCode: 0,
    stdout: options.json
      ? `${JSON.stringify({ target, candidates }, null, 2)}\n`
      : renderDetection(target, candidates),
  };
}

/*** Render candidate uncertainty and contradictions without presenting a detected winner as fact. */
function renderDetection(
  target: string,
  candidates: ReturnType<typeof detectArchitecture>['candidates'],
): string {
  return [
    'rules-architecture detect',
    `target: ${target}`,
    ...candidates.map(
      (candidate) =>
        `- ${candidate.modelId}: score=${candidate.score}, confidence=${candidate.confidence}, roles=${candidate.roleAssignments.length}, contradictions=${candidate.contradictions.length}`,
    ),
    '',
  ].join('\n');
}
