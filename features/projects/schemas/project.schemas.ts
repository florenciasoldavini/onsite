import {
  PROJECT_BUILDING_TYPES,
  PROJECT_PHASES,
  PROJECT_STATUSES,
  PROJECT_TYPES
} from "@/features/projects/constants/project.constants";
import type {
  CreateProjectInput,
  ProjectFilters,
  ProjectFormValues,
  ResolvedProjectAddress,
  UpdateProjectInput
} from "@/features/projects/types/project.types";
import { z } from "zod";

const optionalDateSchema = z
  .string()
  .trim()
  .refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value), {
    message: "Use YYYY-MM-DD."
  });

const addressSchema = z.object({
  address: z.string().trim().min(4),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  placeId: z.string().trim().min(3)
});

const coverAssetSchema = z
  .object({
    fileName: z.string().nullable().optional(),
    mimeType: z.string().nullable().optional(),
    uri: z.string().trim().min(1)
  })
  .nullable()
  .optional();

export const projectFormSchema = z
  .object({
    address: addressSchema.nullable(),
    building_type: z.enum(PROJECT_BUILDING_TYPES),
    client_id: z.string().nullable(),
    coverAsset: coverAssetSchema,
    description: z.string().max(2000),
    end_date: optionalDateSchema,
    estimated_end_date: optionalDateSchema,
    estimated_start_date: optionalDateSchema,
    name: z.string().trim().min(2).max(120),
    phase: z.enum(PROJECT_PHASES),
    progress_percentage: z
      .number()
      .int({ message: "Progress must be a whole number." })
      .min(0, {
        message: "Progress must be between 0 and 100."
      })
      .max(100, {
        message: "Progress must be between 0 and 100."
      }),
    project_type: z.enum(PROJECT_TYPES),
    start_date: optionalDateSchema,
    status: z.enum(PROJECT_STATUSES)
  })
  .superRefine((value, context) => {
    if (!value.address) {
      context.addIssue({
        code: "custom",
        message: "Select an address from Google Maps.",
        path: ["address"]
      });
    }

    if (
      value.estimated_start_date &&
      value.estimated_end_date &&
      value.estimated_start_date > value.estimated_end_date
    ) {
      context.addIssue({
        code: "custom",
        message: "Estimated end date must be after the start date.",
        path: ["estimated_end_date"]
      });
    }

    if (
      value.start_date &&
      value.end_date &&
      value.start_date > value.end_date
    ) {
      context.addIssue({
        code: "custom",
        message: "End date must be after the start date.",
        path: ["end_date"]
      });
    }
  });

export type ProjectFormErrors = Partial<
  Record<keyof ProjectFormValues, string>
>;

export function validateProjectForm(values: ProjectFormValues): {
  errors: ProjectFormErrors;
  values: z.infer<typeof projectFormSchema> | null;
} {
  const result = projectFormSchema.safeParse(values);

  if (result.success) {
    return { errors: {}, values: result.data };
  }

  const errors: ProjectFormErrors = {};

  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof ProjectFormValues | undefined;

    if (key && !errors[key]) {
      errors[key] = issue.message;
    }
  }

  return { errors, values: null };
}

export function toCreateProjectInput({
  values
}: {
  values: Omit<ProjectFormValues, "coverAsset"> & {
    address: ResolvedProjectAddress;
  };
}): CreateProjectInput {
  return {
    address: values.address.address,
    building_type: values.building_type,
    client_id: values.client_id,
    description: normalizeNullableText(values.description),
    end_date: normalizeNullableText(values.end_date),
    estimated_end_date: normalizeNullableText(values.estimated_end_date),
    estimated_start_date: normalizeNullableText(values.estimated_start_date),
    google_place_id: values.address.placeId,
    latitude: values.address.latitude,
    longitude: values.address.longitude,
    name: values.name.trim(),
    phase: values.phase,
    progress_percentage: values.progress_percentage,
    project_type: values.project_type,
    start_date: normalizeNullableText(values.start_date),
    status: values.status
  };
}

export function toUpdateProjectInput(
  values: Omit<ProjectFormValues, "coverAsset"> & {
    address: ResolvedProjectAddress;
  }
): UpdateProjectInput {
  return toCreateProjectInput({ values });
}

export function normalizeProjectFilters(filters: ProjectFilters = {}) {
  return {
    buildingTypes: normalizeFilterList(
      filters.buildingTypes,
      filters.buildingType
    ),
    clientId: normalizeNullableText(filters.clientId ?? ""),
    phases: normalizeFilterList(filters.phases, filters.phase),
    projectTypes: normalizeFilterList(
      filters.projectTypes,
      filters.projectType
    ),
    query: normalizeNullableText(filters.query ?? ""),
    sort: normalizeProjectSort(filters.sort),
    statuses: normalizeFilterList(filters.statuses, filters.status)
  };
}

function normalizeFilterList<T extends string>(
  values: T[] | undefined,
  fallbackValue: T | "all" | undefined
) {
  if (values && values.length > 0) {
    return values;
  }

  if (fallbackValue && fallbackValue !== "all") {
    return [fallbackValue];
  }

  return null;
}

function normalizeProjectSort(sort: ProjectFilters["sort"]) {
  switch (sort) {
    case "created_asc":
    case "name_asc":
    case "name_desc":
      return sort;
    case "created_desc":
    default:
      return "created_desc";
  }
}

function normalizeNullableText(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}
