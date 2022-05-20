import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";

import { osTmpDir, errTooManyArguments, errFlagNotCompatible } from "../utils";

import type { CLICasesRun } from "../types";

export const cliCasesRun: CLICasesRun = async ({ args, outDir, run }) => {
  if (args._.length > 2) errTooManyArguments("run");

  if (args["--out"]) errFlagNotCompatible("--out", "run");

  if (args["--watch"]) errFlagNotCompatible("--watch", "run");

  outDir = path.resolve(
    osTmpDir,
    crypto
      .createHash("sha256")
      .update(path.resolve(args._[1] || "."))
      .digest("hex")
  );

  try {
    await fs.promises.access(outDir);
    await fs.promises.rm(outDir, { recursive: true, force: true });
  } catch {}

  try {
    await fs.promises.mkdir(outDir);
  } catch (err) {
    throw new Error(
      "Something went wrong when attempting to create a new outDir."
    );
  }
  run = true;
};
