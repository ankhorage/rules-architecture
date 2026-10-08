import type { AnkhRuntimeCommandProvider } from '@ankhorage/ankh';
import type { Capability } from '@ankhorage/contracts/capabilities';

import { CAPABILITIES } from '../capabilities/index.js';
import {
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
    capabilities: CAPABILITIES,
    commands: commandDescriptors(),
    handlers: commandHandlers(),
  };
}

/*** Describe the public architecture command paths and capabilities. */
function commandDescriptors(): AnkhRuntimeCommandProvider['commands'] {
  return [
    {
      path: ['models', 'list'],
      capability: MODELS_LIST_CAPABILITY_ID,
      summary: 'List supported architecture models and their semantic roles.',
    },
    {
      path: ['detect'],
      capability: DETECT_CAPABILITY_ID,
      summary: 'Detect plausible architectures without selecting an enforcement target.',
    },
    {
      path: ['evaluate'],
      capability: EVALUATE_CAPABILITY_ID,
      summary: 'Evaluate an explicitly selected target architecture through generic Rules.',
    },
  ];
}

const MODELS_LIST_CAPABILITY_ID: Capability['id'] = 'rules-architecture.models.list';
const DETECT_CAPABILITY_ID: Capability['id'] = 'rules-architecture.detect';
const EVALUATE_CAPABILITY_ID: Capability['id'] = 'rules-architecture.evaluate';

/*** Bind public architecture commands to their shared application operations. */
function commandHandlers(): NonNullable<AnkhRuntimeCommandProvider['handlers']> {
  return [
    {
      path: ['models', 'list'],
      handler: ({ argv, context }) => {
        const result = list(argv);
        context.writeStdout(result.stdout);
        return { exitCode: result.exitCode };
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
  ];
}
