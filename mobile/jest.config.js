// package.json's `test` script runs with `--forceExit`: @tanstack/react-query
// registers a process-lifetime connectivity listener (onlineManager) the
// first time any QueryClient is used, which is never torn down between
// tests (by design — it's meant to outlive individual queries) and
// otherwise leaves Jest hanging after all tests have already passed. This
// is a known interaction in the React Query + Jest + React Native
// ecosystem, not an app-level leak.
module.exports = {
  preset: '@react-native/jest-preset',
  // The preset only allows transforming react-native/@react-native(-community)
  // packages; several native/auth-related deps also ship untranspiled ESM
  // and need to go through Babel too, or Jest chokes on their `export`
  // syntax (node_modules is otherwise excluded from transformation).
  transformIgnorePatterns: [
    'node_modules/(?!(' +
      [
        '(jest-)?react-native',
        '@react-native(-community)?',
        '@react-navigation',
        'react-native-mmkv',
        'react-native-keychain',
        'react-native-screens',
        '@react-native-google-signin/google-signin',
      ].join('|') +
      ')/)',
  ],
};
