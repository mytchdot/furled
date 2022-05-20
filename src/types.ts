import type { PathLike } from 'fs';
import type { ChildProcess } from 'child_process';

import type { MinifyOutput } from 'terser';
import type { CompilerOptions } from 'typescript';
import type { Configuration, Resolver } from 'webpack';
import type {
  ResolveContext,
  ResolveRequest,
} from 'tsconfig-paths-webpack-plugin/lib/plugin.temp.types';

export type PostScriptBundlerResults = {
  close(): void;
  handler(handler: any): void;
  rebuild(handler: any): void;
};
export type PostPassBundlerResults = {
  code: any;
  map: string | undefined;
  assets: any;
  symlinks: any;
  stats: any;
};
export type BundlerResults = PostPassBundlerResults | PostScriptBundlerResults;
export type CLIBundlerResults = PostScriptBundlerResults;

export type BundlerOptions = {
  cache?: boolean;
  customEmit?: boolean;
  esm?: boolean;
  externals?: any[];
  filename?: string;
  minify?: boolean;
  sourceMap?: boolean;
  sourceMapRegister?: boolean;
  sourceMapBasePrefix?: string;
  assetBuilds?: boolean;
  watch?: boolean | { [key: string]: any };
  v8cache?: boolean;
  filterAssetBase?: PathLike | string;
  existingAssetNames?: any[];
  quiet?: boolean;
  debugLog?: boolean;
  transpileOnly?: boolean;
  license?: string;
  target?: keyof Configuration['target'] | string;
  production?: boolean;
  // webpack defaults to `module` and `main`, but that's
  // not really what node.js supports, so we reset it
  mainFields?: string[] | ['main'];
};

export type Bundler = (
  pathToEntry: string,
  opts?: BundlerOptions
) => Promise<BundlerResults>;

export type PromiseResolver = (value: unknown) => void;

export type TSConfig = {
  compilerOptions: CompilerOptions;
  include?: string[];
  exclude?: string[];
};
export interface TerserMinifyOutput extends MinifyOutput {
  map?: any;
}
export type FolderSizeOptions<T> = { fs?: T; ignore?: RegExp };
export type FolderSizeReturnType = { strict?: boolean };

export type ExternalMapGet = (key: string) => string | null | undefined;
export type ExternalMapSet = (key: RegExp | unknown, value: string) => void;

export type ExternalMap = { get: ExternalMapGet; set: ExternalMapSet };
export type GetWebpackCacheArgs = {
  cache?: boolean;
  cacheDir: string;
  entry: string;
};
export type ResolverCb = (
  err: Error | null,
  innerPath?: string | false | undefined,
  result?: ResolveRequest | undefined
) => void;

export type ResolverErr = Error | null;
export type ResolverInnerPath = string | false | undefined;
export type ResolverResult = ResolveRequest | undefined;
export type ResolverFinalResolve = ({
  err,
  innerPath,
  result,
  request,
  callback,
  externalMap,
}: {
  err: ResolverErr;
  innerPath: ResolverInnerPath;
  result: ResolverResult;
  request: string;
  callback: ResolverCb;
  externalMap: ExternalMap;
}) => any;

export type ResolverMiddler = ({
  self,
  context,
  path,
  request,
  resolveContext,
  callback,
  externalMap,
}: {
  self: ThisType<any>;
  context: any;
  path: string;
  request: string;
  resolveContext: ResolveContext;
  callback: ResolverCb;
  externalMap: ExternalMap;
  resolve: Resolver['resolve'];
}) => any;
export type RenderSummary = ({
  map,
  ext,
  code,
  assets,
  outDir,
  buildTime,
}: {
  map: string;
  ext: string;
  code: string;
  assets: Record<string, any>;
  outDir: string;
  buildTime: number;
}) => string;

export type FurledPasserArgs = {
  ps: ChildProcess;
  api: boolean;
  ext: string;
  run: any;
  args: Record<string, any>;
  quiet: boolean;
  outDir: string;
  stdout: NodeJS.Process['stdout'];
  stderr: NodeJS.Process['stderr'];
  buildFile: string;
  startTime: number;
};

export type FurledOwnsArgs = {
  err: string;
  code: string;
  map: string;
  assets: Record<string, any>;
  symlinks: Record<string, any>;
  stats: object;
};
export type FurledInnerHandler = ({
  err,
  code,
  map,
  assets,
  symlinks,
  stats,
}: FurledOwnsArgs) => Promise<unknown>;

export type FurledHandler = ({
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
}: FurledPasserArgs) => FurledInnerHandler;

export type CLICasesCacheArgs = {
  args: Record<string, any>;
  stdout: NodeJS.Process['stdout'];
};
export type CLICasesCache = ({
  args,
  stdout,
}: CLICasesCacheArgs) => Promise<void> | void;

export type CliCasesBuildArgs = {
  args: Record<string, any>;
  stdout: NodeJS.Process['stdout'];
  run: boolean;
  quiet: boolean;
  api: boolean;
  outDir: string;
  stderr: NodeJS.Process['stderr'];
};
export type CliCasesBuild = ({
  args,
  stdout,
  run,
  quiet,
  api,
  outDir,
  stderr,
}: CliCasesBuildArgs) => Promise<unknown> | boolean;

export type CLICasesRunArgs = {
  args: Record<string, any>;
  outDir: PathLike;
  run: boolean;
};
export type CLICasesRun = ({
  args,
  outDir,
  run,
}: CLICasesRunArgs) => Promise<void> | void;

export type WalkParentDirsArgs = {
  base: string;
  start: string;
  filename: string;
};

export type WalkParentDirs = ({
  base,
  start,
  filename,
}: WalkParentDirsArgs) => Promise<string | null>;
