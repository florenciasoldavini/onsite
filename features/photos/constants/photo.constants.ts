export const PROJECT_PHOTO_KINDS = [
  "general",
  "progress",
  "issue",
  "safety",
  "quality",
  "delivery",
  "milestone"
] as const;

export const PROJECT_PHOTO_KIND_LABELS = {
  delivery: "Delivery",
  general: "General",
  issue: "Issue",
  milestone: "Milestone",
  progress: "Progress",
  quality: "Quality",
  safety: "Safety"
} as const;

export const PROJECT_PHOTO_KIND_LABELS_BY_LANGUAGE = {
  en: PROJECT_PHOTO_KIND_LABELS,
  es: {
    delivery: "Entrega",
    general: "General",
    issue: "Problema",
    milestone: "Hito",
    progress: "Avance",
    quality: "Calidad",
    safety: "Seguridad"
  }
} as const;

export const PROJECT_PHOTO_BUCKET = "project-photos";
export const PROJECT_PHOTO_BATCH_LIMIT = 20;
export const PROJECT_PHOTO_PAGE_SIZE = 24;
export const PROJECT_PHOTO_MAX_BYTES = 6 * 1024 * 1024;
export const PROJECT_PHOTO_FULL_MAX_DIMENSION = 3200;
export const PROJECT_PHOTO_THUMBNAIL_MAX_DIMENSION = 640;
