import type { Capability } from '@ankhorage/contracts/capabilities';

/*** Publish the canonical catalog for Rules Architecture provider capabilities. */
export const CAPABILITIES = [
  {
    id: 'rules-architecture.models.list',
    owner: '@ankhorage/rules-architecture',
    access: ['invoke'],
    binding: { kind: 'action', bindableAs: ['target'] },
    label: 'List architecture models',
    description: 'List supported architecture models and their semantic roles.',
  },
  {
    id: 'rules-architecture.detect',
    owner: '@ankhorage/rules-architecture',
    access: ['invoke'],
    binding: { kind: 'action', bindableAs: ['target'] },
    label: 'Detect architecture',
    description: 'Detect plausible architectures without selecting an enforcement target.',
  },
  {
    id: 'rules-architecture.evaluate',
    owner: '@ankhorage/rules-architecture',
    access: ['invoke'],
    binding: { kind: 'action', bindableAs: ['target'] },
    label: 'Evaluate architecture',
    description: 'Evaluate an explicitly selected target architecture through generic Rules.',
  },
] as const satisfies readonly Capability[];
