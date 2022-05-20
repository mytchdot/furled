import type {
  ResolverCb,
  ResolverErr,
  ExternalMap,
  ResolverResult,
  ResolverMiddler,
  ResolverInnerPath,
  ResolverFinalResolve,
} from "../types";
import type { Resolver } from "webpack";
import type { ResolveContext } from "tsconfig-paths-webpack-plugin/lib/plugin.temp.types";

export const resolverResolve = (
  resolve: Resolver["resolve"],
  externalMap: ExternalMap
) => {
  return function (
    this: ThisType<any>,
    context: { issuer: string },
    path: string,
    request: string,
    resolveContext: ResolveContext,
    callback: ResolverCb
  ) {
    const self = this;
    resolve.call(
      self,
      context,
      path,
      request,
      resolveContext,
      middler({
        self,
        path,
        context,
        request,
        resolve,
        callback,
        externalMap,
        resolveContext,
      })
    );
  };
};

const finalResolve: ResolverFinalResolve = ({
  err,
  result,
  request,
  callback,
  innerPath,
  externalMap,
}) => {
  if (result) return callback(null, innerPath, result);
  if (err && !err.message.startsWith("Can't resolve")) return callback(err);
  // make not found errors runtime errors
  callback(
    null,
    __dirname + "/@@notfound.js?" + (externalMap.get(request) || request)
  );
};

const middler: ResolverMiddler =
  ({
    self,
    path,
    request,
    context,
    resolve,
    callback,
    externalMap,
    resolveContext,
  }) =>
  (err: ResolverErr, innerPath: ResolverInnerPath, result: ResolverResult) => {
    if (result) return callback(null, innerPath, result);
    if (err && !err.message.startsWith("Can't resolve")) return callback(err);
    // Allow .js resolutions to .tsx? from .tsx?
    if (
      request.endsWith(".js") &&
      context.issuer &&
      (context.issuer.endsWith(".ts") || context.issuer.endsWith(".tsx"))
    ) {
      return resolve.call(
        self,
        context,
        path,
        request.slice(0, -3),
        resolveContext,
        finalResolve({
          err,
          result,
          callback,
          innerPath,
          externalMap,
          request: request.slice(0, -3),
        })
      );
    }
    // make not found errors runtime errors
    callback(
      null,
      __dirname + "/@@notfound.js?" + (externalMap.get(request) || request)
    );
  };
