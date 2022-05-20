import { Module as NodeModule } from 'module';

import ts from 'typescript';

type M = typeof NodeModule & {
  _nodeModulePaths: (arg: string) => any;
};

const Module = NodeModule as M;

const m = new Module('', undefined) as NodeModule;
const { quiet, typescriptLookupPath } = JSON.parse(
  process.env.__FURLED_OPTS || '{}'
);

m.paths = Module._nodeModulePaths(
  process.env.TYPESCRIPT_LOOKUP_PATH ||
    typescriptLookupPath ||
    process.cwd() + '/'
);

let typescript: typeof ts;
try {
  typescript = m.require('typescript');
  if (!quiet) {
    console.log(
      'furled: Using typescript@' +
        typescript.version +
        ' (local user-provided)'
    );
  }
} catch (e) {
  typescript = ts;
  if (!quiet)
    console.log(
      'furled: Using typescript@' + typescript.version + ' (built-in)'
    );
}
export default typescript;
