/* eslint no-console: 0 */

const path = require('path');
// const process = require('process');
// const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const {
  makeResolve,
  makeAbsolutePaths,
  getDbuxVersion
} = require('../dbux-cli/lib/package-util');


// const _oldLog = console.log; console.log = (...args) => _oldLog(new Error(' ').stack.split('\n')[2], ...args);
const projectRoot = path.resolve(__dirname);
const MonoRoot = path.resolve(__dirname, '..');

module.exports = (env, argv) => {
  const outputFolderName = 'dist';

  const mode = argv.mode || 'development';
  const DBUX_VERSION = getDbuxVersion(mode);
  const DBUX_ROOT = mode === 'development' ? MonoRoot : '';
  process.env.NODE_ENV = mode; // set these, so babel configs also have it
  process.env.DBUX_ROOT = DBUX_ROOT;
  const aggregateTimeout = mode === 'development' ? 200 : 3000;

  console.debug(`[dbux-code] (DBUX_VERSION=${DBUX_VERSION}, mode=${mode}, DBUX_ROOT=${DBUX_ROOT}) building...`);

  const webpackPlugins = [
    new webpack.EnvironmentPlugin({
      NODE_ENV: mode,
      DBUX_VERSION,
      DBUX_ROOT
    }),
    new CopyPlugin({
      patterns: [
        {
          force: true,
          from: path.join(MonoRoot, 'dbux-projects', 'assets'),
          to: path.join(MonoRoot, 'dbux-code', 'resources', 'dist', 'projects')
        },
        {
          force: true,
          from: path.join(MonoRoot, 'node_modules/firebase'),
          to: path.join(MonoRoot, 'dbux-code', 'resources', 'dist', 'node_modules', 'firebase')
        }
      ]
    })
    // new BundleAnalyzerPlugin()
  ];


  const dependencyPaths = [
    "dbux-common",
    "dbux-data",
    "dbux-graph-common",
    "dbux-graph-host",
    "dbux-projects",
    "dbux-code"
  ];

  const resourcesSrc = path.join(projectRoot, 'resources/src');


  const resolve = makeResolve(MonoRoot, dependencyPaths);
  resolve.modules.push(resourcesSrc);

  const absoluteDependencies = makeAbsolutePaths(MonoRoot, dependencyPaths);
  // console.log(resolve.modules);
  const rules = [
    // {
    //   loader: 'babel-loader',
    //   include: [
    //     path.join(projectRoot, 'src')
    //   ]
    // },
    {
      loader: 'babel-loader',
      include: absoluteDependencies.map(r => path.join(r, 'src')),
      options: {
        babelrcRoots: absoluteDependencies
      }
    },
    {
      loader: 'babel-loader',
      include: resourcesSrc,
      options: {
        presets: [
          [
            '@babel/preset-env',
            {
              targets: {
                node: '4'
              },
              useBuiltIns: 'usage',
              corejs: 3
            }
          ]
        ],
      }
    }
  ];

  // see https://v4.webpack.js.org/guides/production/#minification
  const optimization = mode !== 'production' ? undefined : {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          keep_classnames: true,
          // keep_fnames: true
        }
      })
    ]
  };

  return {
    watchOptions: {
      poll: true,
      ignored: /node_modules/,
      aggregateTimeout
    },
    // https://github.com/webpack/webpack/issues/2145
    mode,
    // devtool: 'inline-module-source-map',
    devtool: 'source-map',
    //devtool: 'inline-source-map',
    target: 'node',
    plugins: webpackPlugins,
    context: path.join(projectRoot, '.'),
    entry: {
      bundle: path.join(projectRoot, 'src/_includeIndex.js'),
      _dbux_run: path.join(projectRoot, 'resources/src/_dbux_run.js')
    },
    output: {
      path: path.join(projectRoot, outputFolderName),
      filename: '[name].js',
      publicPath: outputFolderName,
      libraryTarget: "commonjs2",
      devtoolModuleFilenameTemplate: "../[resource-path]",
      // sourceMapFilename: outFile + ".map"
    },
    resolve,
    module: {
      rules,
    },
    externals: {
      uws: "uws",
      vscode: "commonjs vscode",
      firebase: 'commonjs firebase'
    },
    node: {
      // generate actual output file information
      // see: https://webpack.js.org/configuration/node/#node__filename
      __dirname: false,
      __filename: false,
    },
    optimization
  };
};

// console.warn('[dbux-code] webpack config loaded');