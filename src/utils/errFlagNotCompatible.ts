import { CLI_USAGE } from '../constants';
import { furledError } from '.';

export const errFlagNotCompatible = (flag: string, cmd: string) => {
  furledError(
    `Error: ${flag} flag is not compatible with furled ${cmd}\n${CLI_USAGE}`,
    2
  );
};
