import { expect, test } from 'bun:test';
import type { SourceGraph } from '@ankhorage/dependency-graph';

import { evaluateArchitecture } from './evaluateArchitecture.js';

test('requires an explicit target and reports dependency-direction violations as generic findings', () => {
  const result = evaluateArchitecture(directionViolationFixture(), 'hexagonal');
  expect(result.modelId).toBe('hexagonal');
  expect(result.findings.some(({ ruleId }) => ruleId === 'architecture-dependency-direction')).toBe(true);
});

test('reports file import cycles through the reusable cyclic-dependencies rule', () => {
  const result = evaluateArchitecture(cycleFixture(), 'layered');
  expect(result.findings.some(({ ruleId }) => ruleId === 'cyclic-dependencies')).toBe(true);
});

function directionViolationFixture(): SourceGraph {
  return {
    version: 1,
    capabilities: [{ analyzerId: 'fixture', projectId: 'fixture', available: ['imports'] }],
    graph: {
      nodes: [
        { id: 0, data: { kind: 'file', semanticPath: 'fixture:file:src/domain/order.ts', name: 'order.ts', projectId: 'fixture', path: 'src/domain/order.ts', classification: 'intrinsic' } },
        { id: 1, data: { kind: 'file', semanticPath: 'fixture:file:src/adapters/postgres.ts', name: 'postgres.ts', projectId: 'fixture', path: 'src/adapters/postgres.ts', classification: 'intrinsic' } },
      ],
      edges: [
        { id: 0, source: 0, target: 1, data: { kind: 'imports', evidence: [{ analyzerId: 'fixture', sourcePath: 'src/domain/order.ts' }] } },
      ],
    },
  };
}

function cycleFixture(): SourceGraph {
  return {
    version: 1,
    capabilities: [{ analyzerId: 'fixture', projectId: 'fixture', available: ['imports'] }],
    graph: {
      nodes: [
        { id: 0, data: { kind: 'file', semanticPath: 'fixture:file:src/domain/a.ts', name: 'a.ts', projectId: 'fixture', path: 'src/domain/a.ts', classification: 'intrinsic' } },
        { id: 1, data: { kind: 'file', semanticPath: 'fixture:file:src/domain/b.ts', name: 'b.ts', projectId: 'fixture', path: 'src/domain/b.ts', classification: 'intrinsic' } },
      ],
      edges: [
        { id: 0, source: 0, target: 1, data: { kind: 'imports', evidence: [{ analyzerId: 'fixture', sourcePath: 'src/domain/a.ts' }] } },
        { id: 1, source: 1, target: 0, data: { kind: 'imports', evidence: [{ analyzerId: 'fixture', sourcePath: 'src/domain/b.ts' }] } },
      ],
    },
  };
}
