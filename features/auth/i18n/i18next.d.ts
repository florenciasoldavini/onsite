import type en from "./en";

declare module "i18next" {
  interface ResourceNamespaceMap {
    "features/auth": typeof en;
  }
}

export {};
