import { defineParadoxConfig } from '@ankhorage/paradox';

export default defineParadoxConfig({
  mode: 'write',
  docs: {
    title: '@ankhorage/rules-architecture',
    description: 'Architecture models, detection, and rules for canonical source graphs.',
  },
  package: {
    root: '.',
    entrypoints: ['src/index.ts'],
  },
  output: { dir: './paradox' },
});
