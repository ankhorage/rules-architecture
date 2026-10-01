#!/usr/bin/env bun

import { detect } from './commands/detect.js';
import { evaluate } from './commands/evaluate.js';
import { list } from './commands/models/list.js';

/*** Run the standalone Architecture Rules CLI through the same command operations as Ankh. */
export async function runCli(argv: readonly string[]): Promise<{ readonly exitCode: number }> {
  const [firstToken, ...restTokens] = argv;
  if (firstToken === undefined || isHelpToken(firstToken)) {
    process.stdout.write(renderHelp());
    return { exitCode: 0 };
  }

  try {
    const result = await executeCommand(firstToken, restTokens);
    process.stdout.write(result.stdout);
    return { exitCode: result.exitCode };
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : 'Rules Architecture command failed.'}\n`,
    );
    return { exitCode: 1 };
  }
}

/*** Dispatch standalone tokens without duplicating command behavior. */
async function executeCommand(
  firstToken: string,
  restTokens: readonly string[],
): Promise<{ readonly exitCode: number; readonly stdout: string }> {
  if (firstToken === 'models' && restTokens[0] === 'list') return list(restTokens.slice(1));
  if (firstToken === 'detect') return detect(restTokens, process.cwd());
  if (firstToken === 'evaluate') return evaluate(restTokens, process.cwd());
  throw new Error('Unknown Rules Architecture command. Run ankhorage-rules-architecture --help.');
}

/*** Identify help tokens accepted by the standalone delivery adapter. */
function isHelpToken(value: string): boolean {
  return value === '--help' || value === '-h' || value === 'help';
}

/*** Render canonical command help for standalone and Ankh users. */
function renderHelp(): string {
  return [
    '@ankhorage/rules-architecture',
    '',
    'Usage:',
    '  ankhorage-rules-architecture models list [--json]',
    '  ankhorage-rules-architecture detect [target] [--model <id>] [--json]',
    '  ankhorage-rules-architecture evaluate [target] --model <id> [--config <path>] [--json]',
    '  ankh rules-architecture models list [--json]',
    '  ankh rules-architecture detect [target] [--model <id>] [--json]',
    '  ankh rules-architecture evaluate [target] --model <id> [--config <path>] [--json]',
    '',
  ].join('\n');
}

if (import.meta.main) {
  const result = await runCli(process.argv.slice(2));
  process.exit(result.exitCode);
}
