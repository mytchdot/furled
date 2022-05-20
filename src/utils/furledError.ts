export class FurledError extends Error {
  furlifyError = false;
  exitCode = 0;
}
export const furledError = (msg: Error['message'], exitCode = 1) => {
  const err = new FurledError(msg);
  err.furlifyError = true;
  err.exitCode = exitCode;
  throw err;
};
