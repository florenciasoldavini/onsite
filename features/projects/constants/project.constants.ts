export const PROJECT_BUILDING_TYPES = [
  "residential",
  "commercial",
  "industrial",
  "infrastructure",
  "institutional",
  "mixed_use"
] as const;

export const PROJECT_TYPES = [
  "new_build",
  "renovation",
  "remodel",
  "expansion",
  "maintenance"
] as const;

export const PROJECT_STATUSES = [
  "planned",
  "in_progress",
  "on_hold",
  "completed",
  "cancelled"
] as const;

export const PROJECT_PHASES = [
  "concept",
  "design",
  "permits",
  "preconstruction",
  "procurement",
  "construction",
  "post_construction"
] as const;

export const PROJECT_COVER_BUCKET = "project-covers";

export const PROJECT_STATUS_LABELS = {
  cancelled: "Cancelled",
  completed: "Completed",
  in_progress: "In progress",
  on_hold: "On hold",
  planned: "Planned"
} as const;

export const PROJECT_PHASE_LABELS = {
  concept: "Concept",
  construction: "Construction",
  design: "Design",
  permits: "Permits",
  post_construction: "Post construction",
  preconstruction: "Preconstruction",
  procurement: "Procurement"
} as const;

export const PROJECT_TYPE_LABELS = {
  expansion: "Expansion",
  maintenance: "Maintenance",
  new_build: "New build",
  remodel: "Remodel",
  renovation: "Renovation"
} as const;

export const PROJECT_BUILDING_TYPE_LABELS = {
  commercial: "Commercial",
  industrial: "Industrial",
  infrastructure: "Infrastructure",
  institutional: "Institutional",
  mixed_use: "Mixed use",
  residential: "Residential"
} as const;

export const PROJECT_LABELS_BY_LANGUAGE = {
  en: {
    buildingTypes: PROJECT_BUILDING_TYPE_LABELS,
    phases: PROJECT_PHASE_LABELS,
    statuses: PROJECT_STATUS_LABELS,
    types: PROJECT_TYPE_LABELS
  },
  es: {
    buildingTypes: {
      commercial: "Comercial",
      industrial: "Industrial",
      infrastructure: "Infraestructura",
      institutional: "Institucional",
      mixed_use: "Uso mixto",
      residential: "Residencial"
    },
    phases: {
      concept: "Concepto",
      construction: "Construcción",
      design: "Diseño",
      permits: "Permisos",
      post_construction: "Posconstrucción",
      preconstruction: "Preconstrucción",
      procurement: "Compras"
    },
    statuses: {
      cancelled: "Cancelado",
      completed: "Completado",
      in_progress: "En curso",
      on_hold: "En pausa",
      planned: "Planificado"
    },
    types: {
      expansion: "Ampliación",
      maintenance: "Mantenimiento",
      new_build: "Obra nueva",
      remodel: "Remodelación",
      renovation: "Renovación"
    }
  }
} as const;
