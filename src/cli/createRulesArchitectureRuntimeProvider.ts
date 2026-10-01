import type { AnkhRuntimeCommandProvider } from '@ankhorage/ankh';

import {
  RULES_ARCHITECTURE_CAPABILITIES,
  RULES_ARCHITECTURE_COMMAND_CATEGORY,
  RULES_ARCHITECTURE_PACKAGE_VERSION,
} from '../constants/rulesArchitecture.js';
import { detect } from './commands/detect.js';
import { evaluate } from './commands/evaluate.js';
import { list } from './commands/models/list.js';

/*** Create the Ankh provider for architecture model listing, detection, and explicit evaluation. */
export function createRulesArchitectureRuntimeProvider(): AnkhRuntimeCommandProvider {
  return {
    id: '@ankhorage/rules-architecture',
    category: RULES_ARCHITECTURE_COMMAND_CATEGORY,
    version: RULES_ARCHITECTURE_PACKAGE_VERSION,
    capabilities: [...RULES_ARCHITECTURE_CAPABILITIES],
    commands: [
      {
        path: ['models', 'list'],
        capability: RULES_ARCHITECTURE_CAPABILITIES[0],
        summary: 'List supported architecture models and their semantic roles.',
      },
      {
        path: ['detect'],
        capability: RULES_ARCHITECTURE_CAPABILITIES[1],
        summary: 'Detect plausible architectures without selecting an enforcement target.',
      },
      {
        path: ['evaluate'],
        capability: RULES_ARCHITECTURE_CAPABILITIES[2],
        summary: 'Evaluate an explicitly selected target architecture through generic Rules.',
      },
    ],
    handlers: [
      {
        path: ['models', 'list'],
        handler: ({ argv, context }) => {
          const result = list(argv);
          context.writeStdout(result.stdout);
          return Promise.resolve({ exitCode: result.exitCode });
        },
      },
      {
        path: ['detect'],
        handler: async ({ argv, context }) => {
          const result = await detect(argv, context.cwd);
          context.writeStdout(result.stdout);
          return { exitCode: result.exitCode };
        },
      },
      {
        path: ['evaluate'],
        handler: async ({ argv, context }) => {
          const result = await evaluate(argv, context.cwd);
          context.writeStdout(result.stdout);
          return { exitCode: result.exitCode };
        },
      },
    ],
  };
}
