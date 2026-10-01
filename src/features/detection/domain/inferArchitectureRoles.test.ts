import type { SourceGraph } from '@ankhorage/dependency-graph';
import { expect, test } from 'bun:test';

import { listArchitectureModels } from '../../models/domain/listArchitectureModels.js';
import { inferArchitectureRoles } from './inferArchitectureRoles.js';

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
        {
          id: 0,
          data: {
            kind: 'file',
            semanticPath: 'file:fixture:src%2Fmain%2Fjava%2Fcom%2Fexample%2FThing.java',
            name: 'Thing.java',
            projectId: 'fixture',
            path: 'src/main/java/com/example/Thing.java',
            filePath: 'src/main/java/com/example/Thing.java',
            classification: 'intrinsic',
          },
        },
        {
          id: 1,
          data: {
            kind: 'class',
            semanticPath:
              'file:fixture:src%2Fmain%2Fjava%2Fcom%2Fexample%2FThing.java:class:Thing:3%3A1',
            name: 'Thing',
            projectId: 'fixture',
            filePath: 'src/main/java/com/example/Thing.java',
            classification: 'intrinsic',
          },
        },
        {
          id: 2,
          data: {
            kind: 'method',
            semanticPath:
              'file:fixture:src%2Fmain%2Fjava%2Fcom%2Fexample%2FThing.java:class:Thing:3%3A1:method:run:4%3A3',
            name: 'run',
            projectId: 'fixture',
            filePath: 'src/main/java/com/example/Thing.java',
            classification: 'intrinsic',
          },
        },
      ],
      edges: [],
    },
  };
}
