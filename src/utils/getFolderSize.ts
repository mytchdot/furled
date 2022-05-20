import * as path from 'path';

import type { FolderSizeOptions, FolderSizeReturnType } from '../types';

const mockfs = {
  lstat: () =>
    new Promise<{ isDirectory: () => boolean; ino: number; size: number }>(
      () => {}
    ),
  readdir: () => new Promise<string[]>(() => {}),
};

const processItem = async (
  itemPath: string,
  options: FolderSizeOptions<typeof mockfs>,

  returnType: FolderSizeReturnType
) => {
  const fileSizes = new Map();
  const errors: string[] = [];

  const fs = options.fs || (await import('fs/promises'));

  if (options.ignore?.test(itemPath)) return { errors, fileSizes };

  const stats = returnType.strict
    ? await fs.lstat(itemPath)
    : await fs.lstat(itemPath).catch((error) => errors.push(error));

  if (typeof stats !== 'object') return { errors, fileSizes };

  fileSizes.set(stats.ino, stats.size);

  if (stats.isDirectory()) {
    const directoryItems = returnType.strict
      ? await fs.readdir(itemPath)
      : await fs.readdir(itemPath).catch((error) => errors.push(error));

    if (typeof directoryItems !== 'object') return { errors, fileSizes };

    await Promise.all(
      directoryItems.map((directoryItem) =>
        processItem(path.join(itemPath, directoryItem), options, returnType)
      )
    );
  }
  return { errors, fileSizes };
};

const defaults = {
  options: {
    fs: mockfs,
    ignore: new RegExp(''),
  },
  returnType: {
    strict: false,
  },
};
export const getFolderSize = async (
  rootItemPath: string,
  options: FolderSizeOptions<typeof mockfs> = defaults.options,
  returnType: FolderSizeReturnType = defaults.returnType
) => {
  const { errors, fileSizes } = await processItem(
    rootItemPath,
    options,
    returnType
  );

  const folderSize = Array.from(fileSizes.values()).reduce(
    (total, fileSize) => total + fileSize,
    0
  );

  return {
    size: folderSize,
    errors: errors.length > 0 ? errors : null,
  };
};
