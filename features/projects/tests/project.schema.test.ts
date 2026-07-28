import {
  normalizeProjectFilters,
  toCreateProjectInput,
  validateProjectForm
} from "@/features/projects/schemas/project.schema";
import type { ProjectFormValues } from "@/features/projects/types/project.types";
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

describe("project schema", () => {
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

  it("normalizes inactive filter values to null", () => {
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
});
