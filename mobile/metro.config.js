const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('node:path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * Extended for the npm-workspaces monorepo layout: Metro's default config
 * only resolves modules under this package's own node_modules, but
 * dependencies get hoisted to the repo root by npm workspaces, and this app
 * also imports the in-repo `@astroai/shared-types` package. Both
 * `watchFolders` (so Metro sees the workspace root and shared-types source)
 * and the extra `nodeModulesPaths` entry (so hoisted deps resolve) are
 * required for that to work.
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  watchFolders: [workspaceRoot],
  resolver: {
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(workspaceRoot, 'node_modules'),
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);
