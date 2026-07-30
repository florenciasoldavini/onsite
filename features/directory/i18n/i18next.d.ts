import type en from "./en";

declare module "i18next" {
  interface ResourceNamespaceMap {
    "features/directory": typeof en;
  }
}

export {};
