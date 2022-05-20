import { hashOf } from '.';

import type { Configuration } from 'webpack';
import type { GetWebpackCacheArgs } from '../types';

type GetWebpackCache = ({
  cache,
  cacheDir,
  entry,
}: GetWebpackCacheArgs) => Configuration['cache'];

export const getWebpackCache: GetWebpackCache = ({
  cache,
  cacheDir,
  entry,
}) => {
  if (!cache) return undefined;
  return {
    type: 'filesystem',
    cacheDirectory: typeof cache === 'string' ? cache : cacheDir,
    name: `furled_${hashOf(entry)}`,
  };
};
