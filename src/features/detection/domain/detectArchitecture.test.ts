import type { SourceGraph } from '@ankhorage/dependency-graph';
import { expect, test } from 'bun:test';

import { detectArchitecture } from './detectArchitecture.js';

type SourceNode = SourceGraph['graph']['nodes'][number];
type SourceEdge = SourceGraph['graph']['edges'][number];

test('reports multiple scored candidates without selecting an enforcement target', () => {
  const result = detectArchitecture(hexagonalFixture());
  expect(result.candidates).toHaveLength(4);
  expect(result.candidates[0]?.score).toBeGreaterThan(0);
  expect(result.candidates.some(({ modelId }) => modelId === 'hexagonal')).toBe(true);
  expect(result.candidates.every(({ confidence }) => confidence >= 0 && confidence <= 1)).toBe(
    true,
  );
});

test('reports unavailable capabilities separately from contradictory evidence', () => {
  const graph = hexagonalFixture();
  const result = detectArchitecture({
    ...graph,
    capabilities: graph.capabilities.map((report) => ({ ...report, available: ['imports'] })),
  });
  const hexagonal = result.candidates.find(({ modelId }) => modelId === 'hexagonal');
  expect(hexagonal?.unavailableCapabilities).toContain('implements');
});

function hexagonalFixture(): SourceGraph {
  return {
    version: 1,
    capabilities: [
      {
        analyzerId: 'fixture',
        projectId: 'fixture',
        available: [
          'containment',
          'declarations',
          'extends',
          'implements',
          'imports',
          'source-locations',
        ],
      },
    ],
    graph: {
      nodes: [
        fileNode(0, 'src/domain/order.ts'),
        symbolNode(1, 'interface', 'src/ports/orderRepository.ts', 'OrderRepository'),
        symbolNode(2, 'class', 'src/adapters/postgresRepository.ts', 'PostgresRepository'),
      ],
      edges: [
        relation(0, 2, 1, 'implements', 'src/adapters/postgresRepository.ts'),
        relation(1, 2, 0, 'imports', 'src/adapters/postgresRepository.ts'),
      ],
    },
  };
}

function fileNode(id: number, path: string): SourceNode {
  const name = path.split('/').at(-1) ?? path;
  return {
    id,
    data: {
      kind: 'file',
      semanticPath: `fixture:file:${path}`,
      name,
      projectId: 'fixture',
      path,
      classification: 'intrinsic',
    },
  };
}

function symbolNode(
  id: number,
  kind: 'class' | 'interface',
  filePath: string,
  name: string,
): SourceNode {
  return {
    id,
    data: {
      kind,
      semanticPath: `fixture:symbol:${filePath}#${name}`,
      name,
      projectId: 'fixture',
      filePath,
      classification: 'intrinsic',
    },
  };
}

function relation(
  id: number,
  source: number,
  target: number,
  kind: 'implements' | 'imports',
  sourcePath: string,
): SourceEdge {
  return {
    id,
    source,
    target,
    data: { kind, evidence: [{ analyzerId: 'fixture', sourcePath }] },
  };
}
