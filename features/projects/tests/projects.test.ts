import {
  mapAddressSuggestions,
  mapResolvedAddress,
  mapStaticMapPreview
} from "@/features/projects/maps/map-payloads";
import {
  getDraggedProjectsMapViewport,
  getProjectMapPoints,
  getProjectsMapViewport
} from "@/features/projects/maps/map-points";
import { toLiveUserLocation } from "@/features/projects/maps/live-user-location-values";
import { getMapsFunctionErrorMessage } from "@/features/projects/maps/map-errors";
import { buildProjectListQueryPlan } from "@/features/projects/repositories/project-list-query";
import type { Project, ProjectFormValues } from "@/features/projects/types/project.types";
import {
  normalizeProjectFilters,
  toCreateProjectInput,
  validateProjectForm
} from "@/features/projects/schemas/project.schemas";
import { consumeFixedWindowRateLimit } from "@/shared/utils/rate-limit";
import { describe, expect, it } from "vitest";

const validValues: ProjectFormValues = {
  address: {
    address: "Av. Corrientes 1234, Buenos Aires",
    latitude: -34.6037,
    longitude: -58.3816,
    placeId: "google-place-id"
  },
  building_type: "commercial",
  client_id: null,
  coverAsset: null,
  description: "Lobby renovation",
  end_date: "",
  estimated_end_date: "2026-08-01",
  estimated_start_date: "2026-07-01",
  name: "Corrientes Renovation",
  phase: "design",
  progress_percentage: 15,
  project_type: "renovation",
  start_date: "",
  status: "planned"
};

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

describe("project validation", () => {
  it("requires a Google-selected address with coordinates", () => {
    const result = validateProjectForm({ ...validValues, address: null });

    expect(result.values).toBeNull();
    expect(result.errors.address).toBe("Select an address from Google Maps.");
  });

  it("normalizes valid form values into create input", () => {
    const result = validateProjectForm(validValues);

    expect(result.errors).toEqual({});
    expect(result.values).not.toBeNull();

    const input = toCreateProjectInput({
      values: result.values as ProjectFormValues & {
        address: NonNullable<ProjectFormValues["address"]>;
      }
    });

    expect(input).toMatchObject({
      address: "Av. Corrientes 1234, Buenos Aires",
      client_id: null,
      description: "Lobby renovation",
      google_place_id: "google-place-id",
      progress_percentage: 15
    });
    expect(input).not.toHaveProperty("owner_id");
  });

  it("rejects invalid date ordering", () => {
    const result = validateProjectForm({
      ...validValues,
      estimated_end_date: "2026-06-01"
    });

    expect(result.errors.estimated_end_date).toBe(
      "Estimated end date must be after the start date."
    );
  });
});

describe("project filters and query planning", () => {
  it("normalizes all filter values to null", () => {
    expect(
      normalizeProjectFilters({
        phase: "all",
        projectType: "all",
        query: "  ",
        status: "all"
      })
    ).toEqual({
      buildingTypes: null,
      clientId: null,
      phases: null,
      projectTypes: null,
      query: null,
      sort: "created_desc",
      statuses: null
    });
  });

  it("adds owner filtering for normal users", () => {
    const plan = buildProjectListQueryPlan({
      filters: { status: "in_progress" },
      userId: "user-id",
      userRole: "user"
    });

    expect(plan.filters).toContainEqual({
      column: "deleted_at",
      operator: "is",
      value: null
    });
    expect(plan.filters).toContainEqual({
      column: "owner_id",
      operator: "eq",
      value: "user-id"
    });
  });

  it("filters linked projects by client", () => {
    const plan = buildProjectListQueryPlan({
      filters: { clientId: "client-id" },
      userId: "user-id",
      userRole: "user"
    });

    expect(plan.filters).toContainEqual({
      column: "client_id",
      operator: "eq",
      value: "client-id"
    });
  });

  it("does not add owner filtering for admins", () => {
    const plan = buildProjectListQueryPlan({
      filters: { status: "in_progress" },
      userId: "admin-id",
      userRole: "admin"
    });

    expect(plan.filters).not.toContainEqual({
      column: "owner_id",
      operator: "eq",
      value: "admin-id"
    });
  });

  it("plans multi-select category filters", () => {
    const plan = buildProjectListQueryPlan({
      filters: {
        phases: ["design", "construction"],
        projectTypes: ["new_build", "renovation"],
        statuses: ["planned", "in_progress"]
      },
      userId: "user-id",
      userRole: "user"
    });

    expect(plan.filters).toContainEqual({
      column: "status",
      operator: "in",
      value: ["planned", "in_progress"]
    });
    expect(plan.filters).toContainEqual({
      column: "phase",
      operator: "in",
      value: ["design", "construction"]
    });
    expect(plan.filters).toContainEqual({
      column: "project_type",
      operator: "in",
      value: ["new_build", "renovation"]
    });
  });

  it("sorts by newest creation by default", () => {
    const plan = buildProjectListQueryPlan({
      filters: {},
      userId: "user-id",
      userRole: "user"
    });

    expect(plan.orders).toEqual([
      { ascending: false, column: "created_at" },
      { ascending: true, column: "id" }
    ]);
  });

  it("sorts alphabetically when requested", () => {
    const plan = buildProjectListQueryPlan({
      filters: { sort: "name_asc" },
      userId: "user-id",
      userRole: "user"
    });

    expect(plan.orders).toEqual([
      { ascending: true, column: "name" },
      { ascending: true, column: "id" }
    ]);
  });

  it("sorts descending when requested", () => {
    const plan = buildProjectListQueryPlan({
      filters: { sort: "name_desc" },
      userId: "user-id",
      userRole: "user"
    });

    expect(plan.orders).toEqual([
      { ascending: false, column: "name" },
      { ascending: true, column: "id" }
    ]);
  });

  it("sorts creation ascending when requested", () => {
    const plan = buildProjectListQueryPlan({
      filters: { sort: "created_asc" },
      userId: "user-id",
      userRole: "user"
    });

    expect(plan.orders).toEqual([
      { ascending: true, column: "created_at" },
      { ascending: true, column: "id" }
    ]);
  });
});

