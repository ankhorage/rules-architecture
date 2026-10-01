import { resolve } from 'node:path';

import { createSourceGraphAsync } from '@ankhorage/dependency-graph';
import { readRulesConfigAsync } from '@ankhorage/rules';

import { evaluateArchitecture } from '../../features/evaluation/domain/evaluateArchitecture.js';
import { parseArchitectureCommandOptions } from '../parseArchitectureCommandOptions.js';

/*** Execute explicit target-architecture evaluation through the generic Rules engine. */
export async function evaluate(
  argv: readonly string[],
  cwd: string,
): Promise<{ readonly exitCode: number; readonly stdout: string }> {
  const options = parseArchitectureCommandOptions(argv);
  if (options.modelId === undefined) {
    throw new Error('ankh rules-architecture evaluate requires --model <id>.');
  }
  const target = resolve(cwd, options.target);
  const config = await readConfig(options.configPath, cwd);
  if (config?.config === null) {
    return {
      exitCode: 1,
      stdout: renderInvalidConfig(config),
    };
  }
  const graph = await createSourceGraphAsync({ projects: [{ id: 'target', rootPath: target }] });
  const result = evaluateArchitecture(graph, options.modelId, {
    config: config?.config ?? undefined,
  });
  const exitCode =
    result.diagnostics.length > 0 || result.findings.some(({ severity }) => severity === 'error')
      ? 1
      : 0;

  return {
    exitCode,
    stdout: options.json
      ? `${JSON.stringify({ target, result }, null, 2)}\n`
      : renderEvaluation(target, result),
  };
}

/*** Read an optional generic Rules configuration without hiding parse or validation diagnostics. */
async function readConfig(
  configPath: string | undefined,
  cwd: string,
): Promise<Awaited<ReturnType<typeof readRulesConfigAsync>> | undefined> {
  return configPath === undefined ? undefined : readRulesConfigAsync(resolve(cwd, configPath));
}

/*** Render invalid generic Rules configuration before any architecture evaluation occurs. */
function renderInvalidConfig(result: Awaited<ReturnType<typeof readRulesConfigAsync>>): string {
  return [
    'rules-architecture evaluate',
    `invalid config: ${result.path}`,
    ...result.diagnostics.map((diagnostic) => `- ${diagnostic.code}: ${diagnostic.message}`),
    '',
  ].join('\n');
}

/*** Render advisory or blocking findings for the explicitly selected model. */
function renderEvaluation(target: string, result: ReturnType<typeof evaluateArchitecture>): string {
  return [
    'rules-architecture evaluate',
    `target: ${target}`,
    `model: ${result.modelId}`,
    `findings: ${result.findings.length}`,
    ...result.findings.map(
      (finding) => `- [${finding.severity}] ${finding.ruleId}: ${finding.message}`,
    ),
    ...result.diagnostics.map(
      (diagnostic) => `- [diagnostic] ${diagnostic.code}: ${diagnostic.message}`,
    ),
    '',
  ].join('\n');
}
