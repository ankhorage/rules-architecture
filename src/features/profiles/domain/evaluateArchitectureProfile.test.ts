import type { SourceGraph } from '@ankhorage/dependency-graph';
import { describe, expect, test } from 'bun:test';

import { evaluateArchitectureProfile } from './evaluateArchitectureProfile.js';

type SourceNode = SourceGraph['graph']['nodes'][number];
type SourceEdge = SourceGraph['graph']['edges'][number];

describe('Ankhorage architecture profile ownership', () => {
  test('accepts coherent feature-first roles without requiring empty layers', () => {
    const result = evaluateArchitectureProfile(
      graph(
        [
          fileNode(0, 'src/features/orders/domain/order.ts'),
          fileNode(1, 'src/features/orders/application/createOrder.ts'),
          fileNode(2, 'src/features/orders/adapters/outbound/repository.ts'),
          fileNode(3, 'src/features/value/domain/value.ts'),
        ],
        [
          importEdge(0, 1, 0, 'src/features/orders/application/createOrder.ts'),
          importEdge(1, 2, 1, 'src/features/orders/adapters/outbound/repository.ts'),
        ],
      ),
      'ankhorage',
    );
    expect(result.findings).toEqual([]);
    expect(result.baseModelId).toBe('hexagonal');
  });

  test('rejects invalid role combinations once the canonical provider owns them', () => {
    const result = evaluateArchitectureProfile(
      graph([fileNode(0, 'src/features/orders/adapters/http.ts')], []),
      'ankhorage',
    );
    expect(ruleIds(result)).toContain('package.architecture.role-combination.invalid');
  });

});

describe('Ankhorage architecture profile dependency direction', () => {
  test('rejects domain and application imports that point outward', () => {
    const result = evaluateArchitectureProfile(
      graph(
        [
          fileNode(0, 'src/features/orders/domain/order.ts'),
          fileNode(1, 'src/features/orders/application/createOrder.ts'),
          fileNode(2, 'src/features/orders/adapters/repository.ts'),
          fileNode(3, 'src/features/orders/composition/wire.ts'),
        ],
        [
          importEdge(0, 0, 2, 'src/features/orders/domain/order.ts'),
          importEdge(1, 1, 3, 'src/features/orders/application/createOrder.ts'),
        ],
      ),
      'ankhorage',
    );
    expect(ruleIds(result)).toContain('package.architecture.domain-outward-import.disallowed');
    expect(ruleIds(result)).toContain('package.architecture.application-outward-import.disallowed');
  });

  test('rejects port imports that point outward', () => {
    const result = evaluateArchitectureProfile(
      graph(
        [
          fileNode(0, 'src/features/orders/ports/orderRepository.ts'),
          fileNode(1, 'src/features/orders/infrastructure/postgres.ts'),
        ],
        [importEdge(0, 0, 1, 'src/features/orders/ports/orderRepository.ts')],
      ),
      'ankhorage',
    );
    expect(ruleIds(result)).toContain('package.architecture.port-outward-import.disallowed');
  });

  test('rejects CLI commands that wire concrete adapters directly', () => {
    const result = evaluateArchitectureProfile(
      graph(
        [
          fileNode(0, 'src/cli/commands/issue.ts'),
          fileNode(1, 'src/features/tls/adapters/outbound/docker/runtime.ts'),
          fileNode(2, 'src/features/tls/application/useCase.ts'),
        ],
        [importEdge(0, 0, 1, 'src/cli/commands/issue.ts')],
      ),
      'ankhorage',
    );
    expect(ruleIds(result)).toContain(
      'package.architecture.delivery-concrete-adapter-import.disallowed',
    );
  });

  test('rejects implementation files outside canonical ownership roots', () => {
    const result = evaluateArchitectureProfile(
      graph([fileNode(0, 'src/randomThing.ts'), fileNode(1, 'src/index.ts')], []),
      'ankhorage',
    );
    expect(ruleIds(result)).toContain('package.architecture.feature-ownership.required');
    expect(
      result.findings.some(({ subjects }) =>
        subjects.some(({ path }) => path === 'src/index.ts'),
      ),
    ).toBe(false);
  });
});

/*** Return stable finding rule IDs for one profile evaluation. */
function ruleIds(result: ReturnType<typeof evaluateArchitectureProfile>): readonly string[] {
  return result.findings.map(({ ruleId }) => ruleId);
}

/*** Build one import-capable source graph fixture. */
function graph(nodes: readonly SourceNode[], edges: readonly SourceEdge[]): SourceGraph {
  return {
    version: 1,
    capabilities: [{ analyzerId: 'fixture', projectId: 'fixture', available: ['imports'] }],
    graph: { nodes, edges },
  };
}

/*** Build one intrinsic file node. */
function fileNode(id: number, path: string): SourceNode {
  return {
    id,
    data: {
      kind: 'file',
      semanticPath: 'fixture:file:' + path,
      name: path.split('/').at(-1) ?? path,
      projectId: 'fixture',
      path,
      classification: 'intrinsic',
    },
  };
}

/*** Build one observed file import relation. */
function importEdge(id: number, source: number, target: number, sourcePath: string): SourceEdge {
  return {
    id,
    source,
    target,
    data: {
      kind: 'imports',
      evidence: [{ analyzerId: 'fixture', sourcePath }],
    },
  };
}
