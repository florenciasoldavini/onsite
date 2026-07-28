import {
  getDraggedProjectsMapViewport,
  getProjectMapPoints,
  getProjectsMapViewport
} from "@/features/projects/maps/map-points";
import type { Project } from "@/features/projects/types/project.types";
import { describe, expect, it } from "vitest";

function createProjectFixture(overrides: Partial<Project>): Project {
  return {
    address: "Av. Corrientes 1234, Buenos Aires",
    building_type: "commercial",
    client_id: null,
    cover_image_path: null,
    created_at: "2026-07-01T00:00:00.000Z",
    deleted_at: null,
    description: null,
    end_date: null,
    estimated_end_date: null,
    estimated_start_date: null,
    google_place_id: "place-1",
    id: "project-1",
    latitude: -34.6037,
    longitude: -58.3816,
    name: "Corrientes Renovation",
    owner_id: "user-id",
    phase: "design",
    progress_percentage: 15,
    project_type: "renovation",
    start_date: null,
    status: "planned",
    updated_at: null,
    ...overrides
  };
}

describe("project map points", () => {
  it("normalizes project coordinates into a padded map canvas", () => {
    const points = getProjectMapPoints([
      createProjectFixture({
        id: "south-west",
        latitude: -35,
        longitude: -59
      }),
      createProjectFixture({
        id: "north-east",
        latitude: -34,
        longitude: -58
      })
    ]);

    expect(points).toHaveLength(2);
    expect(points[0]).toMatchObject({ x: 12, y: 88 });
    expect(points[1]).toMatchObject({ x: 88, y: 12 });
  });

  it("centers projects when all coordinates are identical", () => {
    const points = getProjectMapPoints([
      createProjectFixture({ id: "first" }),
      createProjectFixture({ id: "second" })
    ]);

    expect(points.map((point) => ({ x: point.x, y: point.y }))).toEqual([
      { x: 50, y: 50 },
      { x: 50, y: 50 }
    ]);
  });

  it("projects the map center to the center of the canvas", () => {
    const project = createProjectFixture({
      latitude: -34.6037,
      longitude: -58.3816
    });
    const points = getProjectMapPoints([project], {
      centerLatitude: project.latitude,
      centerLongitude: project.longitude,
      zoom: 15
    });

    expect(points[0].x).toBeCloseTo(50);
    expect(points[0].y).toBeCloseTo(50);
  });

  it("updates the viewport center after dragging the map", () => {
    const viewport = getProjectsMapViewport([
      createProjectFixture({
        latitude: -34.6037,
        longitude: -58.3816
      })
    ]);

    expect(viewport).not.toBeNull();

    const draggedViewport = getDraggedProjectsMapViewport(viewport!, 80, 0);

    expect(draggedViewport.centerLongitude).toBeLessThan(
      viewport!.centerLongitude
    );
    expect(draggedViewport.zoom).toBe(viewport!.zoom);
  });
});
