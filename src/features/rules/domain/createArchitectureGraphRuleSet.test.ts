import type { SourceGraph } from '@ankhorage/dependency-graph';
import { evaluateRules } from '@ankhorage/rules';
import { expect, test } from 'bun:test';

import { createArchitectureGraphRuleSet } from './createArchitectureGraphRuleSet.js';

type SourceNode = SourceGraph['graph']['nodes'][number];
type SourceEdge = SourceGraph['graph']['edges'][number];

test('evaluates file cycles without selecting an architecture target', () => {
  const ruleSet = createArchitectureGraphRuleSet();
  const graph = sourceGraph(
    [
      packageNode(0, 'app'),
      fileNode(1, 'src/a.ts', 'app'),
      fileNode(2, 'src/b.ts', 'app'),
    ],
    [importEdge(0, 1, 2, 'src/a.ts'), importEdge(1, 2, 1, 'src/b.ts')],
  );

  const result = evaluateRules({ graph }, ruleSet.rules, {
    capabilities: ['source-graph.imports'],
  });

  expect(result.findings).toHaveLength(1);
  expect(result.findings[0]?.ruleId).toBe('cyclic-dependencies');
  expect(result.findings[0]?.evidence).toEqual({
    aggregation: 'file',
    evidenceEdgeIds: [0, 1],
    relationKind: 'imports',
    semanticPaths: ['fixture:file:src/a.ts', 'fixture:file:src/b.ts'],
  });
});

test('evaluates package cycles from canonical rollups with traceable source edge IDs', () => {
  const ruleSet = createArchitectureGraphRuleSet();
  const graph = sourceGraph(
    [
      packageNode(0, 'a'),
      packageNode(1, 'b'),
      fileNode(2, 'src/a/A.java', 'a'),
      fileNode(3, 'src/b/B.java', 'b'),
    ],
    [
      declaresInEdge(0, 2, 0, 'src/a/A.java'),
      declaresInEdge(1, 3, 1, 'src/b/B.java'),
      importEdge(2, 2, 3, 'src/a/A.java'),
      importEdge(3, 3, 2, 'src/b/B.java'),
    ],
  );

  const result = evaluateRules({ graph }, ruleSet.rules, {
    capabilities: ['source-graph.imports'],
    optionsByRuleId: new Map([['cyclic-dependencies', { aggregation: 'package' }]]),
  });

  expect(result.findings).toHaveLength(1);
  expect(result.findings[0]?.evidence).toEqual({
    aggregation: 'package',
    evidenceEdgeIds: [2, 3],
    relationKind: 'imports',
    semanticPaths: ['fixture:package:a', 'fixture:package:b'],
  });
});

function sourceGraph(nodes: readonly SourceNode[], edges: readonly SourceEdge[]): SourceGraph {
  return {
    version: 1,
    capabilities: [{ analyzerId: 'fixture', projectId: 'fixture', available: ['imports'] }],
    graph: { nodes, edges },
  };
}

function packageNode(id: number, name: string): SourceNode {
  return {
    id,
    data: {
      kind: 'package',
      semanticPath: `fixture:package:${name}`,
      name,
      projectId: 'fixture',
      packageName: name,
      classification: 'intrinsic',
    },
  };
}

function fileNode(id: number, path: string, packageName: string): SourceNode {
  return {
    id,
    data: {
      kind: 'file',
      semanticPath: `fixture:file:${path}`,
      name: path.split('/').at(-1) ?? path,
      projectId: 'fixture',
      path,
      filePath: path,
      packageName,
      classification: 'intrinsic',
    },
  };
}

function declaresInEdge(
  id: number,
  source: number,
  target: number,
  sourcePath: string,
): SourceEdge {
  return {
    id,
    source,
    target,
    data: {
      kind: 'declares-in',
      evidence: [{ analyzerId: 'fixture', sourcePath }],
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
