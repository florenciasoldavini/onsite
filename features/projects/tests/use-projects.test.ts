import type { User } from "@/features/auth/types/auth.types";
import {
  useCreateProject,
  useProject,
  useProjectsMapPreview,
  useProjects,
  useSoftDeleteProject,
  useUpdateProject
} from "@/features/projects/hooks/use-projects";
import {
  createProjectWithOptionalCover,
  getProject,
  listProjects,
  softDeleteProject,
  updateProjectWithOptionalCover
} from "@/features/projects/services/projects.service";
import { getProjectsMapPreview } from "@/features/projects/services/projects-map.service";
import type {
  CreateProjectInput,
  Project,
  ProjectSaveOutcome
} from "@/features/projects/types/project.types";
import {
  createTestQueryClient,
  renderHookWithAppProviders
} from "@/tests/support/render";
import { act, waitFor } from "@testing-library/react-native";
import type { Session } from "@supabase/supabase-js";

jest.mock("@/features/projects/services/projects.service", () => ({
  createProjectWithOptionalCover: jest.fn(),
  getProject: jest.fn(),
  listProjects: jest.fn(),
  softDeleteProject: jest.fn(),
  updateProjectWithOptionalCover: jest.fn()
}));

jest.mock("@/features/projects/services/projects-map.service", () => ({
  getProjectsMapPreview: jest.fn()
}));

const user: User = {
  avatar: null,
  created_at: new Date("2026-07-28T10:00:00.000Z"),
  deleted_at: null,
  email: "owner@example.com",
  first_name: "Site",
  id: "owner-1",
  last_name: "Manager",
  phone_number: null,
  role: "user",
  updated_at: null,
  welcome_email_sent_at: new Date("2026-07-28T10:01:00.000Z")
};

const session = {
  user: {
    email: user.email,
    id: user.id
  }
} as Session;

const project: Project = {
  address: "1 Site Road",
  building_type: "residential",
  client_id: null,
  cover_image_path: null,
  created_at: "2026-07-28T10:00:00.000Z",
  deleted_at: null,
  description: null,
  end_date: null,
  estimated_end_date: null,
  estimated_start_date: null,
  google_place_id: "place-1",
  id: "project-1",
  latitude: -34.6,
  longitude: -58.4,
  name: "River House",
  owner_id: user.id,
  phase: "concept",
  progress_percentage: 0,
  project_type: "new_build",
  start_date: null,
  status: "planned",
  updated_at: null
};

const input: CreateProjectInput = {
  address: project.address,
  building_type: project.building_type,
  client_id: null,
  description: null,
  end_date: null,
  estimated_end_date: null,
  estimated_start_date: null,
  google_place_id: project.google_place_id,
  latitude: project.latitude,
  longitude: project.longitude,
  name: project.name,
  phase: project.phase,
  progress_percentage: 0,
  project_type: project.project_type,
  start_date: null,
  status: project.status
};

const outcome: ProjectSaveOutcome = {
  coverStatus: "not-requested",
  project
};

describe("useProjects", () => {
  it("does not load projects without an authenticated profile", async () => {
    const queryClient = createTestQueryClient();
    const { result, unmount } = await renderHookWithAppProviders(
      () => useProjects({}),
      { queryClient }
    );

    expect(result.current.fetchStatus).toBe("idle");
    expect(listProjects).not.toHaveBeenCalled();
    await unmount();
    queryClient.clear();
  });

  it("loads a bounded owner-scoped project page", async () => {
    jest.mocked(listProjects).mockResolvedValue({
      items: [project],
      nextOffset: null
    });
    const queryClient = createTestQueryClient();
    const { result, unmount } = await renderHookWithAppProviders(
      () => useProjects({ sort: "name_asc" }),
      { auth: { user }, queryClient }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(listProjects).toHaveBeenCalledWith({
      filters: { query: "", sort: "name_asc" },
      offset: 0,
      pageSize: 24,
      userId: user.id,
      userRole: "user"
    });
    await unmount();
    queryClient.clear();
  });
});

describe("useCreateProject", () => {
  it("rejects project creation without a session", async () => {
    const queryClient = createTestQueryClient();
    const { result, unmount } = await renderHookWithAppProviders(
      () => useCreateProject(),
      { queryClient }
    );

    await act(async () => {
      await expect(
        result.current.mutateAsync({ coverAsset: null, input })
      ).rejects.toThrow("You must be signed in to save projects.");
    });
    expect(createProjectWithOptionalCover).not.toHaveBeenCalled();
    await unmount();
    queryClient.clear();
  });

  it("hydrates the user and primes the project detail cache", async () => {
    jest.mocked(createProjectWithOptionalCover).mockResolvedValue(outcome);
    const createUser = jest.fn().mockResolvedValue(user);
    const queryClient = createTestQueryClient();
    const invalidateQueries = jest.spyOn(queryClient, "invalidateQueries");
    const { result, unmount } = await renderHookWithAppProviders(
      () => useCreateProject(),
      {
        auth: { createUser, session, user: null },
        queryClient
      }
    );

    await act(async () => {
      await result.current.mutateAsync({ coverAsset: null, input });
    });

    expect(createUser).toHaveBeenCalledWith(session);
    expect(createProjectWithOptionalCover).toHaveBeenCalledWith({
      coverAsset: null,
      input
    });
    expect(
      queryClient.getQueryData(["projects", "detail", project.id])
    ).toEqual(project);
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["projects"]
    });
    await unmount();
    queryClient.clear();
  });
});

