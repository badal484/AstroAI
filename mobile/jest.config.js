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
