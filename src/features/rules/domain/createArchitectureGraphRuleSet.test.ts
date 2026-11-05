import type { SourceGraph } from '@ankhorage/dependency-graph';
import { evaluateRules, type Rule, type RuleEvaluationOutcome } from '@ankhorage/rules';
import { expect, test } from 'bun:test';

import { createArchitectureGraphRuleSet } from './createArchitectureGraphRuleSet.js';

type SourceNode = SourceGraph['graph']['nodes'][number];
type SourceEdge = SourceGraph['graph']['edges'][number];

test('evaluates file cycles without selecting an architecture target', () => {
  const ruleSet = createArchitectureGraphRuleSet();
  const graph = sourceGraph(
    [packageNode(0, 'app'), fileNode(1, 'src/a.ts', 'app'), fileNode(2, 'src/b.ts', 'app')],
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

test('returns INCOMPLETE rather than PASS when required cycle evidence is unavailable', () => {
  const result = evaluateRules(
    { graph: sourceGraph([], []) },
    createArchitectureGraphRuleSet().rules,
  );

  expect(result.results).toHaveLength(1);
  expect(result.results[0]?.status).toBe('INCOMPLETE');
  expect(result.diagnostics.some(({ code }) => code === 'missing-capability')).toBe(true);
});

test('uses the Rules DAG plan for dependency closure and executes shared dependencies once', () => {
  const executions = new Map<string, number>();
  const shared = fixtureRule('shared', [], executions);
  const left = fixtureRule('left', [{ ruleId: 'shared' }], executions);
  const right = fixtureRule('right', [{ ruleId: 'shared' }], executions);

  const result = evaluateRules({}, [left, right, shared]);

  expect(result.plan.nodes.map(({ rule }) => rule.id)).toEqual(['shared', 'left', 'right']);
  expect(result.plan.nodes.find(({ rule }) => rule.id === 'left')?.dependencyRuleIds).toEqual([
    'shared',
  ]);
  expect(executions.get('shared')).toBe(1);
  expect(result.results.map(({ status }) => status)).toEqual(['PASS', 'PASS', 'PASS']);
});

test('preserves evaluator diagnostics and actual outcomes for invalid, unknown, and cyclic rules', () => {
  const invalid = fixtureRule('invalid', [], new Map(), {
    validateOptions: () => [{ code: 'invalid-options', message: 'fixture options are invalid' }],
  });
  const unknown = fixtureRule('unknown', [{ ruleId: 'missing' }], new Map());
  const first = fixtureRule('first', [{ ruleId: 'second' }], new Map());
  const second = fixtureRule('second', [{ ruleId: 'first' }], new Map());
  const failing = fixtureRule('failing', [], new Map(), {
    outcome: { findings: [fixtureFinding('failing')], status: 'FAIL' },
  });

  const result = evaluateRules({}, [invalid, unknown, first, second, failing], {
    optionsByRuleId: new Map([['invalid', { invalid: true }]]),
  });

  const diagnosticCodes = result.diagnostics.map(({ code }) => code);
  expect(diagnosticCodes.includes('cycle')).toBe(true);
  expect(diagnosticCodes.includes('invalid-options')).toBe(true);
  expect(diagnosticCodes.includes('missing-dependency')).toBe(true);
  expect(result.results.find(({ rule }) => rule.id === 'invalid')?.status).toBe('ERROR');
  expect(result.results.find(({ rule }) => rule.id === 'unknown')?.status).toBe('ERROR');
  expect(result.results.find(({ rule }) => rule.id === 'first')?.status).toBe('ERROR');
  expect(result.results.find(({ rule }) => rule.id === 'failing')?.status).toBe('FAIL');
});

function fixtureRule(
  id: string,
  dependencies: Rule['dependencies'],
  executions: Map<string, number>,
  overrides: {
    readonly outcome?: RuleEvaluationOutcome;
    readonly validateOptions?: Rule['validateOptions'];
  } = {},
): Rule {
  return {
    identity: { id, version: '1' },
    summary: id,
    defaultSeverity: 'warning',
    dependencies,
    ...(overrides.validateOptions === undefined
      ? {}
      : { validateOptions: overrides.validateOptions }),
    evaluate: () => {
      executions.set(id, (executions.get(id) ?? 0) + 1);
      return overrides.outcome ?? { findings: [], status: 'PASS' };
    },
  };
}

function fixtureFinding(ruleId: string) {
  return {
    ruleId,
    severity: 'warning' as const,
    message: ruleId,
    subjects: [],
    evidence: { ruleId },
  };
}

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
