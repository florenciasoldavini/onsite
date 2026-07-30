import type en from "./en";
declare module "i18next" {
  interface ResourceNamespaceMap {
    "features/contractors": typeof en;
  }
}
export {};
