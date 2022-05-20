// re-exported as to generate a unique optional bundle for the ts-loader,
// that doesn't get loaded unless the user is compiling typescript
import tsLoader from "ts-loader";
import logger from "ts-loader/dist/logger";
import typescript from "typescript";
const makeLogger = logger.makeLogger;
logger.makeLogger = function (loaderOptions, colors) {
  const instance = makeLogger(loaderOptions, colors);
  const logWarning = instance.logWarning;
  instance.logWarning = function (message) {
    // Disable TS Loader TypeScript compatibility warning
    if (
      message.indexOf(
        "This version may or may not be compatible with ts-loader"
      ) !== -1
    )
      return;
    return logWarning(message);
  };
  return instance;
};

module.exports.typescript = require("typescript");
const tsLoaderOwnTs = { ...tsLoader, typescript };
export { tsLoaderOwnTs, tsLoader, typescript };
module.exports = tsLoader;
// ts-loader internally has a require("typescript") that applies regardless of "compiler".
