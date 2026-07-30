import type en from "./en";

declare module "i18next" {
  interface ResourceNamespaceMap {
    "features/clients": typeof en;
  }
}

export {};
