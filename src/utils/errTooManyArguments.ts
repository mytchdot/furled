import { CLI_USAGE } from '../constants';
import { furledError } from '.';

export const errTooManyArguments = (cmd: string) => {
  furledError(`Error: Too many ${cmd} arguments provided\n${CLI_USAGE}`, 2);
};
