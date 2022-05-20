import chalk from 'chalk';

const furledColor = chalk.rgb(105, 48, 195);
export const log = (...args: string[]) =>
  console.log(
    chalk.bold(
      '[',
      furledColor('furled') +
        chalk.reset() +
        chalk.bold(' ] ') +
        chalk.reset() +
        args.join(' ')
    ),
    '\n'
  );

export const Logs = {
  starting: (filename: string, esm: boolean) => {
    log(`Compiling file ${filename} into ${esm ? 'ESM' : 'CJS'}`);
  },
  meta: {
    version: (version: string) => log(`Version ${version}`),
  },
};
