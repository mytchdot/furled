import * as path from "node:path";
import { Buffer } from "node:buffer"; /* https://nodejs.org/api/buffer.html#buffer */

import { sizeWithBuffer } from ".";

import { version } from "../../package.json";

import type { RenderSummary } from "../types";

export const renderSummary: RenderSummary = ({
  map,
  ext,
  code,
  assets,
  outDir,
  buildTime,
}) => {
  if (outDir && !outDir.endsWith(path.sep)) outDir += path.sep;

  const codeSize = Math.round(sizeWithBuffer(code));

  const mapSize = map ? Math.round(sizeWithBuffer(map)) : 0;

  const assetSizes = Object.create(null);

  let totalSize = codeSize;
  let maxAssetNameLength = 8 + (map ? 4 : 0); // length of index.js(.map)?

  for (const asset of Object.keys(assets)) {
    const assetSource = assets[asset].source;
    const assetSize = Math.round(
      (assetSource.byteLength || Buffer.byteLength(assetSource, "utf8")) / 1024
    );
    assetSizes[asset] = assetSize;
    totalSize += assetSize;
    if (asset.length > maxAssetNameLength) maxAssetNameLength = asset.length;
  }

  const orderedAssets = Object.keys(assets).sort((a, b) =>
    assetSizes[a] > assetSizes[b] ? 1 : -1
  );

  const sizePadding = totalSize.toString().length;

  let indexRender: string | null = `${codeSize
    .toString()
    .padStart(sizePadding, " ")}kB  ${outDir}index${ext}`;

  let indexMapRender: string | null = map
    ? `${mapSize
        .toString()
        .padStart(sizePadding, " ")}kB  ${outDir}index${ext}.map`
    : "";

  let output = "";
  let first = true;

  for (const asset of orderedAssets) {
    if (first) first = false;
    else output += "\n";
    if (codeSize < assetSizes[asset] && indexRender) {
      output += indexRender + "\n";
      indexRender = null;
    }
    if (mapSize && mapSize < assetSizes[asset] && indexMapRender) {
      output += indexMapRender + "\n";
      indexMapRender = null;
    }
    output += `${assetSizes[asset]
      .toString()
      .padStart(sizePadding, " ")}kB  ${outDir}${asset}`;
  }

  if (indexRender) {
    output += (first ? "" : "\n") + indexRender;
    first = false;
  }
  if (indexMapRender) output += (first ? "" : "\n") + indexMapRender;

  output += `\n${totalSize}kB  [${buildTime}ms] - furlify ${version}`;

  return output;
};
