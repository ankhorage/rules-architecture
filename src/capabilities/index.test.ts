import { areCapabilityCatalogsEqual, isCapabilityCatalog } from '@ankhorage/capability';
import { expect, test } from 'bun:test';

import packageJson from '../../package.json';
import { CAPABILITIES } from './index.js';

test('publishes capability descriptors that match package metadata', () => {
  expect(CAPABILITIES.map(({ id }) => id)).toEqual([
    'rules-architecture.models.list',
    'rules-architecture.detect',
    'rules-architecture.evaluate',
  ]);
  expect(isCapabilityCatalog(packageJson.ankh.capabilities)).toBe(true);
  if (!isCapabilityCatalog(packageJson.ankh.capabilities)) return;
  expect(areCapabilityCatalogsEqual(packageJson.ankh.capabilities, CAPABILITIES)).toBe(true);
});
