import { z } from "zod";
import {
  PROJECT_BUILDING_TYPES,
  PROJECT_PHASES,
  PROJECT_STATUSES,
  PROJECT_TYPES
} from "@/features/projects/constants/project.constants";
import type { Project } from "@/features/projects/types/project.types";

export const ProjectSchema: z.ZodType<Project> = z.object({
  id: z.string(),
  owner_id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  cover_image_path: z.string().nullable(),
  address: z.string(),
  google_place_id: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  building_type: z.enum(PROJECT_BUILDING_TYPES),
  client_id: z.string().nullable(),
  project_type: z.enum(PROJECT_TYPES),
  status: z.enum(PROJECT_STATUSES),
  phase: z.enum(PROJECT_PHASES),
  progress_percentage: z.number(),
  estimated_start_date: z.string().nullable(),
  start_date: z.string().nullable(),
  estimated_end_date: z.string().nullable(),
  end_date: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
  deleted_at: z.string().nullable()
});
