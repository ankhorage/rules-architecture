import { expect, test } from 'bun:test';

import { CAPABILITIES } from '../capabilities/index.js';
import { createRulesArchitectureRuntimeProvider } from './createRulesArchitectureRuntimeProvider.js';

test('registers canonical architecture CLI capabilities and command paths', () => {
  const provider = createRulesArchitectureRuntimeProvider();
  expect(provider.id).toBe('@ankhorage/rules-architecture');
  expect(provider.category).toBe('rules-architecture');
  expect(provider.capabilities).toBe(CAPABILITIES);
  expect(provider.commands.map(({ path }) => path)).toEqual([
    ['models', 'list'],
    ['detect'],
    ['evaluate'],
  ]);
  expect(new Set(provider.commands.map(({ capability }) => capability))).toEqual(
    new Set(CAPABILITIES.map(({ id }) => id)),
  );
});
