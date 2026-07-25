import { AppButton } from "@/shared/ui/components/button";
import { AppCard } from "@/shared/ui/components/card";
import { AppHeading } from "@/shared/ui/components/heading";
import { AppText } from "@/shared/ui/components/text";
import {
  atomCardRadius,
  atomPalette,
  atomRadii,
  atomSpacing
} from "@/shared/ui/components/theme";
import {
  PROJECT_PHASE_LABELS,
  PROJECT_STATUS_LABELS,
  PROJECT_TYPE_LABELS
} from "@/features/projects/constants/project.constants";
import { getProjectsMapViewport } from "@/features/projects/maps/map-points";
import type {
  ProjectStatus,
  ProjectSummary
} from "@/features/projects/types/project.types";
import { useLiveUserLocation } from "@/features/projects/hooks/use-live-user-location";
import {
  CloseIcon,
  ConstructionIcon,
  FolderOpenIcon,
  LocateIcon,
  MapPinIcon
} from "@/shared/ui/icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  type LatLng,
  type Region
} from "react-native-maps";

const statusColors: Record<ProjectStatus, string> = {
  cancelled: atomPalette.error,
  completed: atomPalette.success,
  in_progress: atomPalette.accent,
  on_hold: atomPalette.warning,
  planned: atomPalette.textMuted
};

const nativeMapProvider =
  Platform.OS === "android" ? PROVIDER_GOOGLE : undefined;

