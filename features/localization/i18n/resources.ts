import localizationEn from "@/features/localization/i18n/en";
import localizationEs from "@/features/localization/i18n/es";
import authEn from "@/features/auth/i18n/en";
import authEs from "@/features/auth/i18n/es";
import clientsEn from "@/features/clients/i18n/en";
import clientsEs from "@/features/clients/i18n/es";
import contractorsEn from "@/features/contractors/i18n/en";
import contractorsEs from "@/features/contractors/i18n/es";
import directoryEn from "@/features/directory/i18n/en";
import directoryEs from "@/features/directory/i18n/es";
import documentsEn from "@/features/documents/i18n/en";
import documentsEs from "@/features/documents/i18n/es";
import locationsEn from "@/features/locations/i18n/en";
import locationsEs from "@/features/locations/i18n/es";
import projectsEn from "@/features/projects/i18n/en";
import projectsEs from "@/features/projects/i18n/es";
import profileEn from "@/features/profile/i18n/en";
import profileEs from "@/features/profile/i18n/es";
import photosEn from "@/features/photos/i18n/en";
import photosEs from "@/features/photos/i18n/es";
import tasksEn from "@/features/tasks/i18n/en";
import tasksEs from "@/features/tasks/i18n/es";
import tradeCategoriesEn from "@/features/trade-categories/i18n/en";
import tradeCategoriesEs from "@/features/trade-categories/i18n/es";
import suppliersEn from "@/features/suppliers/i18n/en";
import suppliersEs from "@/features/suppliers/i18n/es";
import workersEn from "@/features/workers/i18n/en";
import workersEs from "@/features/workers/i18n/es";
import sharedEn from "@/shared/i18n/en";
import sharedEs from "@/shared/i18n/es";

export const localizationResources = {
  en: {
    "features/auth": authEn,
    "features/clients": clientsEn,
    "features/contractors": contractorsEn,
    "features/directory": directoryEn,
    "features/documents": documentsEn,
    "features/localization": localizationEn,
    "features/locations": locationsEn,
    "features/projects": projectsEn,
    "features/profile": profileEn,
    "features/photos": photosEn,
    "features/tasks": tasksEn,
    "features/trade-categories": tradeCategoriesEn,
    "features/suppliers": suppliersEn,
    "features/workers": workersEn,
    shared: sharedEn
  },
  es: {
    "features/auth": authEs,
    "features/clients": clientsEs,
    "features/contractors": contractorsEs,
    "features/directory": directoryEs,
    "features/documents": documentsEs,
    "features/localization": localizationEs,
    "features/locations": locationsEs,
    "features/projects": projectsEs,
    "features/profile": profileEs,
    "features/photos": photosEs,
    "features/tasks": tasksEs,
    "features/trade-categories": tradeCategoriesEs,
    "features/suppliers": suppliersEs,
    "features/workers": workersEs,
    shared: sharedEs
  }
} as const;
