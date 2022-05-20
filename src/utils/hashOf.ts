import * as crypto from "crypto";
export const hashOf = (name: string) => {
  return crypto.createHash("sha256").update(name).digest("hex").slice(0, 10);
};
