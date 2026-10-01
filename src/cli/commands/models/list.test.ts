import { expect, test } from 'bun:test';

import { list } from './list.js';

test('lists all built-in architecture models as JSON', () => {
  const result = list(['--json']);
  expect(result.exitCode).toBe(0);
  const parsed = JSON.parse(result.stdout) as {
    readonly models: readonly { readonly id: string }[];
  };
  expect(parsed.models.map(({ id }) => id)).toEqual(['hexagonal', 'clean', 'onion', 'layered']);
});
