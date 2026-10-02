import type { ArchitectureProfile } from '../../../types/architectureProfile.js';

/*** Built-in project profiles layered on top of generic architecture models. */
export const ARCHITECTURE_PROFILES: readonly ArchitectureProfile[] = [
  {
    id: 'ankhorage',
    name: 'Ankhorage Hexagonal Profile',
    baseModelId: 'hexagonal',
    interpretation:
      'Ankhorage uses feature-first ownership with explicit inward roles and thin package-level delivery edges on top of Hexagonal Architecture.',
    source: {
      featureRoot: 'src/features',
      facadeFiles: ['index.ts'],
      packageWideDirectories: ['constants', 'types', 'utils'],
      deliveryEdgeDirectories: ['app', 'cli', 'host', 'platform'],
      inwardFeatureRoles: ['application', 'contracts', 'domain', 'planning', 'ports'],
      roles: [
        {
          id: 'domain',
          segments: ['domain', 'core'],
          forbiddenOutwardSegments: [
            'adapters',
            'app',
            'application',
            'cli',
            'composition',
            'host',
            'infrastructure',
            'platform',
          ],
          ruleId: 'package.architecture.domain-outward-import.disallowed',
          label: 'Domain/core policy',
        },
        {
          id: 'application',
          segments: ['application'],
          forbiddenOutwardSegments: [
            'adapters',
            'app',
            'cli',
            'composition',
            'host',
            'infrastructure',
            'platform',
          ],
          ruleId: 'package.architecture.application-outward-import.disallowed',
          label: 'Application/use-case code',
        },
        {
          id: 'ports',
          segments: ['ports'],
          forbiddenOutwardSegments: [
            'adapters',
            'app',
            'cli',
            'composition',
            'host',
            'infrastructure',
            'platform',
          ],
          ruleId: 'package.architecture.port-outward-import.disallowed',
          label: 'Port contracts',
        },
      ],
      featureCombinations: [
        {
          role: 'adapters',
          requiresAnyOf: ['application', 'contracts', 'domain', 'planning', 'ports'],
          ruleId: 'package.architecture.role-combination.invalid',
        },
        {
          role: 'composition',
          requiresAnyOf: ['adapters', 'application', 'planning', 'ports'],
          ruleId: 'package.architecture.role-combination.invalid',
        },
      ],
      thinDeliveryAdapter: {
        pathSegments: ['cli', 'commands'],
        concreteAdapterSegment: 'adapters',
        ruleId: 'package.architecture.delivery-concrete-adapter-import.disallowed',
      },
    },
  },
];
