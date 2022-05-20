import { SUPPORTED_EXTENSIONS } from "../constants";

export const generateDepsType = (mainFields: string[], production: boolean) => {
  const sharedDepsProps = {
    mainFields,
    extensions: SUPPORTED_EXTENSIONS,
    exportsFields: ["exports"],
    importsFields: ["imports"],
  };
  const sharedConditions = ["node", production ? "production" : "development"];

  const cjsDeps = () => ({
    ...sharedDepsProps,
    conditionNames: ["require", ...sharedConditions],
  });
  const esmDeps = () => ({
    ...sharedDepsProps,
    conditionNames: ["import", ...sharedConditions],
  });

  return { cjsDeps, esmDeps };
};
