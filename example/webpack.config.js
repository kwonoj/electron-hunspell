const path = require('path');

module.exports = [
  {
    entry: './example/worker.ts',
    output: {
      path: path.join(__dirname, 'dist/example'),
      filename: 'worker.bundle.js'
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js']
    },
    mode: 'development',
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: 'ts-loader',
          exclude: /node_modules/,
          options: {
            transpileOnly: true,
            compilerOptions: {
              module: 'esnext',
              skipLibCheck: true,
              skipDefaultLibCheck: true
            }
          }
        }
      ]
    },
    target: 'webworker',
    node: {
      fs: false,
      crypto: false
    },
    externals: ['electron']
  }
];
