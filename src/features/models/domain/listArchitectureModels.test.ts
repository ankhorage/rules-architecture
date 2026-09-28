import { expect, test } from 'bun:test';

import { listArchitectureModels } from './listArchitectureModels.js';

test('publishes four distinct models with complete role dependency references', () => {
  const models = listArchitectureModels();
  expect(models.map(({ id }) => id)).toEqual(['hexagonal', 'clean', 'onion', 'layered']);

  for (const model of models) {
    const roles = new Set(model.roles.map(({ id }) => id));
    expect(roles.size).toBe(model.roles.length);
    expect(model.reference.startsWith('https://')).toBe(true);
    expect(model.allowedDependencies.length).toBeGreaterThan(0);
    for (const { source, target } of model.allowedDependencies) {
      expect(roles.has(source)).toBe(true);
      expect(roles.has(target)).toBe(true);
    }
  }
});

test('keeps layered data coupling distinct from inward-dependency models', () => {
  const models = listArchitectureModels();
  const layered = models.find(({ id }) => id === 'layered');
  const clean = models.find(({ id }) => id === 'clean');
  const hexagonal = models.find(({ id }) => id === 'hexagonal');

  expect(layered?.allowedDependencies).toContainEqual({ source: 'domain', target: 'data-source' });
  expect(clean?.allowedDependencies).not.toContainEqual({ source: 'entity', target: 'framework' });
  expect(hexagonal?.allowedDependencies).not.toContainEqual({ source: 'core', target: 'adapter' });
});
