import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

function listRouteFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory()
      ? listRouteFiles(entryPath)
      : entry.name.endsWith(".tsx")
        ? [entryPath]
        : [];
  });
}

describe("route loading contract", () => {
  it("uses explicit named wrappers for every non-layout route", () => {
    const routeFiles = listRouteFiles(
      path.resolve(process.cwd(), "app")
    ).filter((filePath) => path.basename(filePath) !== "_layout.tsx");
    const violations = routeFiles
      .filter((filePath) => {
        const source = readFileSync(filePath, "utf8");
        return !/export default function \w+Route\s*\(/.test(source);
      })
      .map((filePath) => path.relative(process.cwd(), filePath));

    expect(violations).toEqual([]);
  });

  it("keeps Expo Router parameter reading out of feature screens", () => {
    const featureScreens = listRouteFiles(
      path.resolve(process.cwd(), "features")
    );
    const violations = featureScreens
      .filter((filePath) =>
        readFileSync(filePath, "utf8").includes("useLocalSearchParams")
      )
      .map((filePath) => path.relative(process.cwd(), filePath));

    expect(violations).toEqual([]);
  });

  it("keeps feature screen modules focused on one screen component", () => {
    const featureScreens = listRouteFiles(
      path.resolve(process.cwd(), "features")
    ).filter((filePath) => filePath.includes(`${path.sep}screens${path.sep}`));
    const violations = featureScreens
      .filter((filePath) => {
        const source = readFileSync(filePath, "utf8");
        return (
          /^function\s+\w+/m.test(source) ||
          source.includes("StyleSheet.create(")
        );
      })
      .map((filePath) => path.relative(process.cwd(), filePath));

    expect(violations).toEqual([]);
  });

  it("uses RouteLoadingScreen only as a Suspense fallback", () => {
    const appDirectory = path.resolve(process.cwd(), "app");
    const violations = listRouteFiles(appDirectory).flatMap((filePath) => {
      const source = readFileSync(filePath, "utf8");
      const loadingScreenCount =
        source.match(/<RouteLoadingScreen\s*\/>/g)?.length ?? 0;
      const suspenseFallbackCount =
        source.match(/fallback=\{<RouteLoadingScreen\s*\/>\}/g)?.length ?? 0;

      return loadingScreenCount === suspenseFallbackCount
        ? []
        : [path.relative(process.cwd(), filePath)];
    });

    expect(violations).toEqual([]);
  });

  it("validates UUIDs before dynamic record routes start queries", () => {
    const dynamicRecordRoutes = [
      "app/(app)/clients/[clientId]/index.tsx",
      "app/(app)/clients/[clientId]/edit.tsx",
      "app/(app)/contractors/[contractorId]/index.tsx",
      "app/(app)/contractors/[contractorId]/edit.tsx",
      "app/(app)/workers/[workerId]/index.tsx",
      "app/(app)/workers/[workerId]/edit.tsx",
      "app/(app)/suppliers/[supplierId]/index.tsx",
      "app/(app)/suppliers/[supplierId]/edit.tsx",
      "app/(app)/projects/[projectId]/index.tsx",
      "app/(app)/projects/[projectId]/edit.tsx",
      "app/(app)/projects/[projectId]/team.tsx",
      "app/(app)/projects/[projectId]/photos/index.tsx",
      "app/(app)/projects/[projectId]/photos/new/index.tsx",
      "app/(app)/projects/[projectId]/photos/[photoId]/index.tsx"
    ];

    const violations = dynamicRecordRoutes.filter((file) => {
      const source = readFileSync(path.resolve(process.cwd(), file), "utf8");
      return !source.includes("parseRequiredUuidRouteParam");
    });

    expect(violations).toEqual([]);
  });

  it("keeps project creation out of the dynamic project detail route", () => {
    const detailRoute = readFileSync(
      path.resolve(process.cwd(), "app/(app)/projects/[projectId]/index.tsx"),
      "utf8"
    );
    const createRoute = readFileSync(
      path.resolve(process.cwd(), "app/(app)/projects/new/index.tsx"),
      "utf8"
    );

    expect(detailRoute).not.toContain("ProjectFormScreen");
    expect(detailRoute).not.toContain('=== "new"');
    expect(createRoute).toContain('<ProjectFormScreen mode="create"');
  });

  it("uses the shared state boundary on dynamic record screens", () => {
    const recordScreens = [
      "features/clients/screens/client-detail-screen.tsx",
      "features/clients/screens/client-form-screen.tsx",
      "features/contractors/screens/contractor-detail-screen.tsx",
      "features/contractors/screens/contractor-form-screen.tsx",
      "features/workers/screens/worker-detail-screen.tsx",
      "features/workers/screens/worker-form-screen.tsx",
      "features/suppliers/screens/supplier-detail-screen.tsx",
      "features/suppliers/screens/supplier-form-screen.tsx",
      "features/projects/screens/project-detail-screen.tsx",
      "features/projects/screens/project-form-screen.tsx",
      "features/projects/screens/project-team-screen.tsx",
      "features/photos/screens/project-photos-screen.tsx",
      "features/photos/screens/project-photo-upload-screen.tsx",
      "features/photos/screens/project-photo-detail-screen.tsx"
    ];

    const violations = recordScreens.filter((file) => {
      const source = readFileSync(path.resolve(process.cwd(), file), "utf8");
      return !source.includes("<RouteStateBoundary");
    });

    expect(violations).toEqual([]);
  });

  it("keeps route failures separate from collection empty states", () => {
    const routeFeedbackSource = readFileSync(
      path.resolve(process.cwd(), "shared/ui/components/route-feedback.tsx"),
      "utf8"
    );
    const notFoundSource = readFileSync(
      path.resolve(process.cwd(), "app/+not-found.tsx"),
      "utf8"
    );
    const featureScreens = listRouteFiles(
      path.resolve(process.cwd(), "features")
    );
    const errorAsEmptyState = featureScreens
      .filter((filePath) => {
        const source = readFileSync(filePath, "utf8");
        return /isError\s*\?\s*\(\s*<EmptyState/.test(source);
      })
      .map((filePath) => path.relative(process.cwd(), filePath));

    expect(routeFeedbackSource).not.toContain("empty-state");
    expect(routeFeedbackSource).not.toContain("<EmptyState");
    expect(notFoundSource).toContain("<RouteFeedback");
    expect(errorAsEmptyState).toEqual([]);
  });
});
