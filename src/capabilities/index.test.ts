import { expect, test } from 'bun:test';

import packageJson from '../../package.json';
import { CAPABILITIES } from './index.js';

test('publishes capability descriptors that match package metadata', () => {
  expect(CAPABILITIES.map(({ id }) => id)).toEqual([
    'rules-architecture.models.list',
    'rules-architecture.detect',
    'rules-architecture.evaluate',
  ]);
  expect(JSON.stringify(packageJson.ankh.capabilities)).toBe(JSON.stringify(CAPABILITIES));
});
