#!/usr/bin/env node
import { runCommand } from './utils';

//@ts-ignore
process.noDeprecation = true; // License and TypeScript plugins have Webpack deprecation warnings we don't want these on when running as a CLI utility

if (require.main === module) {
  runCommand(process.argv.slice(2), process.stdout, process.stderr)
    .then((watching) => {
      if (!watching) process.exit();
    })
    .catch((e) => {
      if (!e.silent) console.error(e.furledError ? e.message : e);
      process.exit(e.exitCode || 1);
    });
} else {
  module.exports = runCommand;
}
