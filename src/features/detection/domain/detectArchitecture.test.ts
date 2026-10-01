import { expect, test } from 'bun:test';
import type { SourceGraph } from '@ankhorage/dependency-graph';

import { detectArchitecture } from './detectArchitecture.js';

test('reports multiple scored candidates without selecting an enforcement target', () => {
  const result = detectArchitecture(hexagonalFixture());
  expect(result.candidates).toHaveLength(4);
  expect(result.candidates[0]?.score).toBeGreaterThan(0);
  expect(result.candidates.some(({ modelId }) => modelId === 'hexagonal')).toBe(true);
  expect(result.candidates.every(({ confidence }) => confidence >= 0 && confidence <= 1)).toBe(true);
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
    capabilities: [{
      analyzerId: 'fixture',
      projectId: 'fixture',
      available: ['containment', 'declarations', 'extends', 'implements', 'imports', 'source-locations'],
    }],
    graph: {
      nodes: [
        { id: 0, data: { kind: 'file', semanticPath: 'fixture:file:src/domain/order.ts', name: 'order.ts', projectId: 'fixture', path: 'src/domain/order.ts', classification: 'intrinsic' } },
        { id: 1, data: { kind: 'interface', semanticPath: 'fixture:symbol:src/ports/orderRepository.ts#OrderRepository', name: 'OrderRepository', projectId: 'fixture', filePath: 'src/ports/orderRepository.ts', classification: 'intrinsic' } },
        { id: 2, data: { kind: 'class', semanticPath: 'fixture:symbol:src/adapters/postgresRepository.ts#PostgresRepository', name: 'PostgresRepository', projectId: 'fixture', filePath: 'src/adapters/postgresRepository.ts', classification: 'intrinsic' } },
      ],
      edges: [
        { id: 0, source: 2, target: 1, data: { kind: 'implements', evidence: [{ analyzerId: 'fixture', sourcePath: 'src/adapters/postgresRepository.ts' }] } },
        { id: 1, source: 2, target: 0, data: { kind: 'imports', evidence: [{ analyzerId: 'fixture', sourcePath: 'src/adapters/postgresRepository.ts' }] } },
      ],
    },
  };
}
