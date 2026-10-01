import type { SourceGraph } from '@ankhorage/dependency-graph';
import { expect, test } from 'bun:test';

import { listArchitectureModels } from '../../models/domain/listArchitectureModels.js';
import { inferArchitectureRoles } from './inferArchitectureRoles.js';

type SourceNode = SourceGraph['graph']['nodes'][number];

test('does not treat conventional src/main/java source roots as composition evidence', () => {
  const model = listArchitectureModels().find(({ id }) => id === 'hexagonal');
  if (model === undefined) throw new Error('Missing hexagonal model.');

  const assignments = inferArchitectureRoles(javaMainSourceGraph(), model);

  expect(assignments.some(({ roleId }) => roleId === 'composition')).toBe(false);
  expect(assignments.some(({ semanticPath }) => semanticPath.includes(':method:'))).toBe(false);
});

function javaMainSourceGraph(): SourceGraph {
  return {
    version: 1,
    capabilities: [
      { analyzerId: 'project-detector', projectId: 'fixture', available: ['containment'] },
      {
        analyzerId: 'java',
        projectId: 'fixture',
        available: ['containment', 'declarations', 'extends', 'implements', 'imports'],
      },
    ],
    graph: {
      nodes: [
        javaNode(0, 'file', 'Thing.java'),
        javaNode(1, 'class', 'Thing'),
        javaNode(2, 'method', 'run'),
      ],
      edges: [],
    },
  };
}

function javaNode(id: number, kind: 'file' | 'class' | 'method', name: string): SourceNode {
  const filePath = 'src/main/java/com/example/Thing.java';
  const semanticPath =
    kind === 'file'
      ? 'file:fixture:src%2Fmain%2Fjava%2Fcom%2Fexample%2FThing.java'
      : kind === 'class'
        ? 'file:fixture:src%2Fmain%2Fjava%2Fcom%2Fexample%2FThing.java:class:Thing:3%3A1'
        : 'file:fixture:src%2Fmain%2Fjava%2Fcom%2Fexample%2FThing.java:class:Thing:3%3A1:method:run:4%3A3';

  return {
    id,
    data: {
      kind,
      semanticPath,
      name,
      projectId: 'fixture',
      filePath,
      ...(kind === 'file' ? { path: filePath } : {}),
      classification: 'intrinsic',
    },
  };
}
