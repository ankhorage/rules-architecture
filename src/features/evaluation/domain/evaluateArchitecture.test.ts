import type { SourceGraph } from '@ankhorage/dependency-graph';
import { expect, test } from 'bun:test';

import { evaluateArchitecture } from './evaluateArchitecture.js';
import { evaluateArchitectureGraph } from './evaluateArchitectureGraph.js';

type SourceNode = SourceGraph['graph']['nodes'][number];
type SourceEdge = SourceGraph['graph']['edges'][number];

test('requires an explicit target and reports dependency-direction violations as generic findings', () => {
  const result = evaluateArchitecture(directionViolationFixture(), 'hexagonal');
  expect(result.modelId).toBe('hexagonal');
  expect(result.findings.some(({ ruleId }) => ruleId === 'architecture-dependency-direction')).toBe(
    true,
  );
});

test('retains available direction violations when another relation capability is unavailable', () => {
  const result = evaluateArchitecture(
    directionViolationFixture(['imports', 'implements']),
    'hexagonal',
  );
  const directionResult = result.results.find(
    ({ rule }) => rule.id === 'architecture-dependency-direction',
  );

  expect(directionResult?.status).toBe('INCOMPLETE');
  expect(directionResult?.findings).toHaveLength(1);
  expect(directionResult?.findings[0]?.evidence).toMatchObject({ relationKind: 'imports' });
});

test('reports file import cycles through the reusable cyclic-dependencies rule', () => {
  const result = evaluateArchitecture(cycleFixture(), 'layered');
  expect(result.findings.some(({ ruleId }) => ruleId === 'cyclic-dependencies')).toBe(true);
});

test('preserves the selected model scope and serializable generic evaluation result', () => {
  const result = evaluateArchitecture(directionViolationFixture(), 'hexagonal');

  expect(result.plan.nodes.map(({ scope }) => scope)).toEqual([
    { id: 'hexagonal', kind: 'architecture-model' },
    { id: 'hexagonal', kind: 'architecture-model' },
  ]);
  const serialized = JSON.stringify(result);
  expect(serialized).toContain('"diagnostics"');
  expect(serialized).toContain('"findings"');
  expect(serialized).toContain('"plan"');
  expect(serialized).toContain('"results"');
});

test('evaluates target-independent graph rules without selecting a model', () => {
  const result = evaluateArchitectureGraph(cycleFixture());

  expect(result.plan.nodes[0]?.scope).toEqual({ id: 'architecture-graph', kind: 'source-graph' });
  expect(result.findings.some(({ ruleId }) => ruleId === 'cyclic-dependencies')).toBe(true);
});

function directionViolationFixture(
  available: readonly ('extends' | 'implements' | 'imports')[] = [
    'extends',
    'implements',
    'imports',
  ],
): SourceGraph {
  return sourceGraph(
    [fileNode(0, 'src/domain/order.ts'), fileNode(1, 'src/adapters/postgres.ts')],
    [importEdge(0, 0, 1, 'src/domain/order.ts')],
    available,
  );
}

function cycleFixture(): SourceGraph {
  return sourceGraph(
    [fileNode(0, 'src/domain/a.ts'), fileNode(1, 'src/domain/b.ts')],
    [importEdge(0, 0, 1, 'src/domain/a.ts'), importEdge(1, 1, 0, 'src/domain/b.ts')],
  );
}

function sourceGraph(
  nodes: readonly SourceNode[],
  edges: readonly SourceEdge[],
  available: readonly ('extends' | 'implements' | 'imports')[] = [
    'extends',
    'implements',
    'imports',
  ],
): SourceGraph {
  return {
    version: 1,
    capabilities: [
      {
        analyzerId: 'fixture',
        projectId: 'fixture',
        available,
      },
    ],
    graph: { nodes, edges },
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
