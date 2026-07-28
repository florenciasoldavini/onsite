import { getLocationMapPreview } from "@/features/locations/services/locations.service";
import type {
  StaticMapPoint,
  StaticMapViewport
} from "@/features/projects/types/project.types";

export function getProjectsMapPreview({
  points,
  viewport
}: {
  points: StaticMapPoint[];
  viewport?: StaticMapViewport | null;
}) {
  return getLocationMapPreview({ points, viewport });
}
