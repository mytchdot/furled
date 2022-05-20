import * as path from 'path';

import type { TSConfig } from '../types';

export const getFlatFiles = (
  mfsData: any,
  output: Record<string, any>,
  getAssetMeta: (path: string) => Record<string, any>,
  tsconfig: TSConfig,
  curBase = ''
) => {
  for (const fpath of Object.keys(mfsData)) {
    let curPath = `${curBase}/${fpath}`;

    const item = mfsData[fpath];
    const isDir = item[''] === true;
    const isFile = !curPath.endsWith('/');

    if (isDir) getFlatFiles(item, output, getAssetMeta, tsconfig, curPath);
    else if (isFile) {
      const meta = getAssetMeta(curPath.slice(1)) || {};

      if (curPath.endsWith('.d.ts')) {
        const outDir = tsconfig.compilerOptions.outDir
          ? path.resolve(tsconfig.compilerOptions.outDir)
          : path.resolve('dist');
        curPath = curPath.replace(outDir, '').replace(process.cwd(), '');
      }
      output[curPath.slice(1)] = {
        source: mfsData[fpath],
        permissions: meta.permissions,
      };
    }
  }
};
