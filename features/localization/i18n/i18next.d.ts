import type en from "./en";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: false;
    enableSelector: "strict";
    returnNull: false;
  }

  interface ResourceNamespaceMap {
    "features/localization": typeof en;
  }
}

export {};
