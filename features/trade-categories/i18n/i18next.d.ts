import type en from "./en";

declare module "i18next" {
  interface ResourceNamespaceMap {
    "features/trade-categories": typeof en;
  }
}

export {};
