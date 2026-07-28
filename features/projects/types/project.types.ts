import type {
  PROJECT_BUILDING_TYPES,
  PROJECT_PHASES,
  PROJECT_STATUSES,
  PROJECT_TYPES
} from "@/features/projects/constants/project.constants";
import type {
  ResolvedAddress,
  StaticMapPoint as LocationStaticMapPoint,
  StaticMapViewport as LocationStaticMapViewport
} from "@/features/locations/types/location";

export type ProjectBuildingType = (typeof PROJECT_BUILDING_TYPES)[number];
export type ProjectType = (typeof PROJECT_TYPES)[number];
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export type ProjectPhase = (typeof PROJECT_PHASES)[number];
export type ProjectSort =
  | "created_asc"
  | "created_desc"
  | "name_asc"
  | "name_desc";

export interface Project {
  address: string;
  building_type: ProjectBuildingType;
  client_id: string | null;
  cover_image_path: string | null;
  cover_image_url?: string | null;
  created_at: string;
  deleted_at: string | null;
  description: string | null;
  end_date: string | null;
  estimated_end_date: string | null;
  estimated_start_date: string | null;
  google_place_id: string;
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  owner_id: string;
  phase: ProjectPhase;
  progress_percentage: number;
  project_type: ProjectType;
  start_date: string | null;
  status: ProjectStatus;
  updated_at: string | null;
}

export type ProjectSummary = Pick<
  Project,
  | "address"
  | "cover_image_path"
  | "estimated_end_date"
  | "id"
  | "latitude"
  | "longitude"
  | "name"
  | "phase"
  | "progress_percentage"
  | "project_type"
  | "status"
> & {
  cover_image_url?: string | null;
};

export interface ProjectFilters {
  buildingType?: ProjectBuildingType | "all";
  buildingTypes?: ProjectBuildingType[];
  clientId?: string;
  phase?: ProjectPhase | "all";
  phases?: ProjectPhase[];
  projectType?: ProjectType | "all";
  projectTypes?: ProjectType[];
  query?: string;
  sort?: ProjectSort;
  status?: ProjectStatus | "all";
  statuses?: ProjectStatus[];
}

export type ResolvedProjectAddress = ResolvedAddress;

export interface ProjectCoverAsset {
  fileName?: string | null;
  mimeType?: string | null;
  uri: string;
}

export interface ProjectFormValues {
  address: ResolvedProjectAddress | null;
  building_type: ProjectBuildingType;
  client_id: string | null;
  coverAsset?: ProjectCoverAsset | null;
  description: string;
  end_date: string;
  estimated_end_date: string;
  estimated_start_date: string;
  name: string;
  phase: ProjectPhase;
  progress_percentage: number;
  project_type: ProjectType;
  start_date: string;
  status: ProjectStatus;
}

export interface CreateProjectInput {
  address: string;
  building_type: ProjectBuildingType;
  client_id: string | null;
  description: string | null;
  end_date: string | null;
  estimated_end_date: string | null;
  estimated_start_date: string | null;
  google_place_id: string;
  latitude: number;
  longitude: number;
  name: string;
  phase: ProjectPhase;
  progress_percentage: number;
  project_type: ProjectType;
  start_date: string | null;
  status: ProjectStatus;
}

export type UpdateProjectInput = Partial<CreateProjectInput> & {
  cover_image_path?: string | null;
};

export interface ProjectSaveOutcome {
  coverStatus: "failed" | "not-requested" | "saved";
  project: Project;
}

export type StaticMapPoint = LocationStaticMapPoint;
export type StaticMapViewport = LocationStaticMapViewport;
