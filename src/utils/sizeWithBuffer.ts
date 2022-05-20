export const sizeWithBuffer = (from: string) => {
  return Buffer.byteLength(from, "utf8") / 1024;
};
