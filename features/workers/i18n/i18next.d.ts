import type en from "./en";
declare module "i18next" {
  interface ResourceNamespaceMap {
    "features/workers": typeof en;
  }
}
export {};
