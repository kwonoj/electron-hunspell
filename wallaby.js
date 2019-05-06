module.exports = wallaby => ({
  files: ['src/**/*.ts'],

  tests: ['spec/**/*-spec.ts'],

  testFramework: {
    type: 'jest'
  },

  env: {
    type: 'node'
  },

  workers: {
    initial: 1,
    regular: 1
  },

  preprocessors: {
    '**/*.js?(x)': file =>
      require('@babel/core').transform(file.content, {
        sourceMaps: true,
        filename: file.path,
        presets: [require('babel-preset-jest')]
      })
  }
});