describe("Google Maps response mapping", () => {
  it("maps autocomplete suggestions defensively", () => {
    expect(
      mapAddressSuggestions({
        suggestions: [
          { placeId: "ignored" },
          { placeId: "place-1", text: "Main St" },
          null
        ]
      })
    ).toEqual([{ placeId: "place-1", text: "Main St" }]);
  });

  it("maps resolved address coordinates", () => {
    expect(
      mapResolvedAddress({
        address: "Main St",
        latitude: -34,
        longitude: -58,
        placeId: "place-1"
      })
    ).toEqual({
      address: "Main St",
      latitude: -34,
      longitude: -58,
      placeId: "place-1"
    });
  });

  it("maps static map preview image responses", () => {
    expect(
      mapStaticMapPreview({
        attribution: "Google Maps",
        imageDataUrl: "data:image/png;base64,abc"
      })
    ).toEqual({
      attribution: "Google Maps",
      imageDataUrl: "data:image/png;base64,abc"
    });
  });
});

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

describe("live user location", () => {
  it("normalizes Expo location coordinates for map markers", () => {
    expect(
      toLiveUserLocation({
        coords: {
          accuracy: 8,
          latitude: -34.5663,
          longitude: -58.469
        }
      })
    ).toEqual({
      accuracy: 8,
      latitude: -34.5663,
      longitude: -58.469
    });
  });
});

describe("Google Maps repository errors", () => {
  it("does not expose Edge Function error payload messages", () => {
    const error = new Error(
      "Edge Function returned a non-2xx status code"
    ) as Error & { context: Response };
    error.context = new Response(
      JSON.stringify({ error: "private provider configuration detail" }),
      { status: 500 }
    );

    expect(
      getMapsFunctionErrorMessage(
        error,
        "Map preview is unavailable right now."
      )
    ).toBe("Map preview is unavailable right now.");
  });

  it("maps rate limits from the stable HTTP status", () => {
    const error = new Error("Function failed") as Error & {
      context: Response;
    };
    error.context = new Response(null, { status: 429 });

    expect(getMapsFunctionErrorMessage(error, "Fallback")).toBe(
      "Too many map requests were made. Wait a moment and try again."
    );
  });
});

describe("rate limit helper", () => {
  it("allows requests until the fixed window limit is reached", () => {
    const store = new Map();

    expect(
      consumeFixedWindowRateLimit({
        key: "user",
        limit: 2,
        now: 1000,
        store,
        windowMs: 60_000
      }).allowed
    ).toBe(true);
    expect(
      consumeFixedWindowRateLimit({
        key: "user",
        limit: 2,
        now: 1001,
        store,
        windowMs: 60_000
      }).allowed
    ).toBe(true);
    expect(
      consumeFixedWindowRateLimit({
        key: "user",
        limit: 2,
        now: 1002,
        store,
        windowMs: 60_000
      }).allowed
    ).toBe(false);
  });
});
