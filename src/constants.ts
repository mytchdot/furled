export const SUPPORTED_EXTENSIONS = [
  ".js",
  ".json",
  ".node",
  ".mjs",
  ".ts",
  ".tsx",
];

export const DEFAULT_PERMISSIONS = 0o666;

export const TS_COMPILER_OPTIONS = {
  allowJs: false,
  allowSyntheticDefaultImports: false,
  allowUmdGlobalAccess: false,
  allowUnreachableCode: false,
  allowUnusedLabels: false,
  alwaysStrict: false,
  baseUrl: "",
  charset: "",
  checkJs: false,
  declaration: false,
  declarationMap: false,
  emitDeclarationOnly: false,
  declarationDir: "",
  disableSizeLimit: false,
  disableSourceOfProjectReferenceRedirect: false,
  disableSolutionSearching: false,
  disableReferencedProjectLoad: false,
  downlevelIteration: false,
  emitBOM: false,
  emitDecoratorMetadata: false,
  exactOptionalPropertyTypes: false,
  experimentalDecorators: false,
  forceConsistentCasingInFileNames: false,
  importHelpers: false,
  importsNotUsedAsValues: 0,
  inlineSourceMap: false,
  inlineSources: false,
  isolatedModules: false,
  jsx: 0,
  keyofStringsOnly: false,
  lib: [""],
  locale: "",
  mapRoot: "",
  maxNodeModuleJsDepth: 0,
  module: 0,
  moduleResolution: 0,
  newLine: 0,
  noEmit: false,
  noEmitHelpers: false,
  noEmitOnError: false,
  noErrorTruncation: false,
  noFallthroughCasesInSwitch: false,
  noImplicitAny: false,
  noImplicitReturns: false,
  noImplicitThis: false,
  noStrictGenericChecks: false,
  noUnusedLocals: false,
  noUnusedParameters: false,
  noImplicitUseStrict: false,
  noPropertyAccessFromIndexSignature: false,
  assumeChangesOnlyAffectDirectDependencies: false,
  noLib: false,
  noResolve: false,
  noUncheckedIndexedAccess: false,
  out: "",
  outDir: "",
  outFile: "",
  paths: { "": [""] },
  preserveConstEnums: false,
  noImplicitOverride: false,
  preserveSymlinks: false,
  preserveValueImports: false,
  project: "",
  reactNamespace: "",
  jsxFactory: "",
  jsxFragmentFactory: "",
  jsxImportSource: "",
  composite: false,
  incremental: false,
  tsBuildInfoFile: "",
  removeComments: false,
  rootDir: "",
  rootDirs: [""],
  skipLibCheck: false,
  skipDefaultLibCheck: false,
  sourceMap: false,
  sourceRoot: "",
  strict: false,
  strictFunctionTypes: false,
  strictBindCallApply: false,
  strictNullChecks: false,
  strictPropertyInitialization: false,
  stripInternal: false,
  suppressExcessPropertyErrors: false,
  suppressImplicitAnyIndexErrors: false,
  target: 0,
  traceResolution: false,
  useUnknownInCatchVariables: false,
  resolveJsonModule: false,
  types: [""],
  typeRoots: [""],
  esModuleInterop: false,
  useDefineForClassFields: false,
};
export const CLI_USAGE = `Usage: furlify <cmd> <opts>

Commands:
  build <input-file> [opts]
  run <input-file> [opts]
  cache clean|dir|size
  help
  version

Options:
  -o, --out [file]         Output directory for build (defaults to dist)
  -m, --minify             Minify output
  -C, --no-cache           Skip build cache population
  -s, --source-map         Generate source map
  --no-source-map-register Skip source-map-register source map support
  -e, --external [mod]     Skip bundling 'mod'. Can be used many times
  -q, --quiet              Disable build summaries / non-error outputs
  -w, --watch              Start a watched build
  -t, --transpile-only     Use transpileOnly option with the ts-loader
  --v8-cache               Emit a build using the v8 compile cache
  --license [file]         Adds a file containing licensing information to the output
  --stats-out [file]       Emit webpack stats as json to the specified output file
  --target [es]            ECMAScript target to use for output (default: es2015)
  -d, --debug              Show debug logs
`;

export const SHEBANG_REGEX = /^#![^\n\r]*[\r\n]/;

export const PKG_NAME_REGEX = /^(@[^\\\/]+[\\\/])?[^\\\/]+/;
export const FULRIFY_DIR = "furlify";
export const EXT = ".tgz";
export const IMPORT_META_REGEX = /import.meta.url/g;
export const IMPORT_META_REPLACEMENT = `require('url').pathToFileURL(__filename).toString()`;
export const COLORS = [
  [135, 25, 201],
  [35, 90, 215],
  [79, 226, 226],
  [122, 255, 63],
  [241, 46, 214],
];
export const DEFAULT_ARGS = {
  "--asset-builds": Boolean,
  "-a": "--asset-builds",
  "--debug": Boolean,
  "-d": "--debug",
  "--external": [String],
  "-e": "--external",
  "--out": String,
  "-o": "--out",
  "--minify": Boolean,
  "-m": "--minify",
  "--source-map": Boolean,
  "-s": "--source-map",
  "--no-cache": Boolean,
  "-C": "--no-cache",
  "--no-asset-builds": Boolean,
  "--no-source-map-register": Boolean,
  "--quiet": Boolean,
  "-q": "--quiet",
  "--watch": Boolean,
  "-w": "--watch",
  "--v8-cache": Boolean,
  "--transpile-only": Boolean,
  "-t": "--transpile-only",
  "--license": String,
  "--stats-out": String,
  "--target": String,
};
