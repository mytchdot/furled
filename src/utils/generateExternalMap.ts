import type { ExternalMapSet, ExternalMapGet } from "../types";

export const generateExternalMap = () => {
  const regexps: RegExp[] = [];
  const aliasMap = new Map<unknown, string>();
  const regexCache = new Map<string, string>();

  const set: ExternalMapSet = (key, value) => {
    if (key instanceof RegExp) regexps.push(key);
    aliasMap.set(key, value);
  };

  const get: ExternalMapGet = (key) => {
    if (aliasMap.has(key)) return aliasMap.get(key);
    if (regexCache.has(key)) return regexCache.get(key);

    for (const regex of regexps) {
      const matches = key.match(regex);

      if (matches) {
        let result = aliasMap.get(regex);

        if (result) {
          if (matches.length > 1) {
            // allow using match from regex in result
            // e.g. caniuse-lite(/.*) -> caniuse-lite$1
            result = result.replace(/(\$\d)/g, (match: string) => {
              const index = parseInt(match.slice(1), 10);
              return matches[index] || match;
            });
          }
          regexCache.set(key, result);
          return result;
        }
      }
    }
    return null;
  };

  return { get, set };
};
