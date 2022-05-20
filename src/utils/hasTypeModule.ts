import * as fs from 'fs';
import * as path from 'path';

export const hasTypeModule = (modulePath: string) => {
  const modulePathResolver = path.resolve(modulePath, '..');
  while (modulePath !== (modulePath = modulePathResolver)) {
    try {
      return (
        JSON.parse(
          fs.readFileSync(path.resolve(modulePath, 'package.json')).toString()
        ).type === 'module'
      );
    } catch (e: any) {
      if (e.code === 'ENOENT') continue;
      throw e;
    }
  }
};
