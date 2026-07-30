import {
  autocompleteAddresses,
  getLocationMapPreview,
  resolveAddress
} from "@/features/locations/services/locations.service";
import type { ResolvedAddress } from "@/features/locations/types/location";
import {
  LocationRepositoryError,
  type LocationErrorCode
} from "@/features/locations/maps/map-errors";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export function useLocationAddressField({
  onChange,
  value
}: {
  onChange: (address: ResolvedAddress | null) => void;
  value: ResolvedAddress | null;
}) {
  const { t } = useTranslation("features/locations");
  const [query, setQuery] = useState(value?.address ?? "");
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [sessionToken, setSessionToken] = useState(createSessionToken);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canSearch = isSuggestionsOpen && query.trim().length >= 3;
  const debouncedQuery = useDebouncedValue(query, 350);
  const suggestionsQuery = useQuery({
    enabled: canSearch && debouncedQuery.trim().length >= 3,
    queryFn: () =>
      autocompleteAddresses({
        input: debouncedQuery.trim(),
        sessionToken
      }),
    queryKey: ["address-autocomplete", debouncedQuery.trim(), sessionToken],
    staleTime: 30_000
  });
  const resolveMutation = useMutation({
    mutationFn: (placeId: string) =>
      resolveAddress({ placeId, sessionToken })
  });
  const previewQuery = useQuery({
    enabled: Boolean(value),
    queryFn: () =>
      getLocationMapPreview({
        latitude: value!.latitude,
        longitude: value!.longitude
      }),
    queryKey: ["address-map-preview", value?.latitude, value?.longitude],
    retry: 1,
    staleTime: 30 * 60_000
  });

  useEffect(() => {
    if (value?.address && value.address !== query) {
      setQuery(value.address);
    }
  }, [query, value]);

  useEffect(
    () => () => {
      if (closeTimeout.current) clearTimeout(closeTimeout.current);
    },
    []
  );

  const openSuggestions = () => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    closeTimeout.current = null;
    setIsSuggestionsOpen(true);
  };

  const closeSuggestions = () => setIsSuggestionsOpen(false);

  return {
    autocompleteError: suggestionsQuery.isError
      ? getLocationErrorMessage(
          suggestionsQuery.error,
          "addressSuggestions",
          t
        )
      : resolveMutation.isError
        ? getLocationErrorMessage(
            resolveMutation.error,
            "addressResolve",
            t
          )
        : null,
    isBusy:
      (canSearch && suggestionsQuery.isPending) ||
      suggestionsQuery.isFetching ||
      resolveMutation.isPending,
    onBlur: () => {
      closeTimeout.current = setTimeout(closeSuggestions, 150);
    },
    onChangeText: (text: string) => {
      openSuggestions();
      setQuery(text);
      if (text !== value?.address) onChange(null);
    },
    onClear: () => {
      closeSuggestions();
      setQuery("");
      onChange(null);
    },
    onFocus: openSuggestions,
    onSuggestionPress: async (placeId: string) => {
      closeSuggestions();
      try {
        const resolved = await resolveMutation.mutateAsync(placeId);
        onChange(resolved);
        setQuery(resolved.address);
        setSessionToken(createSessionToken());
      } catch {
        // The mutation state exposes a safe user-facing message to the field.
      }
    },
    preview: previewQuery.data ?? null,
    previewError: previewQuery.isError
      ? getLocationErrorMessage(
          previewQuery.error,
          "mapPreview",
          t
        )
      : null,
    previewLoading: previewQuery.isLoading,
    query,
    showNoResults:
      canSearch &&
      !suggestionsQuery.isPending &&
      !suggestionsQuery.isFetching &&
      !suggestionsQuery.isError &&
      (suggestionsQuery.data?.length ?? 0) === 0,
    suggestions:
      canSearch && !resolveMutation.isPending
        ? (suggestionsQuery.data ?? [])
        : [],
    value
  };
}

function getLocationErrorMessage(
  error: unknown,
  fallbackCode: LocationErrorCode,
  t: ReturnType<typeof useTranslation<"features/locations">>["t"]
) {
  const code =
    error instanceof LocationRepositoryError
      ? error.localizationCode
      : fallbackCode;
  const fallback = t(($) => $["features/locations"].errors[code]);
  return getUserFacingErrorMessage(error, fallback);
}

export function useLocationMapPreview({
  latitude,
  longitude
}: {
  latitude?: number | null;
  longitude?: number | null;
}) {
  return useQuery({
    enabled: typeof latitude === "number" && typeof longitude === "number",
    queryFn: () =>
      getLocationMapPreview({
        latitude: latitude!,
        longitude: longitude!
      }),
    queryKey: ["address-map-preview", latitude, longitude],
    retry: 1,
    staleTime: 30 * 60_000
  });
}

function createSessionToken() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timeout);
  }, [delayMs, value]);

  return debouncedValue;
}