describe("useProject", () => {
  it("loads an enabled detail query and leaves a missing id idle", async () => {
    const queryClient = createTestQueryClient();
    const disabled = await renderHookWithAppProviders(
      () => useProject(undefined),
      { queryClient }
    );
    expect(disabled.result.current.fetchStatus).toBe("idle");
    await disabled.unmount();

    jest
      .mocked(getProject)
      .mockResolvedValue({ ...project, cover_image_url: null });
    const enabled = await renderHookWithAppProviders(
      () => useProject(project.id),
      { queryClient }
    );
    await waitFor(() => expect(enabled.result.current.isSuccess).toBe(true));
    expect(getProject).toHaveBeenCalledWith(project.id);
    await enabled.unmount();
    queryClient.clear();
  });
});

describe("useUpdateProject", () => {
  it("updates the detail cache and invalidates project collections", async () => {
    jest.mocked(updateProjectWithOptionalCover).mockResolvedValue(outcome);
    const queryClient = createTestQueryClient();
    const invalidateQueries = jest.spyOn(queryClient, "invalidateQueries");
    const hook = await renderHookWithAppProviders(
      () => useUpdateProject(project.id),
      { queryClient }
    );

    await act(async () => {
      await hook.result.current.mutateAsync({
        coverAsset: null,
        input: { name: "River House" }
      });
    });
    expect(updateProjectWithOptionalCover).toHaveBeenCalledWith({
      coverAsset: null,
      input: { name: "River House" },
      projectId: project.id
    });
    expect(
      queryClient.getQueryData(["projects", "detail", project.id])
    ).toEqual(project);
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["projects"]
    });
    await hook.unmount();
    queryClient.clear();
  });
});

describe("useProjectsMapPreview", () => {
  it("stays idle without points and normalizes map requests", async () => {
    const queryClient = createTestQueryClient();
    const disabled = await renderHookWithAppProviders(
      () => useProjectsMapPreview({ points: [] }),
      { queryClient }
    );
    expect(disabled.result.current.fetchStatus).toBe("idle");
    await disabled.unmount();

    jest.mocked(getProjectsMapPreview).mockResolvedValue({
      attribution: "Google",
      imageDataUrl: "data:image/png;base64,map"
    });
    const enabled = await renderHookWithAppProviders(
      () =>
        useProjectsMapPreview({
          points: [{ label: undefined, latitude: -34.6, longitude: -58.4 }],
          viewport: {
            centerLatitude: -34.6,
            centerLongitude: -58.4,
            zoom: 12
          }
        }),
      { queryClient }
    );
    await waitFor(() => expect(enabled.result.current.isSuccess).toBe(true));
    expect(getProjectsMapPreview).toHaveBeenCalledWith({
      points: [{ label: "", latitude: -34.6, longitude: -58.4 }],
      viewport: {
        centerLatitude: -34.6,
        centerLongitude: -58.4,
        zoom: 12
      }
    });
    await enabled.unmount();
    queryClient.clear();
  });
});

describe("useSoftDeleteProject", () => {
  it("invalidates project queries after deletion", async () => {
    jest.mocked(softDeleteProject).mockResolvedValue(undefined);
    const queryClient = createTestQueryClient();
    const invalidateQueries = jest.spyOn(queryClient, "invalidateQueries");
    const { result, unmount } = await renderHookWithAppProviders(
      () => useSoftDeleteProject(),
      { queryClient }
    );

    await act(async () => {
      await result.current.mutateAsync(project.id);
    });

    expect(softDeleteProject).toHaveBeenCalledWith(project.id);
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["projects"]
    });
    await unmount();
    queryClient.clear();
  });
});
