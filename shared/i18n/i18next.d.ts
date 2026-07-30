import type en from "./en";

declare module "i18next" {
  interface ResourceNamespaceMap {
    shared: typeof en;
  }
}

export {};
