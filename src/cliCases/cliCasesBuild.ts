import * as path from 'node:path';
import { ChildProcess } from 'node:child_process';

import resolve from 'resolve';

import furlifyEngine from '..';
import { hasTypeModule, errTooManyArguments, furledHandler } from '../utils';

import type {
  CliCasesBuild,
  FurledOwnsArgs,
  CLIBundlerResults,
} from '../types';

export const cliCasesBuild: CliCasesBuild = async ({
  args,
  stdout,
  run,
  quiet,
  api,
  outDir,
  stderr,
}) => {
  if (args._.length > 2) errTooManyArguments('build');

  let startTime = Date.now();
  let ps = new ChildProcess();

  const buildFile = resolve.sync(path.resolve(args._[1] || '.'));

  const esm =
    buildFile.endsWith('.mjs') ||
    (!buildFile.endsWith('.cjs') && hasTypeModule(buildFile));

  // :))
  const ext = buildFile.endsWith('.cjs')
    ? '.cjs'
    : esm && (buildFile.endsWith('.mjs') || !hasTypeModule(buildFile))
    ? '.mjs'
    : '.js';

  const furled = furlifyEngine(buildFile, {
    debugLog: args['--debug'],
    minify: args['--minify'],
    externals: args['--external'],
    sourceMap: args['--source-map'] || run,
    sourceMapRegister: args['--no-source-map-register'] ? false : undefined,
    assetBuilds: args['--asset-builds'] ? true : false,
    cache: args['--no-cache'] ? false : undefined,
    watch: args['--watch'],
    v8cache: args['--v8-cache'],
    transpileOnly: args['--transpile-only'],
    license: args['--license'],
    quiet,
    target: args['--target'],
  });
  const handler = furledHandler({
    ps,
    api,
    ext,
    run,
    args,
    quiet,
    outDir,
    stdout,
    stderr,
    buildFile,
    startTime,
  });

  if (args['--watch']) {
    (furled as unknown as CLIBundlerResults).handler(handler);
    (furled as unknown as CLIBundlerResults).rebuild(() => {
      if (ps) ps.kill();
      startTime = Date.now();
      stdout.write('File change, rebuilding...\n');
    });
    return true;
  } else {
    return (furled as unknown as Promise<FurledOwnsArgs>).then(handler);
  }
};
