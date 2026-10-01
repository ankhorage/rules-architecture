import { listArchitectureModels } from '../../../features/models/domain/listArchitectureModels.js';

/*** Execute `ankh rules-architecture models list` through the public model registry. */
export function list(argv: readonly string[]): {
  readonly exitCode: number;
  readonly stdout: string;
} {
  const json = parseJsonFlag(argv);
  const models = listArchitectureModels();
  return {
    exitCode: 0,
    stdout: json
      ? `${JSON.stringify({ models }, null, 2)}\n`
      : [
          'rules-architecture models list',
          ...models.map(
            (model) =>
              `- ${model.id}: ${model.name} (${model.roles.map(({ id }) => id).join(', ')})`,
          ),
          '',
        ].join('\n'),
  };
}

/*** Accept only the optional JSON rendering flag for model listing. */
function parseJsonFlag(argv: readonly string[]): boolean {
  if (argv.length === 0) return false;
  if (argv.length === 1 && argv[0] === '--json') return true;
  throw new Error('ankh rules-architecture models list accepts only --json.');
}
