import packageJson from '../../package.json';

export const RULES_ARCHITECTURE_COMMAND_CATEGORY = 'rules';
export const RULES_ARCHITECTURE_CAPABILITIES = [
  'rules-architecture.models.list',
  'rules-architecture.detect',
  'rules-architecture.evaluate',
] as const;
export const RULES_ARCHITECTURE_PACKAGE_VERSION = packageJson.version;
