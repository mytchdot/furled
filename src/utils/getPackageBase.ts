import { PKG_NAME_REGEX } from "../constants";

export const getPacakgeBase = (id: string) => {
  const pkgIndex = id.lastIndexOf("node_modules");

  const indexExists = pkgIndex !== -1;

  const idAtIndexMinusOneIsSlash =
    id[pkgIndex - 1] === "/" || id[pkgIndex - 1] === "\\";

  const idAtIndexPlusTwelveIsSlash =
    id[pkgIndex + 12] === "/" || id[pkgIndex + 12] === "\\";

  if (indexExists && idAtIndexMinusOneIsSlash && idAtIndexPlusTwelveIsSlash) {
    const pkgNameMatch = id.substring(pkgIndex + 13).match(PKG_NAME_REGEX);
    if (pkgNameMatch)
      return id.substring(0, pkgIndex + 13 + pkgNameMatch[0].length);
  }
};