export function ProjectsMapView({
  fillAvailableSpace = false,
  onOpenProject,
  projects
}: {
  fillAvailableSpace?: boolean;
  onOpenProject: (project: ProjectSummary) => void;
  projects: ProjectSummary[];
}) {
  const mapRef = useRef<MapView | null>(null);
  const hasCenteredOnUserRef = useRef(false);
  const userLocation = useLiveUserLocation();
  const locatedProjects = useMemo(
    () =>
      projects.filter(
        (project) =>
          Number.isFinite(project.latitude) &&
          Number.isFinite(project.longitude)
      ),
    [projects]
  );
  const initialRegion = useMemo(
    () => getInitialMapRegion(locatedProjects),
    [locatedProjects]
  );
  const coordinates = useMemo(
    () => getProjectCoordinates(locatedProjects),
    [locatedProjects]
  );
  const coordinateKey = useMemo(
    () =>
      coordinates
        .map((coordinate) => `${coordinate.latitude},${coordinate.longitude}`)
        .join("|"),
    [coordinates]
  );
  const [hasMapLayout, setHasMapLayout] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const selectedProject =
    locatedProjects.find((project) => project.id === selectedProjectId) ?? null;

  const handleUserLocationPress = useCallback(() => {
    if (userLocation.isWatching) {
      hasCenteredOnUserRef.current = false;
      userLocation.stop();
      return;
    }

    hasCenteredOnUserRef.current = false;
    void userLocation.start();
  }, [userLocation]);

  const fitMapToProjects = useCallback(
    (animated: boolean) => {
      if (!mapRef.current || coordinates.length === 0) {
        return;
      }

      if (coordinates.length === 1 && initialRegion) {
        mapRef.current.animateToRegion(initialRegion, animated ? 280 : 0);
        return;
      }

      mapRef.current.fitToCoordinates(coordinates, {
        animated,
        edgePadding: {
          bottom: 56,
          left: 44,
          right: 44,
          top: 56
        }
      });
    },
    [coordinates, initialRegion]
  );

  useEffect(() => {
    if (
      selectedProjectId &&
      !locatedProjects.some((project) => project.id === selectedProjectId)
    ) {
      setSelectedProjectId(null);
    }
  }, [locatedProjects, selectedProjectId]);

  useEffect(() => {
    if (hasMapLayout && isMapReady) {
      fitMapToProjects(false);
    }
  }, [coordinateKey, fitMapToProjects, hasMapLayout, isMapReady]);

  useEffect(() => {
    const currentLocation = userLocation.location;

    if (
      !currentLocation ||
      !isMapReady ||
      !mapRef.current ||
      hasCenteredOnUserRef.current
    ) {
      return;
    }

    mapRef.current.animateToRegion(
      {
        latitude: currentLocation.latitude,
        latitudeDelta: 0.015,
        longitude: currentLocation.longitude,
        longitudeDelta: 0.015
      },
      280
    );
    hasCenteredOnUserRef.current = true;
  }, [isMapReady, userLocation.location]);

  if (locatedProjects.length === 0 || !initialRegion) {
    return (
      <AppCard style={{ gap: atomSpacing[4] }}>
        <View style={styles.emptyMapPreview}>
          <MapPinIcon color={atomPalette.textSubtle} size={32} />
        </View>
        <View style={{ gap: atomSpacing[2] }}>
          <AppHeading variant="section">No mapped projects</AppHeading>
          <AppText tone="muted">
            Projects need a saved address with coordinates before they can
            appear on the map.
          </AppText>
        </View>
      </AppCard>
    );
  }

  return (
    <View
      style={[styles.root, fillAvailableSpace && styles.rootFillAvailableSpace]}
    >
      <View
        onLayout={() => {
          setHasMapLayout(true);
        }}
        style={[
          styles.mapCanvas,
          fillAvailableSpace && styles.mapCanvasFillAvailableSpace
        ]}
      >
        <MapView
          initialRegion={initialRegion}
          loadingBackgroundColor={atomPalette.surfaceLow}
          loadingEnabled
          loadingIndicatorColor={atomPalette.accent}
          mapPadding={{ bottom: 20, left: 20, right: 20, top: 20 }}
          onMapReady={() => {
            setIsMapReady(true);
          }}
          provider={nativeMapProvider}
          ref={mapRef}
          rotateEnabled={false}
          showsCompass={false}
          showsMyLocationButton={false}
          style={StyleSheet.absoluteFill}
          toolbarEnabled={false}
          zoomControlEnabled={false}
        >
          {locatedProjects.map((project) => {
            const isSelected = selectedProjectId === project.id;

            return (
              <Marker
                coordinate={{
                  latitude: project.latitude,
                  longitude: project.longitude
                }}
                key={project.id}
                onPress={() => {
                  setSelectedProjectId(project.id);
                }}
                title={project.name}
              >
                <View
                  style={[styles.marker, isSelected && styles.markerSelected]}
                >
                  <ConstructionIcon
                    color={
                      isSelected ? atomPalette.accentText : atomPalette.surface
                    }
                    size={19}
                    strokeWidth={2.2}
                  />
                </View>
              </Marker>
            );
          })}
          {userLocation.location ? (
            <Marker
              anchor={{ x: 0.5, y: 0.5 }}
              coordinate={{
                latitude: userLocation.location.latitude,
                longitude: userLocation.location.longitude
              }}
              title="Your current location"
            >
              <View style={styles.userLocationHalo}>
                <View style={styles.userLocationDot} />
              </View>
            </Marker>
          ) : null}
        </MapView>

        <View style={styles.mapControls}>
          <AppButton
            accessibilityLabel={
              userLocation.isWatching
                ? "Hide current location"
                : "Show current location"
            }
            color={userLocation.isWatching ? "accent" : "neutral"}
            fullWidth={false}
            icon={LocateIcon}
            layout="icon"
            loading={userLocation.isRequesting}
            onPress={handleUserLocationPress}
            size="sm"
            style={styles.mapControlButton}
            variant={userLocation.isWatching ? "solid" : "bordered"}
          />
        </View>

        {selectedProject ? (
          <View style={styles.selectedCardOverlay}>
            <SelectedProjectCard
              onClose={() => setSelectedProjectId(null)}
              onOpenProject={() => onOpenProject(selectedProject)}
              project={selectedProject}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}

function SelectedProjectCard({
  onClose,
  onOpenProject,
  project
}: {
  onClose: () => void;
  onOpenProject: () => void;
  project: ProjectSummary;
}) {
  return (
    <AppCard padding="sm" style={styles.selectedCard}>
      <View style={styles.selectedCardContent}>
        <View style={styles.selectedMetaRow}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: statusColors[project.status] }
            ]}
          />
          <AppText tone="subtle" variant="formLabel">
            {PROJECT_STATUS_LABELS[project.status]}
          </AppText>
        </View>
        <AppHeading numberOfLines={1} variant="card">
          {project.name}
        </AppHeading>
        <AppText numberOfLines={1} tone="muted" variant="bodySm">
          {project.address}
        </AppText>
        <AppText tone="subtle" variant="caption">
          {PROJECT_TYPE_LABELS[project.project_type]} -{" "}
          {PROJECT_PHASE_LABELS[project.phase]}
        </AppText>
      </View>
      <View style={styles.selectedCardActions}>
        <Pressable
          accessibilityLabel="Close project preview"
          hitSlop={8}
          onPress={onClose}
          style={styles.closeButton}
        >
          <CloseIcon
            color={atomPalette.textMuted}
            size={18}
            strokeWidth={2.2}
          />
        </Pressable>
        <AppButton
          fullWidth={false}
          icon={FolderOpenIcon}
          onPress={onOpenProject}
          size="sm"
        >
          Open
        </AppButton>
      </View>
    </AppCard>
  );
}

