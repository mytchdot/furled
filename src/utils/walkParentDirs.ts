import * as fs from "node:fs";
import * as path from "node:path";

import type { WalkParentDirs } from "../types";

export const walkParentDirs: WalkParentDirs = async ({
  base,
  start,
  filename,
}) => {
  let parent = "";

  for (let current = start; base.length <= current.length; current = parent) {
    const fullPath = path.join(current, filename);

    try {
      await fs.promises.access(fullPath);
      return fullPath;
    } catch {
      parent = path.dirname(current);
    }
  }

  return null;
};
