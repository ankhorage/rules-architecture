import { expect, test } from 'bun:test';

import { createRulesArchitectureRuntimeProvider } from './createRulesArchitectureRuntimeProvider.js';

test('registers canonical architecture CLI capabilities and command paths', () => {
  const provider = createRulesArchitectureRuntimeProvider();
  expect(provider.id).toBe('@ankhorage/rules-architecture');
  expect(provider.category).toBe('rules-architecture');
  expect(provider.capabilities).toEqual([
    'rules-architecture.models.list',
    'rules-architecture.detect',
    'rules-architecture.evaluate',
  ]);
  expect(provider.commands.map(({ path }) => path)).toEqual([
    ['models', 'list'],
    ['detect'],
    ['evaluate'],
  ]);
});