function getProjectCoordinates(projects: ProjectSummary[]): LatLng[] {
  return projects.map((project) => ({
    latitude: project.latitude,
    longitude: project.longitude
  }));
}

function getInitialMapRegion(projects: ProjectSummary[]): Region | null {
  const viewport = getProjectsMapViewport(projects);

  if (!viewport) {
    return null;
  }

  const deltas = getInitialRegionDeltas(projects);

  return {
    latitude: viewport.centerLatitude,
    latitudeDelta: deltas.latitudeDelta,
    longitude: viewport.centerLongitude,
    longitudeDelta: deltas.longitudeDelta
  };
}

function getInitialRegionDeltas(projects: ProjectSummary[]) {
  if (projects.length <= 1) {
    return {
      latitudeDelta: 0.025,
      longitudeDelta: 0.025
    };
  }

  const latitudes = projects.map((project) => project.latitude);
  const longitudes = projects.map((project) => project.longitude);

  return {
    latitudeDelta: Math.max(
      (Math.max(...latitudes) - Math.min(...latitudes)) * 1.45,
      0.025
    ),
    longitudeDelta: Math.max(
      (Math.max(...longitudes) - Math.min(...longitudes)) * 1.45,
      0.025
    )
  };
}

const styles = StyleSheet.create({
  emptyMapPreview: {
    alignItems: "center",
    backgroundColor: atomPalette.surfaceLow,
    borderRadius: atomRadii.lg,
    height: 240,
    justifyContent: "center"
  },
  root: {
    gap: atomSpacing[4]
  },
  rootFillAvailableSpace: {
    flex: 1,
    minHeight: 0
  },
  mapCanvas: {
    aspectRatio: 720 / 520,
    backgroundColor: atomPalette.surfaceLow,
    borderColor: atomPalette.borderSubtle,
    borderRadius: atomCardRadius,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative"
  },
  mapCanvasFillAvailableSpace: {
    aspectRatio: undefined,
    flex: 1,
    minHeight: 0
  },
  marker: {
    alignItems: "center",
    backgroundColor: atomPalette.text,
    borderColor: atomPalette.surface,
    borderRadius: atomRadii.full,
    borderWidth: 2,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  markerSelected: {
    backgroundColor: atomPalette.accent
  },
  mapControlButton: {
    height: 34,
    minHeight: 34,
    width: 34
  },
  mapControls: {
    position: "absolute",
    right: atomSpacing[3],
    top: atomSpacing[3],
    zIndex: 2
  },
  closeButton: {
    alignItems: "center",
    borderRadius: atomRadii.full,
    height: 28,
    justifyContent: "center",
    width: 28
  },
  selectedCardOverlay: {
    bottom: atomSpacing[4],
    left: atomSpacing[4],
    position: "absolute",
    right: atomSpacing[4],
    zIndex: 2
  },
  selectedCard: {
    alignItems: "center",
    borderColor: atomPalette.borderSubtle,
    flexDirection: "row",
    gap: atomSpacing[4]
  },
  selectedCardActions: {
    alignItems: "flex-end",
    gap: atomSpacing[3]
  },
  selectedCardContent: {
    flex: 1,
    gap: atomSpacing[2],
    minWidth: 0
  },
  selectedMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: atomSpacing[2]
  },
  statusDot: {
    borderRadius: atomRadii.full,
    height: 8,
    width: 8
  },
  userLocationDot: {
    backgroundColor: atomPalette.accent,
    borderColor: atomPalette.surface,
    borderRadius: atomRadii.full,
    borderWidth: 2,
    height: 16,
    width: 16
  },
  userLocationHalo: {
    alignItems: "center",
    backgroundColor: `${atomPalette.accent}26`,
    borderColor: `${atomPalette.accent}44`,
    borderRadius: atomRadii.full,
    borderWidth: 1,
    height: 32,
    justifyContent: "center",
    width: 32
  }
});
