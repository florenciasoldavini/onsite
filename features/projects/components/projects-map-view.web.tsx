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
import { PROJECT_LABELS_BY_LANGUAGE } from "@/features/projects/constants/project.constants";
import { useLocalization } from "@/features/localization/hooks/use-localization";
import { getProjectsMapViewport } from "@/features/projects/maps/map-points";
import type {
  ProjectStatus,
  ProjectSummary
} from "@/features/projects/types/project.types";
import { useLiveUserLocation } from "@/features/projects/hooks/use-live-user-location";
import {
  CloseIcon,
  FolderOpenIcon,
  LocateIcon,
  MapPinIcon,
  ZoomInIcon,
  ZoomOutIcon
} from "@/shared/ui/icons";
import {
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

const statusColors: Record<ProjectStatus, string> = {
  cancelled: atomPalette.error,
  completed: atomPalette.success,
  in_progress: atomPalette.accent,
  on_hold: atomPalette.warning,
  planned: atomPalette.textMuted
};

const googleMapsBrowserKey =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_BROWSER_KEY ?? "";

type GoogleMapPosition = { lat: number; lng: number };
type GoogleMapInfoWindow = {
  close: () => void;
  open: (options: {
    anchor: GoogleMapMarker;
    map: GoogleMapInstance;
    shouldFocus?: boolean;
  }) => void;
  setContent: (content: string) => void;
};
type GoogleMapMarker = {
  addListener: (
    eventName: "click" | "mouseout" | "mouseover",
    callback: () => void
  ) => void;
  setIcon: (icon: Record<string, unknown>) => void;
  setMap: (map: null) => void;
  setPosition: (position: GoogleMapPosition) => void;
};
type GoogleMapBounds = {
  extend: (position: GoogleMapPosition) => void;
};
type GoogleMapInstance = {
  fitBounds: (bounds: GoogleMapBounds, padding?: number) => void;
  setCenter: (position: GoogleMapPosition) => void;
  getZoom: () => number | undefined;
  setZoom: (zoom: number) => void;
};
type GoogleMapsNamespace = {
  maps: {
    InfoWindow: new (options?: Record<string, unknown>) => GoogleMapInfoWindow;
    LatLngBounds: new () => GoogleMapBounds;
    Map: new (
      element: HTMLElement,
      options: Record<string, unknown>
    ) => GoogleMapInstance;
    Marker: new (options: Record<string, unknown>) => GoogleMapMarker;
    Point: new (x: number, y: number) => unknown;
    Size: new (width: number, height: number) => unknown;
  };
};
type GoogleMapsWindow = Window &
  typeof globalThis & {
    __onzaitGoogleMapsPromise?: Promise<GoogleMapsNamespace>;
    __onzaitGoogleMapsReady?: () => void;
    gm_authFailure?: () => void;
    google?: GoogleMapsNamespace;
  };

const GOOGLE_MAPS_SCRIPT_ID = "onzait-google-maps-js";
const GOOGLE_MAPS_READY_CALLBACK = "__onzaitGoogleMapsReady";
function getConstructionMarkerIconUrl({
  backgroundColor,
  iconColor
}: {
  backgroundColor: string;
  iconColor: string;
}) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
  <circle cx="20" cy="20" r="17" fill="${backgroundColor}" stroke="#ffffff" stroke-width="2"/>
  <g transform="translate(8 8)" fill="none" stroke="${iconColor}" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2">
    <rect x="2" y="6" width="20" height="8" rx="1"/>
    <path d="M17 14v7"/>
    <path d="M7 14v7"/>
    <path d="M17 3v3"/>
    <path d="M7 3v3"/>
    <path d="M10 14 2.3 6.3"/>
    <path d="m14 6 7.7 7.7"/>
    <path d="m8 6 8 8"/>
  </g>
</svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function ProjectsMapView({
  fillAvailableSpace = false,
  onOpenProject,
  projects
}: {
  fillAvailableSpace?: boolean;
  onOpenProject: (project: ProjectSummary) => void;
  projects: ProjectSummary[];
}) {
  const { t } = useTranslation("features/projects");
  const locatedProjects = useMemo(
    () =>
      projects.filter(
        (project) =>
          Number.isFinite(project.latitude) &&
          Number.isFinite(project.longitude)
      ),
    [projects]
  );
  const viewport = useMemo(
    () => getProjectsMapViewport(locatedProjects),
    [locatedProjects]
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const selectedProject =
    locatedProjects.find((project) => project.id === selectedProjectId) ?? null;

  useEffect(() => {
    if (
      selectedProjectId &&
      !locatedProjects.some((project) => project.id === selectedProjectId)
    ) {
      setSelectedProjectId(null);
    }
  }, [locatedProjects, selectedProjectId]);

  if (locatedProjects.length === 0) {
    return (
      <AppCard style={{ gap: atomSpacing[4] }}>
        <View style={styles.emptyMapPreview}>
          <MapPinIcon color={atomPalette.textSubtle} size={32} />
        </View>
        <View style={{ gap: atomSpacing[2] }}>
          <AppHeading variant="section">
            {t(($) => $["features/projects"].map.noMappedTitle)}
          </AppHeading>
          <AppText tone="muted">
            {t(($) => $["features/projects"].map.noMappedDescription)}
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
        style={[
          styles.mapCanvas,
          fillAvailableSpace && styles.mapCanvasFillAvailableSpace
        ]}
      >
        {googleMapsBrowserKey && viewport ? (
          <InteractiveGoogleMap
            apiKey={googleMapsBrowserKey}
            initialZoom={viewport.zoom}
            onSelectProject={setSelectedProjectId}
            projects={locatedProjects}
            selectedProjectId={selectedProjectId}
          />
        ) : (
          <MapUnavailableState />
        )}

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

function InteractiveGoogleMap({
  apiKey,
  initialZoom,
  onSelectProject,
  projects,
  selectedProjectId
}: {
  apiKey: string;
  initialZoom: number;
  onSelectProject: (projectId: string) => void;
  projects: ProjectSummary[];
  selectedProjectId: string | null;
}) {
  const { t } = useTranslation("features/projects");
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const googleMapsRef = useRef<GoogleMapsNamespace | null>(null);
  const mapInstanceRef = useRef<GoogleMapInstance | null>(null);
  const markersByProjectIdRef = useRef<Map<string, GoogleMapMarker>>(new Map());
  const userMarkerRef = useRef<GoogleMapMarker | null>(null);
  const hasCenteredOnUserRef = useRef(false);
  const userLocation = useLiveUserLocation();
  const [loadState, setLoadState] = useState<"error" | "loading" | "ready">(
    "loading"
  );
  const [showZoomControls, setShowZoomControls] = useState(false);

  const zoomMap = (direction: -1 | 1) => {
    const map = mapInstanceRef.current;

    if (!map) {
      return;
    }

    const currentZoom = map.getZoom() ?? initialZoom;

    map.setZoom(Math.min(Math.max(currentZoom + direction, 2), 21));
  };

  const handleUserLocationPress = useCallback(() => {
    if (userLocation.isWatching) {
      hasCenteredOnUserRef.current = false;
      userLocation.stop();
      return;
    }

    hasCenteredOnUserRef.current = false;
    void userLocation.start();
  }, [userLocation]);

  useEffect(() => {
    if (typeof window === "undefined" || !mapElementRef.current) {
      return;
    }

    let isDisposed = false;
    let markers: GoogleMapMarker[] = [];
    const mapElement = mapElementRef.current;

    setLoadState("loading");

    loadGoogleMaps(apiKey)
      .then((google) => {
        if (isDisposed) {
          return;
        }

        mapElement.innerHTML = "";
        googleMapsRef.current = google;
        markersByProjectIdRef.current.clear();

        const showZoomControl =
          typeof window.matchMedia === "function" &&
          window.matchMedia("(hover: hover) and (pointer: fine)").matches;
        setShowZoomControls(showZoomControl);
        const map = new google.maps.Map(mapElement, {
          cameraControl: false,
          center: getMapCenter(projects),
          clickableIcons: false,
          fullscreenControl: false,
          gestureHandling: "greedy",
          mapTypeControl: false,
          mapTypeId: "roadmap",
          rotateControl: false,
          scaleControl: false,
          streetViewControl: false,
          styles: [
            { featureType: "poi", stylers: [{ visibility: "off" }] },
            { featureType: "transit", stylers: [{ visibility: "off" }] }
          ],
          zoom: initialZoom,
          zoomControl: false
        });
        mapInstanceRef.current = map;
        const bounds = new google.maps.LatLngBounds();
        const hoverInfoWindow = new google.maps.InfoWindow({
          disableAutoPan: true,
          headerDisabled: true
        });

        markers = projects.map((project) => {
          const isSelected = selectedProjectId === project.id;
          const safeProjectName = project.name.replace(
            /[&<>"']/g,
            (character) => {
              switch (character) {
                case "&":
                  return "&amp;";
                case "<":
                  return "&lt;";
                case ">":
                  return "&gt;";
                case '"':
                  return "&quot;";
                case "'":
                  return "&#39;";
                default:
                  return character;
              }
            }
          );
          const position = {
            lat: project.latitude,
            lng: project.longitude
          };
          const marker = new google.maps.Marker({
            icon: getConstructionMarkerIcon(google, isSelected),
            map,
            position,
            title: project.name
          });

          marker.addListener("click", () => {
            onSelectProject(project.id);
          });
          marker.addListener("mouseover", () => {
            hoverInfoWindow.setContent(
              `<div style="font: 600 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 18px; padding: 2px 4px; white-space: nowrap;">${safeProjectName}</div>`
            );
            hoverInfoWindow.open({
              anchor: marker,
              map,
              shouldFocus: false
            });
          });
          marker.addListener("mouseout", () => {
            hoverInfoWindow.close();
          });
          bounds.extend(position);
          markersByProjectIdRef.current.set(project.id, marker);

          return marker;
        });

        if (projects.length > 1) {
          map.fitBounds(bounds, 52);
        }

        setLoadState("ready");
      })
      .catch(() => {
        if (!isDisposed) {
          setLoadState("error");
        }
      });

    return () => {
      isDisposed = true;
      googleMapsRef.current = null;
      mapInstanceRef.current = null;
      userMarkerRef.current?.setMap(null);
      userMarkerRef.current = null;
      setShowZoomControls(false);
      markersByProjectIdRef.current.clear();
      markers.forEach((marker) => {
        marker.setMap(null);
      });
    };
  }, [apiKey, initialZoom, onSelectProject, projects]);

  useEffect(() => {
    const google = googleMapsRef.current;
    const map = mapInstanceRef.current;
    const currentLocation = userLocation.location;

    if (!google || !map || !currentLocation) {
      userMarkerRef.current?.setMap(null);
      userMarkerRef.current = null;
      return;
    }

    const position = {
      lat: currentLocation.latitude,
      lng: currentLocation.longitude
    };

    if (userMarkerRef.current) {
      userMarkerRef.current.setPosition(position);
    } else {
      userMarkerRef.current = new google.maps.Marker({
        clickable: false,
        icon: getUserLocationMarkerIcon(google),
        map,
        position,
        title: t(($) => $["features/projects"].map.userLocation),
        zIndex: 999
      });
    }

    if (!hasCenteredOnUserRef.current) {
      map.setCenter(position);
      map.setZoom(Math.max(map.getZoom() ?? initialZoom, 15));
      hasCenteredOnUserRef.current = true;
    }
  }, [initialZoom, t, userLocation.location]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const google = (window as GoogleMapsWindow).google;

    if (!google?.maps) {
      return;
    }

    markersByProjectIdRef.current.forEach((marker, projectId) => {
      marker.setIcon(
        getConstructionMarkerIcon(google, selectedProjectId === projectId)
      );
    });
  }, [selectedProjectId]);

  return (
    <>
      {createElement("div", {
        "aria-label": t(($) => $["features/projects"].map.label),
        ref: mapElementRef,
        role: "application",
        style: {
          height: "100%",
          width: "100%"
        }
      })}
      {loadState === "ready" ? (
        <View style={styles.mapControls}>
          <AppButton
            accessibilityLabel={
              userLocation.isWatching
                ? t(($) => $["features/projects"].map.hideLocation)
                : t(($) => $["features/projects"].map.showLocation)
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
          {showZoomControls ? (
            <>
              <AppButton
                accessibilityLabel={t(
                  ($) => $["features/projects"].map.zoomIn
                )}
                color="neutral"
                fullWidth={false}
                icon={ZoomInIcon}
                layout="icon"
                onPress={() => zoomMap(1)}
                size="sm"
                style={styles.mapControlButton}
                variant="bordered"
              />
              <AppButton
                accessibilityLabel={t(
                  ($) => $["features/projects"].map.zoomOut
                )}
                color="neutral"
                fullWidth={false}
                icon={ZoomOutIcon}
                layout="icon"
                onPress={() => zoomMap(-1)}
                size="sm"
                style={styles.mapControlButton}
                variant="bordered"
              />
            </>
          ) : null}
        </View>
      ) : null}
      {loadState !== "ready" ? (
        <View pointerEvents="none" style={styles.mapStateOverlay}>
          {loadState === "error" ? (
            <>
              <MapPinIcon color={atomPalette.textSubtle} size={28} />
              <AppText tone="muted" variant="caption">
                {t(($) => $["features/projects"].map.error)}
              </AppText>
            </>
          ) : (
            <AppText tone="muted" variant="caption">
              {t(($) => $["features/projects"].map.loading)}
            </AppText>
          )}
        </View>
      ) : null}
    </>
  );
}

function getConstructionMarkerIcon(
  google: GoogleMapsNamespace,
  isSelected: boolean
) {
  return {
    anchor: new google.maps.Point(20, 20),
    scaledSize: new google.maps.Size(40, 40),
    url: getConstructionMarkerIconUrl({
      backgroundColor: isSelected ? atomPalette.accent : atomPalette.text,
      iconColor: isSelected ? atomPalette.accentText : atomPalette.surface
    })
  };
}

function getUserLocationMarkerIcon(google: GoogleMapsNamespace) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
  <circle cx="18" cy="18" r="15" fill="${atomPalette.accent}" fill-opacity="0.18" stroke="${atomPalette.accent}" stroke-opacity="0.28" stroke-width="1"/>
  <circle cx="18" cy="18" r="8" fill="${atomPalette.accent}" stroke="${atomPalette.surface}" stroke-width="3"/>
</svg>`;

  return {
    anchor: new google.maps.Point(18, 18),
    scaledSize: new google.maps.Size(36, 36),
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
  };
}

function MapUnavailableState() {
  const { t } = useTranslation("features/projects");
  return (
    <View style={styles.mapUnavailableState}>
      <MapPinIcon color={atomPalette.textSubtle} size={28} />
      <View style={{ gap: atomSpacing[1] }}>
        <AppText variant="bodySm">
          {t(($) => $["features/projects"].map.keyTitle)}
        </AppText>
        <AppText tone="muted" variant="caption">
          {t(($) => $["features/projects"].map.keyDescription)}
        </AppText>
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
  const { language } = useLocalization();
  const { t } = useTranslation("features/projects");
  const labels = PROJECT_LABELS_BY_LANGUAGE[language];
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
            {labels.statuses[project.status]}
          </AppText>
        </View>
        <AppHeading numberOfLines={1} variant="card">
          {project.name}
        </AppHeading>
        <AppText numberOfLines={1} tone="muted" variant="bodySm">
          {project.address}
        </AppText>
        <AppText tone="subtle" variant="caption">
          {labels.types[project.project_type]} - {labels.phases[project.phase]}
        </AppText>
      </View>
      <View style={styles.selectedCardActions}>
        <Pressable
          accessibilityLabel={t(
            ($) => $["features/projects"].map.closePreview
          )}
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
          {t(($) => $["features/projects"].map.open)}
        </AppButton>
      </View>
    </AppCard>
  );
}

function getMapCenter(projects: ProjectSummary[]) {
  const total = projects.reduce(
    (sum, project) => ({
      lat: sum.lat + project.latitude,
      lng: sum.lng + project.longitude
    }),
    { lat: 0, lng: 0 }
  );

  return {
    lat: total.lat / projects.length,
    lng: total.lng / projects.length
  };
}

function loadGoogleMaps(apiKey: string) {
  const mapWindow = window as GoogleMapsWindow;

  if (mapWindow.google?.maps) {
    return Promise.resolve(mapWindow.google);
  }

  if (mapWindow.__onzaitGoogleMapsPromise) {
    return mapWindow.__onzaitGoogleMapsPromise;
  }

  mapWindow.__onzaitGoogleMapsPromise = new Promise((resolve, reject) => {
    mapWindow.__onzaitGoogleMapsReady = () => {
      if (mapWindow.google?.maps) {
        resolve(mapWindow.google);
        return;
      }

      reject(new Error("Google Maps initialized without maps namespace."));
    };
    mapWindow.gm_authFailure = () => {
      reject(new Error("Google Maps browser key was rejected."));
    };

    document.getElementById(GOOGLE_MAPS_SCRIPT_ID)?.remove();

    const script = document.createElement("script");

    script.async = true;
    script.defer = true;
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.onerror = () => {
      reject(new Error("Google Maps script failed to load."));
    };
    script.src =
      "https://maps.googleapis.com/maps/api/js" +
      `?key=${encodeURIComponent(apiKey)}` +
      `&callback=${GOOGLE_MAPS_READY_CALLBACK}` +
      "&v=weekly&loading=async&auth_referrer_policy=origin";

    document.head.appendChild(script);
  });

  return mapWindow.__onzaitGoogleMapsPromise;
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
  mapStateOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    backgroundColor: atomPalette.surfaceLow,
    gap: atomSpacing[3],
    justifyContent: "center",
    padding: atomSpacing[5]
  },
  mapUnavailableState: {
    alignItems: "center",
    gap: atomSpacing[3],
    height: "100%",
    justifyContent: "center",
    padding: atomSpacing[5],
    width: "100%"
  },
  selectedCardOverlay: {
    alignSelf: "center",
    bottom: atomSpacing[4],
    left: atomSpacing[4],
    marginHorizontal: "auto",
    maxWidth: 480,
    position: "absolute",
    right: atomSpacing[4],
    zIndex: 2
  },
  closeButton: {
    alignItems: "center",
    borderRadius: atomRadii.full,
    height: 28,
    justifyContent: "center",
    width: 28
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
  mapControlButton: {
    height: 34,
    minHeight: 34,
    width: 34
  },
  mapControls: {
    gap: atomSpacing[2],
    position: "absolute",
    right: atomSpacing[3],
    top: atomSpacing[3],
    zIndex: 2
  }
});
