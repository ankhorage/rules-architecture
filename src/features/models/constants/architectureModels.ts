import type {
  ArchitectureModel,
  ArchitectureRoleDependency,
} from '../../../types/architectureModel.js';

export const ARCHITECTURE_MODELS: readonly ArchitectureModel[] = [
  {
    id: 'hexagonal',
    name: 'Hexagonal / Ports and Adapters',
    reference: 'https://alistair.cockburn.us/hexagonal-architecture',
    interpretation:
      'Application behavior communicates through purposeful ports; adapters translate external mechanisms. Composition selects adapters outside the application.',
    roles: [
      { id: 'core', description: 'Application behavior independent from external devices.' },
      { id: 'port', description: 'Application-owned conversation contract.' },
      { id: 'adapter', description: 'Technology-specific translation at a port.' },
      { id: 'composition', description: 'Outer wiring of concrete adapters.' },
    ],
    allowedDependencies: dependencies(
      ['core', 'port', 'adapter', 'composition'],
      [
        ['core', 'port'],
        ['port', 'core'],
        ['adapter', 'core'],
        ['adapter', 'port'],
        ['composition', 'core'],
        ['composition', 'port'],
        ['composition', 'adapter'],
      ],
    ),
  },
  {
    id: 'clean',
    name: 'Clean Architecture',
    reference: 'https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html',
    interpretation:
      'Static source dependencies point inward from frameworks and interface adapters through use cases toward entities.',
    roles: [
      { id: 'entity', description: 'Enterprise business rules.' },
      { id: 'use-case', description: 'Application-specific business rules.' },
      {
        id: 'interface-adapter',
        description: 'Translation between use cases and external interfaces.',
      },
      { id: 'framework', description: 'External frameworks, devices, and infrastructure.' },
      { id: 'composition', description: 'Outermost assembly of concrete components.' },
    ],
    allowedDependencies: concentricDependencies([
      'entity',
      'use-case',
      'interface-adapter',
      'framework',
      'composition',
    ]),
  },
  {
    id: 'onion',
    name: 'Onion Architecture',
    reference: 'https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/',
    interpretation:
      'Domain model and services form the core. Application behavior, infrastructure implementations, and presentation depend toward that core.',
    roles: [
      { id: 'domain-model', description: 'Domain entities and value rules.' },
      { id: 'domain-service', description: 'Domain behavior coordinating model concepts.' },
      { id: 'application-service', description: 'Application workflow around the domain.' },
      { id: 'infrastructure', description: 'External persistence and technical implementations.' },
      { id: 'presentation', description: 'External user or program interface.' },
      { id: 'composition', description: 'Outermost assembly of concrete components.' },
    ],
    allowedDependencies: dependencies(
      [
        'domain-model',
        'domain-service',
        'application-service',
        'infrastructure',
        'presentation',
        'composition',
      ],
      [
        ['domain-service', 'domain-model'],
        ['application-service', 'domain-model'],
        ['application-service', 'domain-service'],
        ['infrastructure', 'domain-model'],
        ['infrastructure', 'domain-service'],
        ['infrastructure', 'application-service'],
        ['presentation', 'domain-model'],
        ['presentation', 'domain-service'],
        ['presentation', 'application-service'],
        ['composition', 'domain-model'],
        ['composition', 'domain-service'],
        ['composition', 'application-service'],
        ['composition', 'infrastructure'],
        ['composition', 'presentation'],
      ],
    ),
  },
  {
    id: 'layered',
    name: 'Layered / N-Tier Architecture',
    reference: 'https://martinfowler.com/bliki/PresentationDomainDataLayering.html',
    interpretation:
      'The initial strict variant follows presentation to domain to data source; domain-to-data-source coupling distinguishes it from inward-dependency models.',
    roles: [
      { id: 'presentation', description: 'Interaction and display concerns.' },
      { id: 'domain', description: 'Business logic and application behavior.' },
      { id: 'data-source', description: 'Persistence and external service access.' },
      { id: 'composition', description: 'Assembly of the layers.' },
    ],
    allowedDependencies: dependencies(
      ['presentation', 'domain', 'data-source', 'composition'],
      [
        ['presentation', 'domain'],
        ['domain', 'data-source'],
        ['composition', 'presentation'],
        ['composition', 'domain'],
        ['composition', 'data-source'],
      ],
    ),
  },
];

/*** Include same-role coupling and the model's explicit cross-role direction. */
function dependencies(
  roles: readonly string[],
  pairs: readonly (readonly [string, string])[],
): readonly ArchitectureRoleDependency[] {
  return [
    ...roles.map((role) => ({ source: role, target: role })),
    ...pairs.map(([source, target]) => ({ source, target })),
  ];
}

/*** Allow outer Clean Architecture rings to depend on equal or inner rings. */
function concentricDependencies(roles: readonly string[]): readonly ArchitectureRoleDependency[] {
  return roles.flatMap((source, index) =>
    roles.slice(0, index + 1).map((target) => ({ source, target })),
  );
}
