import type { PROJECT_PHOTO_KINDS } from "@/features/photos/constants/photo.constants";

export type ProjectPhotoKind = (typeof PROJECT_PHOTO_KINDS)[number];
export type ProjectPhotoLocationSource = "photo_exif";

export interface ProjectPhoto {
  caption: string | null;
  captured_at: string;
  created_at: string;
  deleted_at: string | null;
  file_size_bytes: number;
  full_path: string;
  full_url?: string | null;
  height: number;
  id: string;
  is_marketing: boolean;
  kind: ProjectPhotoKind;
  latitude: number | null;
  location_accuracy_meters: number | null;
  location_source: ProjectPhotoLocationSource | null;
  longitude: number | null;
  mime_type: "image/jpeg";
  owner_id: string;
  project_id: string;
  thumbnail_path: string;
  thumbnail_url?: string | null;
  updated_at: string | null;
  uploaded_by: string;
  width: number;
}

export interface ProjectPhotoAsset {
  exif?: Record<string, unknown> | null;
  file?: Blob | null;
  fileName?: string | null;
  fileSize?: number | null;
  height: number;
  mimeType?: string | null;
  uri: string;
  width: number;
}

export interface ProjectPhotoDraft {
  asset: ProjectPhotoAsset;
  caption: string;
  id: string;
  is_marketing: boolean;
  kind: ProjectPhotoKind;
}

export interface ProjectPhotoFilters {
  kind?: ProjectPhotoKind | "all";
  marketing?: "all" | "marketing";
}

export interface NormalizedProjectPhotoAsset {
  capturedAt: string;
  fileSizeBytes: number;
  fullUri: string;
  height: number;
  latitude: number | null;
  locationAccuracyMeters: number | null;
  locationSource: ProjectPhotoLocationSource | null;
  longitude: number | null;
  thumbnailUri: string;
  width: number;
}

export interface CreateProjectPhotoInput {
  caption: string | null;
  captured_at: string;
  file_size_bytes: number;
  full_path: string;
  height: number;
  id: string;
  is_marketing: boolean;
  kind: ProjectPhotoKind;
  latitude: number | null;
  location_accuracy_meters: number | null;
  location_source: ProjectPhotoLocationSource | null;
  longitude: number | null;
  mime_type: "image/jpeg";
  project_id: string;
  thumbnail_path: string;
  width: number;
}

export interface UpdateProjectPhotoInput {
  caption: string | null;
  is_marketing: boolean;
  kind: ProjectPhotoKind;
}

export interface ProjectPhotoUploadOutcome {
  error: Error | null;
  photo: ProjectPhoto | null;
  photoId: string;
  status: "failed" | "saved";
}
