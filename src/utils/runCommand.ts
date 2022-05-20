import arg from 'arg';

import { CLI_USAGE, DEFAULT_ARGS } from '../constants';
import { furledError, errInvalidCommand } from '.';
import { cliCasesCache, cliCasesRun, cliCasesBuild } from '../cliCases';

type RunCommand = (
  argv: string[],
  stdout: NodeJS.Process['stdout'],
  stderr: NodeJS.Process['stderr']
) => Promise<unknown>;

const api = require.main === module;

export const runCommand: RunCommand = async (argv, stdout, stderr) => {
  let args: Record<string, any> = DEFAULT_ARGS;
  try {
    args = arg(
      { ...DEFAULT_ARGS, '--external': [String] },
      {
        permissive: false,
        argv,
      }
    );
  } catch (e: any) {
    if (e.message.indexOf('Unknown or unexpected option') === -1) throw e;
    furledError(e.message + `\n${CLI_USAGE}`, 2);
  }

  if (args._.length === 0)
    furledError(`Error: No command specified\n${CLI_USAGE}`, 2);

  let run = false;
  let outDir = args['--out'];
  const quiet = args['--quiet'];

  switch (args._[0]) {
    case 'cache':
      await cliCasesCache({ args, stdout });
      break;
    case 'run':
      await cliCasesRun({ args, outDir, run });
      break;
    case 'build':
      return await cliCasesBuild({
        api,
        run,
        args,
        quiet,
        outDir,
        stdout,
        stderr,
      });
    case 'help':
      furledError(CLI_USAGE, 2);
      break;

    case 'version':
      stdout.write(require('../package.json').version + '\n');
      break;

    default:
      errInvalidCommand(args._[0], 2);
  }

  // remove me when node.js makes this the default behavior
  process.on('unhandledRejection', (e) => {
    throw e;
  });
};
