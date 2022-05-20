import * as fs from 'node:fs';
import * as path from 'node:path';

import terser from 'terser';
import resolve from 'resolve';
import webpack from 'webpack';
import MemoryFS from 'memory-fs';
import relocateLoader from './loaders/relocate-loader';

// import tsconfigPaths from "tsconfig-paths";
import { loadTsconfig } from 'tsconfig-paths/lib/tsconfig-loader';
import { LicenseWebpackPlugin } from 'license-webpack-plugin';
import TsconfigPathsWebpackPlugin from 'tsconfig-paths-webpack-plugin';

import {
  Logs,
  cacheDir,
  getFlatFiles,
  hasTypeModule,
  walkParentDirs,
  getWebpackCache,
  resolverResolve,
  generateDepsType,
  generateExternalMap,
} from './utils';

import {
  SHEBANG_REGEX,
  DEFAULT_PERMISSIONS,
  TS_COMPILER_OPTIONS,
  SUPPORTED_EXTENSIONS,
} from './constants';

import type {
  Bundler,
  TSConfig,
  TerserMinifyOutput,
  PostPassBundlerResults,
} from './types';

const furled: Bundler = async (
  entry,
  {
    cache,
    customEmit = undefined,
    esm = entry.endsWith('.mjs') ||
      (!entry.endsWith('.cjs') && hasTypeModule(entry)),
    externals = [],
    filename = 'index' +
      (!esm && entry.endsWith('.cjs')
        ? '.cjs'
        : esm && (entry.endsWith('.mjs') || !hasTypeModule(entry))
        ? '.mjs'
        : '.js'),
    minify = false,
    sourceMap = false,
    sourceMapRegister = true,
    sourceMapBasePrefix = '../',
    assetBuilds = false,
    watch = false,
    v8cache = false,
    filterAssetBase = process.cwd(),
    existingAssetNames = [],
    quiet = false,
    debugLog = false,
    transpileOnly = false,
    license = '',
    target,
    production = true,
    mainFields = ['main'],
  } = {}
) => {
  let closed = false;
  let watcher: webpack.Watching;
  let cachedResult: PostPassBundlerResults | null;
  let watchHandler: (err: any) => void;
  let rebuildHandler: () => void | undefined;
  let fullTsconfig: TSConfig = {
    compilerOptions: TS_COMPILER_OPTIONS,
  };

  const resolvePlugins: webpack.ResolvePluginInstance[] = [];
  const compilationStack: webpack.Compilation[] = [];

  const mfs = new MemoryFS();

  const ext = path.extname(filename);
  const resolvedEntry = resolve.sync(entry);

  const externalMap = generateExternalMap();
  const { cjsDeps, esmDeps } = generateDepsType(mainFields, production);

  const shebangMatch = await fs.promises
    .readFile(resolvedEntry, 'utf-8')
    .then((resp) => resp.match(SHEBANG_REGEX));

  existingAssetNames.push(filename);

  process.env.__furled_OPTS = JSON.stringify({
    quiet,
    typescriptLookupPath: resolvedEntry,
  });

  // Not currently supported for ESM
  if (esm) v8cache = false;

  if (
    target &&
    !target.startsWith('es') &&
    !target.startsWith('node') &&
    !target.startsWith('nwjs') &&
    !target.startsWith('node-webkit') &&
    !target.startsWith('async-node') &&
    !target.startsWith('electron')
  ) {
    throw new Error(
      `Invalid "target" value provided ${target}, value must be es version e.g. es2015`
    );
  }

  if (sourceMap) {
    existingAssetNames.push(`${filename}.map`);
    existingAssetNames.push(`sourcemap-register${ext}`);
  }
  if (v8cache) {
    existingAssetNames.push(`${filename}.cache`);
    existingAssetNames.push(`${filename}.cache${ext}`);
  }
  // add TsconfigPathsPlugin to support `paths` resolution in tsconfig we need to
  // catch here because the plugin will error if there's no tsconfig in the working directory

  try {
    const configFileAbsolutePath = await walkParentDirs({
      base: process.cwd(),
      start: path.dirname(entry),
      filename: 'tsconfig.json',
    });

    fullTsconfig = (loadTsconfig(configFileAbsolutePath ?? '') as TSConfig) ?? {
      compilerOptions: TS_COMPILER_OPTIONS,
    };

    const tsconfigPathsOptions = { silent: true, extensions: [''] };
    if (fullTsconfig.compilerOptions.allowJs) {
      tsconfigPathsOptions.extensions = SUPPORTED_EXTENSIONS;
    }
    resolvePlugins.push(new TsconfigPathsWebpackPlugin(tsconfigPathsOptions));
  } catch (e) {}

  const pluginObject: webpack.ResolvePluginInstance = {
    apply(resolver) {
      const resolve = resolver.resolve;
      resolver.resolve = resolverResolve(resolve, externalMap);
    },
  };
  resolvePlugins.push(pluginObject);

  if (Array.isArray(externals)) {
    externals.forEach((external) => externalMap.set(external, external));
  } else if (typeof externals === 'object') {
    Object.keys(externals).forEach((external) =>
      externalMap.set(
        external[0] === '/' && external[external.length - 1] === '/'
          ? new RegExp(external.slice(1, -1))
          : external,
        externals[external]
      )
    );
  }

  var plugins: any[] = [
    {
      apply(compiler: webpack.Compiler) {
        compiler.hooks.compilation.tap('relocate-loader', (compilation) => {
          compilationStack.push(compilation);
          relocateLoader.initAssetCache(compilation);
        });
        compiler.hooks.watchRun.tap('furled', () => {
          if (rebuildHandler) rebuildHandler();
        });
        compiler.hooks.normalModuleFactory.tap(
          'furled',
          (NormalModuleFactory: any) => {
            function handler(parser: any) {
              parser.hooks.assign.for('require').intercept({
                register: (tapInfo: any) => {
                  if (tapInfo.name !== 'CommonJsPlugin') {
                    return tapInfo;
                  }
                  tapInfo.fn = () => {};
                  return tapInfo;
                },
              });
            }
            NormalModuleFactory.hooks.parser
              .for('javascript/auto')
              .tap('furled', handler);
            NormalModuleFactory.hooks.parser
              .for('javascript/dynamic')
              .tap('furled', handler);

            return NormalModuleFactory;
          }
        );
      },
    },
  ];

  if (typeof license === 'string' && license.length > 0) {
    plugins.push(
      new LicenseWebpackPlugin({
        outputFilename: license,
      })
    );
  }

  const staticWebpackOptions: Partial<webpack.Configuration> = {
    snapshot: {
      managedPaths: [],
      module: { hash: true },
    },
    amd: false,
    experiments: {
      topLevelAwait: true,
      outputModule: esm,
    },
    optimization: {
      nodeEnv: false,
      minimize: false,
      moduleIds: 'deterministic',
      chunkIds: 'deterministic',
      mangleExports: true,
      concatenateModules: true,
      innerGraph: true,
      sideEffects: true,
    },
    mode: 'production',
    stats: {
      logging: 'error',
    },
    infrastructureLogging: {
      level: 'error',
    },
    // mainFields,
    node: false,
  };

  const compiler = webpack({
    entry,
    cache: getWebpackCache({ cache, cacheDir, entry }),
    ...staticWebpackOptions,

    devtool: sourceMap ? 'cheap-module-source-map' : false,
    target: target ? ['node14', target] : 'node14',
    output: {
      path: '/',
      // Webpack only emits sourcemaps for files ending in .js
      filename: ext === '.cjs' ? filename + '.js' : filename,
      libraryTarget: esm ? 'module' : 'commonjs2',
      strictModuleExceptionHandling: true,
      module: esm,
    },
    resolve: {
      extensions: SUPPORTED_EXTENSIONS,
      exportsFields: ['exports'],
      importsFields: ['imports'],
      byDependency: {
        wasm: esmDeps(),
        esm: esmDeps(),
        url: { preferRelative: true },
        worker: { ...esmDeps(), preferRelative: true },
        commonjs: cjsDeps(),
        amd: cjsDeps(),
        // for backward-compat: loadModule
        loader: cjsDeps(),
        // for backward-compat: Custom Dependency
        unknown: cjsDeps(),
        // for backward-compat: getResolve without dependencyType
        undefined: cjsDeps(),
      },
      plugins: resolvePlugins,
    },
    externals({ context, request, dependencyType }: any, callback: any) {
      const external = externalMap.get(request);
      if (external)
        return callback(
          null,
          `${
            dependencyType === 'esm' && esm ? 'module' : 'node-commonjs'
          } ${external}`
        );
      return callback();
    },
    module: {
      rules: [
        {
          test: /f@notfound\.js$/,
          use: [
            {
              loader: eval('__dirname + "/loaders/notfound-loader.js"'),
            },
          ],
        },
        {
          test: /\.(js|mjs|tsx?|node)$/,
          use: [
            {
              loader: eval('__dirname + "/loaders/empty-loader.js"'),
            },
            {
              loader: eval('__dirname + "/loaders/relocate-loader.js"'),
              options: {
                customEmit,
                filterAssetBase,
                existingAssetNames,
                escapeNonAnalyzableRequires: true,
                wrapperCompatibility: true,
                debugLog,
              },
            },
          ],
        },
        {
          test: /\.tsx?$/,
          use: [
            {
              loader: eval('__dirname + "/loaders/uncacheable.js"'),
            },
            {
              loader: eval('__dirname + "/loaders/ts-loader.js"'),
              options: {
                transpileOnly,
                compiler: eval('__dirname + "/typescript.js"'),
                compilerOptions: {
                  module: 'esnext',
                  target: 'esnext',
                  ...fullTsconfig.compilerOptions,
                  allowSyntheticDefaultImports: true,
                  noEmit: false,
                  outDir: '//',
                },
              },
            },
          ],
        },
        {
          parser: { amd: false },
          exclude: /\.(node|json)$/,
          use: [
            {
              loader: eval('__dirname + "/loaders/shebang-loader.js"'),
            },
          ],
        },
      ],
    },
    plugins,
  });
  compiler.outputFileSystem = mfs;
  if (!watch) {
    return new Promise((resolve, reject) => {
      compiler.run((err: any, stats: any) => {
        if (err) return reject(err);
        compiler.close((err: any) => {
          if (err) return reject(err);
          if (stats.hasErrors()) {
            const errLog = [...stats.compilation.errors]
              .map((err) => err.message)
              .join('\n');
            return reject(new Error(errLog));
          }
          resolve(stats);
        });
      });
    }).then(finalizeHandler, function (err) {
      compilationStack.pop();
      throw err;
    });
  } else {
    if (typeof watch === 'object') {
      if (!watch.watch)
        throw new Error(
          'Watcher class must be a valid Webpack WatchFileSystem class instance (https://github.com/webpack/webpack/blob/master/lib/node/NodeWatchFileSystem.js)'
        );
      // TODO - webpack doesn't export `WatchFileSystem`
      compiler.watchFileSystem = watch as any;
      watch.inputFileSystem = compiler.inputFileSystem;
    }
    watcher = compiler.watch({}, async (err: any, stats: any) => {
      if (err) {
        compilationStack.pop();
        return watchHandler({ err });
      }
      if (stats.hasErrors()) {
        compilationStack.pop();
        return watchHandler({ err: stats.toString() });
      }
      const returnValue = await finalizeHandler(stats);
      if (watchHandler) watchHandler(returnValue);
      else cachedResult = returnValue;
    });
    return {
      close() {
        if (!watcher) throw new Error('No watcher to close.');
        if (closed) throw new Error('Watcher already closed.');
        closed = true;
        watcher.close(() => {});
      },
      handler(handler) {
        watchHandler = handler;
        if (cachedResult) {
          handler(cachedResult);
          cachedResult = null;
        }
      },
      rebuild(handler) {
        rebuildHandler = handler;
      },
    };
  }

  async function finalizeHandler(stats: any) {
    const assets = Object.create(null);
    getFlatFiles(mfs.data, assets, relocateLoader.getAssetMeta, fullTsconfig);
    // filter symlinks to existing assets
    const symlinks = Object.create(null);
    for (const [key, value] of Object.entries(relocateLoader.getSymlinks())) {
      const resolved = path.join(path.dirname(key), value as any);
      if (resolved in assets) symlinks[key] = value;
    }

    // Webpack only emits sourcemaps for .js files
    // so we need to adjust the .cjs extension handling
    delete assets[filename + (ext === '.cjs' ? '.js' : '')];
    delete assets[`${filename}${ext === '.cjs' ? '.js' : ''}.map`];
    let code = mfs.readFileSync(
      `/${filename}${ext === '.cjs' ? '.js' : ''}`,
      'utf8'
    );
    let map = sourceMap
      ? mfs.readFileSync(
          `/${filename}${ext === '.cjs' ? '.js' : ''}.map`,
          'utf8'
        )
      : null;

    if (map) {
      map = JSON.parse(map);
      // make source map sources relative to output
      map.sources = map.sources.map((source: any) => {
        // webpack:///webpack:/// happens too for some reason
        while (source.startsWith('webpack:///')) source = source.slice(11);
        if (source.startsWith('//')) source = source.slice(1);
        if (source.startsWith('/')) {
          source = path.relative(process.cwd(), source).replace(/\\/g, '/');
        }
        if (source.startsWith('external ')) source = 'node:' + source.slice(9);
        if (source.startsWith('./')) source = source.slice(2);
        if (source.startsWith('(webpack)')) {
          source = 'webpack' + source.slice(9);
        }
        if (source.startsWith('webpack/')) return '/webpack/' + source.slice(8);
        return sourceMapBasePrefix + source;
      });
    }

    if (minify) {
      let result: TerserMinifyOutput;
      try {
        result = await terser.minify(code, {
          module: esm,
          compress: false,
          mangle: {
            keep_classnames: true,
            keep_fnames: true,
          },
          sourceMap: map
            ? {
                content: map,
                filename,
                url: `${filename}.map`,
              }
            : false,
        });
        // For some reason, auth0 returns "undefined"!
        // custom terser phase used over Webpack integration for this reason
        if (!result || result.code === undefined) throw null;

        ({ code, map } = {
          code: result.code,
          map: map ? JSON.parse(result.map) : undefined,
        });
      } catch (e) {
        console.log(
          'An error occurred while minifying. The result will not be minified.'
        );
      }
    }

    if (map) {
      assets[`${filename}.map`] = {
        source: JSON.stringify(map),
        permissions: DEFAULT_PERMISSIONS,
      };
    }

    if (v8cache) {
      const { Script } = require('vm');
      assets[`${filename}.cache`] = {
        source: new Script(code).createCachedData(),
        permissions: DEFAULT_PERMISSIONS,
      };
      assets[`${filename}.cache${ext}`] = {
        source: code,
        permissions: DEFAULT_PERMISSIONS,
      };
      const columnOffset =
        -'(function (exports, require, module, __filename, __dirname) { '
          .length;
      code =
        `const { readFileSync, writeFileSync } = require('fs'), { Script } = require('vm'), { wrap } = require('module');\n` +
        `const basename = __dirname + '/${filename}';\n` +
        `const source = readFileSync(basename + '.cache${ext}', 'utf-8');\n` +
        `const cachedData = !process.pkg && require('process').platform !== 'win32' && readFileSync(basename + '.cache');\n` +
        `const scriptOpts = { filename: basename + '.cache${ext}', columnOffset: ${columnOffset} }\n` +
        `const script = new Script(wrap(source), cachedData ? Object.assign({ cachedData }, scriptOpts) : scriptOpts);\n` +
        `(script.runInThisContext())(exports, require, module, __filename, __dirname);\n` +
        `if (cachedData) process.on('exit', () => { try { writeFileSync(basename + '.cache', script.createCachedData()); } catch(e) {} });\n`;
    }

    if (map && sourceMapRegister) {
      const registerExt = esm ? '.cjs' : ext;
      code =
        (esm
          ? `import './sourcemap-register${registerExt}';`
          : `require('./sourcemap-register${registerExt}');`) + code;
      assets[`sourcemap-register${registerExt}`] = {
        source: fs.readFileSync(
          path.join(__dirname, `sourcemap-register.js.cache.js`)
        ),
        permissions: DEFAULT_PERMISSIONS,
      };
    }

    if (esm && !filename.endsWith('.mjs')) {
      // always output a "type": "module" package JSON for esm builds
      const baseDir = path.dirname(filename);
      const pjsonPath = (baseDir === '.' ? '' : baseDir) + 'package.json';
      if (assets[pjsonPath])
        assets[pjsonPath].source = JSON.stringify(
          Object.assign(JSON.parse(assets[pjsonPath].source.toString()), {
            type: 'module',
          })
        );
      else
        assets[pjsonPath] = {
          source: JSON.stringify({ type: 'module' }, null, 2) + '\n',
          permissions: DEFAULT_PERMISSIONS,
        };
    }

    if (shebangMatch) {
      code = shebangMatch[0] + code;
      // add a line offset to the sourcemap
      if (map) map.mappings = ';' + map.mappings;
    }

    // __webpack_require__ can conflict with webpack injections in module scopes
    // to avoid this without recomputing the source map we replace it with an
    // identical length identifier
    if (code.indexOf('"__webpack_require__"') === -1) {
      // dedupe any existing __furledwpck_require__ first
      if (code.indexOf('__furledwpck_require2_') !== -1) {
        // nth level nesting (we support 9 levels apparently)
        for (let i = 9; i > 1; i--) {
          if (code.indexOf(`__furledwpck_require${i}_`) === -1) continue;
          if (i === 9)
            throw new Error(
              '9 levels of furled build nesting reached, please post an issue to support this level of furled build composition.'
            );
          code = code.replace(
            new RegExp(`__furledwpck_require${i}_`, 'g'),
            `__furledwpck_require${i + 1}_`
          );
        }
      }
      if (code.indexOf('__furledwpck_require__') !== -1)
        code = code.replace(
          /__furledwpck_require__/g,
          '__furledwpck_require2_'
        );
      code = code.replace(/__webpack_require__/g, '__furledwpck_require__');
    }

    // for each .js / .mjs / .cjs file in the asset list, build that file with furled itself
    if (assetBuilds) {
      const compilation = compilationStack[compilationStack.length - 1];
      let existingAssetNames = Object.keys(assets);
      existingAssetNames.push(`${filename}${ext === '.cjs' ? '.js' : ''}`);
      const subbuildAssets = [];
      for (const asset of Object.keys(assets)) {
        if (
          (!asset.endsWith('.js') &&
            !asset.endsWith('.cjs') &&
            !asset.endsWith('.ts') &&
            !asset.endsWith('.mjs')) ||
          asset.endsWith('.cache.js') ||
          asset.endsWith('.cache.cjs') ||
          asset.endsWith('.cache.ts') ||
          asset.endsWith('.cache.mjs') ||
          asset.endsWith('.d.ts')
        ) {
          existingAssetNames.push(asset);
          continue;
        }
        const assetMeta = relocateLoader.getAssetMeta(asset, compilation);
        if (!assetMeta || !assetMeta.path) {
          existingAssetNames.push(asset);
          continue;
        }
        subbuildAssets.push(asset);
      }
      for (const asset of subbuildAssets) {
        const assetMeta = relocateLoader.getAssetMeta(asset, compilation);
        const path = assetMeta.path;
        const {
          code,
          assets: subbuildAssets,
          symlinks: subbuildSymlinks,
          stats: subbuildStats,
        }: any = await furled(path, {
          cache,
          externals,
          filename: asset,
          minify,
          sourceMap,
          sourceMapRegister,
          sourceMapBasePrefix,
          // dont recursively asset build
          // could be supported with seen tracking
          assetBuilds: false,
          v8cache,
          filterAssetBase,
          existingAssetNames,
          quiet,
          debugLog,
          // don't re-run type checking on a sub-build, as it is a waste of CPU
          transpileOnly: true,
          license,
          target,
        });
        Object.assign(symlinks, subbuildSymlinks);
        Object.assign(stats, subbuildStats);
        for (const subasset of Object.keys(subbuildAssets)) {
          assets[subasset] = subbuildAssets[subasset];
          if (!existingAssetNames.includes(subasset))
            existingAssetNames.push(subasset);
        }
        assets[asset] = { source: code, permissions: assetMeta.permissions };
      }
    }

    compilationStack.pop();

    return {
      code,
      map: map ? JSON.stringify(map) : undefined,
      assets,
      symlinks,
      stats,
    };
  }
};

export default furled;
