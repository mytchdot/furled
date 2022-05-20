import { CLI_USAGE } from '../constants';
import { furledError } from '.';

export const errInvalidCommand = (cmd: string, exitCode = 0) => {
  furledError(`Error: Invalid command "${cmd}"\n${CLI_USAGE}`, exitCode);
};
