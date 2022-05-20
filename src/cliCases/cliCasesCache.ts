import * as fs from 'fs';

import {
  cacheDir,
  getFolderSize,
  errInvalidCommand,
  errTooManyArguments,
  errFlagNotCompatible,
} from '../utils';

import type { CLICasesCache } from '../types';

export const cliCasesCache: CLICasesCache = async ({ args, stdout }) => {
  if (args._.length > 2) errTooManyArguments('cache');

  const flags = Object.keys(args).filter((arg) => arg.startsWith('--'));
  if (flags.length) errFlagNotCompatible(flags[0], 'cache');

  switch (args._[1]) {
    case 'clean':
      fs.promises.rm(cacheDir, { recursive: true, force: true });
      break;
    case 'dir':
      stdout.write(cacheDir + '\n');
      break;
    case 'size':
      const folderSize = await getFolderSize(cacheDir);

      if (folderSize.errors) throw new Error(folderSize.errors.join('\n'));

      stdout.write(`${(folderSize.size / 1024 / 1024).toFixed(2)}MB\n`);
      break;
    default:
      errInvalidCommand('cache ' + args._[1]);
  }
};
