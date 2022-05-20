import { tmpdir } from 'node:os';
export const cacheDir = tmpdir() + '/' + 'furled-cache';
