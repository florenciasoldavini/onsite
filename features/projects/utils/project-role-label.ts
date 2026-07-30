import type { SupportedLanguage } from "@/features/localization/types/language";

const labels = {
  en: {
    collaborator: "Collaborator",
    manager: "Manager",
    member: "Member",
    owner: "Owner",
    viewer: "Viewer"
  },
  es: {
    collaborator: "Colaborador",
    manager: "Responsable",
    member: "Miembro",
    owner: "Propietario",
    viewer: "Observador"
  }
} as const;

export function getProjectRoleLabel(
  code: string,
  language: SupportedLanguage,
  fallback = code
) {
  return labels[language][code as keyof (typeof labels)["en"]] ?? fallback;
}
