import {
  AppButton,
  AppCard,
  Breadcrumb,
  FieldMessage,
  FieldLabel,
  AppHeading,
  AppText,
  NumericField,
  Screen,
  SelectField,
  SkeletonBlock,
  TextAreaField,
  TextField,
  useAppToast
} from "@/shared/ui/components";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useLayoutMode } from "@/shared/hooks/use-layout-mode";
import { FormField } from "@/shared/ui/forms";
import {
  atomControlHeights,
  atomControlRadius,
  atomPalette,
  atomSpacing
} from "@/shared/ui/components/theme";
import { Spinner } from "@/shared/ui/primitives/spinner";
import {
  PROJECT_BUILDING_TYPE_LABELS,
  PROJECT_BUILDING_TYPES,
  PROJECT_PHASE_LABELS,
  PROJECT_PHASES,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUSES,
  PROJECT_TYPE_LABELS,
  PROJECT_TYPES
} from "@/features/projects/constants/project.constants";
import {
  useAddressAutocomplete,
  useAddressMapPreview,
  useCreateProject,
  useProject,
  useResolveAddress,
  useUpdateProject
} from "@/features/projects/hooks/use-projects";
import type {
  Project,
  ProjectFormValues,
  ProjectSaveOutcome,
  ResolvedProjectAddress
} from "@/features/projects/types/project.types";
import {
  projectFormSchema,
  toCreateProjectInput,
  toUpdateProjectInput
} from "@/features/projects/schemas/project.schemas";
import { formatDateOnly } from "@/shared/utils/date-only";
import { zodResolver } from "@hookform/resolvers/zod";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ImagePlusIcon,
  MapPinIcon,
  RefreshIcon,
  SaveIcon
} from "@/shared/ui/icons";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type ViewStyle
} from "react-native";

const defaultValues: ProjectFormValues = {
  address: null,
  building_type: "residential",
  coverAsset: null,
  description: "",
  end_date: "",
  estimated_end_date: "",
  estimated_start_date: "",
  name: "",
  phase: "concept",
  progress_percentage: 0,
  project_type: "new_build",
  start_date: "",
  status: "planned"
};

const mapMarkerImage = require("@/assets/images/map-marker.png");

function showProjectSaveToast({
  appToast,
  mode,
  outcome
}: {
  appToast: ReturnType<typeof useAppToast>;
  mode: "create" | "edit";
  outcome: ProjectSaveOutcome;
}) {
  const action = mode === "create" ? "created" : "updated";

  if (outcome.coverStatus === "failed") {
    appToast.show({
      description: `${outcome.project.name} was ${action}, but its cover couldn't be uploaded. You can add it later by editing the project.`,
      title: `Project ${action}`,
      tone: "warning"
    });
    return;
  }

  appToast.show({
    description: `${outcome.project.name} was ${action} successfully.`,
    title: `Project ${action}`,
    tone: "success"
  });
}

function areProjectRequiredFieldsComplete(values: ProjectFormValues) {
  return Boolean(
    values.name.trim().length >= 2 &&
      values.address &&
      values.status &&
      values.phase &&
      values.project_type &&
      values.building_type &&
      Number.isInteger(values.progress_percentage) &&
      values.progress_percentage >= 0 &&
      values.progress_percentage <= 100
  );
}

export function ProjectFormScreen({
  mode,
  projectId
}: {
  mode: "create" | "edit";
  projectId?: string;
}) {
  const router = useRouter();
  const appToast = useAppToast();
  const { session } = useAuth();
  const { isCompact, isExpanded } = useLayoutMode();
  const [formError, setFormError] = useState<string | null>(null);
  const projectQuery = useProject(mode === "edit" ? projectId : undefined);
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject(projectId ?? "");
  const form = useForm<ProjectFormValues>({
    defaultValues,
    mode: "onChange",
    resolver: zodResolver(projectFormSchema)
  });
  const {
    control,
    formState: { isDirty, isValid },
    handleSubmit,
    reset,
    setValue,
    trigger,
    watch
  } = form;
  const values = watch();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const areRequiredFieldsComplete = areProjectRequiredFieldsComplete(values);
  const hasProjectChanges = mode === "create" || isDirty;

  useEffect(() => {
    if (mode === "edit" && projectQuery.data) {
      reset(getValuesFromProject(projectQuery.data));
    }
  }, [mode, projectQuery.data, reset]);

  const submitProject = handleSubmit(async (formValues) => {
    if (!session) {
      setFormError("You must be signed in to save projects.");
      return;
    }

    if (!formValues.address) {
      setFormError("Review the highlighted fields before saving.");
      return;
    }

    setFormError(null);

    try {
      const projectValues = formValues as Omit<
        ProjectFormValues,
        "coverAsset"
      > & {
        address: ResolvedProjectAddress;
      };

      if (mode === "create") {
        const outcome = await createMutation.mutateAsync({
          coverAsset: formValues.coverAsset,
          input: toCreateProjectInput({
            values: projectValues
          })
        });

        showProjectSaveToast({ appToast, mode, outcome });
        router.replace(`/projects/${outcome.project.id}` as never);
        return;
      }

      if (!projectId) {
        throw new Error("Missing project id.");
      }

      const outcome = await updateMutation.mutateAsync({
        coverAsset: formValues.coverAsset,
        input: toUpdateProjectInput(projectValues)
      });

      showProjectSaveToast({ appToast, mode, outcome });
      router.replace(`/projects/${projectId}` as never);
    } catch (error) {
      setFormError(
        getUserFacingErrorMessage(
          error,
          "We couldn't save this project. Review your connection and try again."
        )
      );
    }
  });

  if (mode === "edit" && projectQuery.isLoading) {
    return (
      <Screen>
        <View style={{ gap: atomSpacing[5] }}>
          <SkeletonBlock height={36} width="50%" />
          <SkeletonBlock height={220} />
          <SkeletonBlock height={320} />
        </View>
      </Screen>
    );
  }

  if (mode === "edit" && projectQuery.isError) {
    return (
      <Screen centered>
        <AppCard padding="lg">
          <View style={{ gap: atomSpacing[4] }}>
            <AppHeading variant="section">Project unavailable</AppHeading>
            <AppText tone="muted">
              {getUserFacingErrorMessage(
                projectQuery.error,
                "We couldn't load this project for editing. Check your connection and try again."
              )}
            </AppText>
            <View style={{ gap: atomSpacing[3] }}>
              <AppButton
                icon={RefreshIcon}
                onPress={() => {
                  void projectQuery.refetch();
                }}
              >
                Retry
              </AppButton>
              <AppButton
                color="neutral"
                onPress={() => router.replace("/projects" as never)}
                variant="bordered"
              >
                Back to projects
              </AppButton>
            </View>
          </View>
        </AppCard>
      </Screen>
    );
  }

  if (mode === "edit" && !projectQuery.data) {
    return (
      <Screen centered>
        <AppCard padding="lg">
          <View style={{ gap: atomSpacing[4] }}>
            <AppHeading variant="section">Project not found</AppHeading>
            <AppText tone="muted">
              This project may have been removed or you may not have access.
            </AppText>
            <AppButton onPress={() => router.replace("/projects" as never)}>
              Back to projects
            </AppButton>
          </View>
        </AppCard>
      </Screen>
    );
  }

  return (
    <Screen>
      <View
        style={[
          projectFormStyles.page,
          isExpanded ? projectFormStyles.pageExpanded : null
        ]}
      >
        <View style={{ gap: atomSpacing[3] }}>
          <Breadcrumb
            items={[
              {
                accessibilityLabel: "Back to projects",
                label: "Projects",
                onPress: () => router.replace("/projects" as never)
              },
              ...(mode === "edit" && projectId
                ? [
                    {
                      accessibilityLabel: "Back to project detail",
                      label: "Project Detail",
                      onPress: () =>
                        router.replace(`/projects/${projectId}` as never)
                    }
                  ]
                : []),
              { label: mode === "create" ? "New" : "Edit" }
            ]}
          />
          <AppHeading variant="hero">
            {mode === "create"
              ? "Create a project."
              : "Update project details."}
          </AppHeading>
          <AppText tone="muted">
            Projects anchor site tasks, uploads, location, and future
            client-facing work.
          </AppText>
        </View>

        <AppCard
          padding="lg"
          style={isExpanded ? projectFormStyles.formCardExpanded : undefined}
        >
          <View style={{ gap: atomSpacing[5] }}>
            <CoverPicker
              currentUrl={projectQuery.data?.cover_image_url ?? null}
              onChange={(asset) => {
                setValue("coverAsset", asset, {
                  shouldDirty: true,
                  shouldValidate: true
                });
                setFormError(null);
              }}
              value={values.coverAsset ?? null}
            />

            <Controller
              control={control}
              name="name"
              render={({ field, fieldState }) => (
                <TextField
                  errorText={fieldState.error?.message}
                  label="Project Name"
                  onBlur={field.onBlur}
                  onChangeText={(text) => {
                    field.onChange(text);
                    setFormError(null);
                  }}
                  placeholder="Foundation Package"
                  required
                  value={field.value}
                />
              )}
            />

            <Controller
              control={control}
              name="description"
              render={({ field, fieldState }) => (
                <TextAreaField
                  errorText={fieldState.error?.message}
                  label="Description"
                  onBlur={field.onBlur}
                  onChangeText={(text) => {
                    field.onChange(text);
                    setFormError(null);
                  }}
                  placeholder="Scope, crew notes, client context..."
                  value={field.value}
                />
              )}
            />

            <Controller
              control={control}
              name="address"
              render={({ fieldState }) => (
                <AddressField
                  errorText={fieldState.error?.message}
                  onChange={(address) => {
                    setValue("address", address, {
                      shouldDirty: true,
                      shouldValidate: true
                    });
                    setFormError(null);
                  }}
                  required
                  value={values.address}
                />
              )}
            />

            <View
              style={[
                projectFormStyles.fieldGroup,
                !isCompact ? projectFormStyles.fieldGroupWide : null
              ]}
            >
              <View
                style={!isCompact ? projectFormStyles.fieldHalf : undefined}
              >
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <SelectField
                      label="Status"
                      onChange={(value) => {
                        field.onChange(value);
                        setFormError(null);
                      }}
                      options={PROJECT_STATUSES.map((value) => ({
                        label: PROJECT_STATUS_LABELS[value],
                        value
                      }))}
                      required
                      value={field.value}
                    />
                  )}
                />
              </View>

              <View
                style={!isCompact ? projectFormStyles.fieldHalf : undefined}
              >
                <Controller
                  control={control}
                  name="phase"
                  render={({ field }) => (
                    <SelectField
                      label="Phase"
                      onChange={(value) => {
                        field.onChange(value);
                        setFormError(null);
                      }}
                      options={PROJECT_PHASES.map((value) => ({
                        label: PROJECT_PHASE_LABELS[value],
                        value
                      }))}
                      required
                      value={field.value}
                    />
                  )}
                />
              </View>
            </View>

            <View
              style={[
                projectFormStyles.fieldGroup,
                !isCompact ? projectFormStyles.fieldGroupWide : null
              ]}
            >
              <View
                style={!isCompact ? projectFormStyles.fieldHalf : undefined}
              >
                <Controller
                  control={control}
                  name="project_type"
                  render={({ field }) => (
                    <SelectField
                      label="Project Type"
                      onChange={(value) => {
                        field.onChange(value);
                        setFormError(null);
                      }}
                      options={PROJECT_TYPES.map((value) => ({
                        label: PROJECT_TYPE_LABELS[value],
                        value
                      }))}
                      required
                      value={field.value}
                    />
                  )}
                />
              </View>

              <View
                style={!isCompact ? projectFormStyles.fieldHalf : undefined}
              >
                <Controller
                  control={control}
                  name="building_type"
                  render={({ field }) => (
                    <SelectField
                      label="Building Type"
                      onChange={(value) => {
                        field.onChange(value);
                        setFormError(null);
                      }}
                      options={PROJECT_BUILDING_TYPES.map((value) => ({
                        label: PROJECT_BUILDING_TYPE_LABELS[value],
                        value
                      }))}
                      required
                      value={field.value}
                    />
                  )}
                />
              </View>
            </View>

            <Controller
              control={control}
              name="progress_percentage"
              render={({ field, fieldState }) => (
                <NumericField
                  errorText={fieldState.error?.message}
                  label="Progress Percentage"
                  max={100}
                  min={0}
                  onBlur={field.onBlur}
                  onChangeNumber={(value) => {
                    field.onChange(value);
                    setFormError(null);
                  }}
                  placeholder="0"
                  required
                  value={field.value}
                />
              )}
            />

            <View
              style={[
                projectFormStyles.dateGrid,
                !isCompact ? projectFormStyles.dateGridWide : null
              ]}
            >
              <View
                style={!isCompact ? projectFormStyles.fieldHalf : undefined}
              >
                <Controller
                  control={control}
                  name="estimated_start_date"
                  render={({ field, fieldState }) => (
                    <CalendarDateField
                      errorText={fieldState.error?.message}
                      label="Estimated Start"
                      onChange={(date) => {
                        field.onChange(date);
                        setFormError(null);
                      }}
                      value={field.value}
                    />
                  )}
                />
              </View>
              <View
                style={!isCompact ? projectFormStyles.fieldHalf : undefined}
              >
                <Controller
                  control={control}
                  name="estimated_end_date"
                  render={({ field, fieldState }) => (
                    <CalendarDateField
                      errorText={fieldState.error?.message}
                      label="Estimated End"
                      onChange={(date) => {
                        field.onChange(date);
                        setFormError(null);
                      }}
                      value={field.value}
                    />
                  )}
                />
              </View>
              <View
                style={!isCompact ? projectFormStyles.fieldHalf : undefined}
              >
                <Controller
                  control={control}
                  name="start_date"
                  render={({ field, fieldState }) => (
                    <CalendarDateField
                      errorText={fieldState.error?.message}
                      label="Actual Start"
                      onChange={(date) => {
                        field.onChange(date);
                        setFormError(null);
                      }}
                      value={field.value}
                    />
                  )}
                />
              </View>
              <View
                style={!isCompact ? projectFormStyles.fieldHalf : undefined}
              >
                <Controller
                  control={control}
                  name="end_date"
                  render={({ field, fieldState }) => (
                    <CalendarDateField
                      errorText={fieldState.error?.message}
                      label="Actual End"
                      onChange={(date) => {
                        field.onChange(date);
                        setFormError(null);
                      }}
                      value={field.value}
                    />
                  )}
                />
              </View>
            </View>

            {formError ? (
              <AppText selectable tone="danger">
                {formError}
              </AppText>
            ) : null}

            <View
              style={[
                projectFormStyles.formActions,
                !isCompact ? projectFormStyles.formActionsWide : null
              ]}
            >
              <View style={projectFormStyles.formAction}>
                <AppButton
                  isDisabled={isSubmitting}
                  onPress={() => router.back()}
                  color="neutral"
                  variant="bordered"
                >
                  Cancel
                </AppButton>
              </View>
              <View style={projectFormStyles.formAction}>
                <AppButton
                  icon={SaveIcon}
                  isDisabled={
                    !areRequiredFieldsComplete ||
                    !isValid ||
                    !hasProjectChanges ||
                    isSubmitting
                  }
                  loading={isSubmitting}
                  onDisabledPress={() => {
                    void trigger();
                  }}
                  onPress={submitProject}
                >
                  {mode === "create" ? "Create" : "Save"}
                </AppButton>
              </View>
            </View>
          </View>
        </AppCard>
      </View>
    </Screen>
  );
}

function AddressField({
  errorText,
  onChange,
  required = false,
  value
}: {
  errorText?: string | null;
  onChange: (address: ResolvedProjectAddress | null) => void;
  required?: boolean;
  value: ResolvedProjectAddress | null;
}) {
  const [query, setQuery] = useState(value?.address ?? "");
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [sessionToken, setSessionToken] = useState(() => createSessionToken());
  const closeSuggestionsTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const canSearch = isSuggestionsOpen && query.trim().length >= 3;
  const suggestionsQuery = useAddressAutocomplete(
    query,
    sessionToken,
    canSearch
  );
  const resolveMutation = useResolveAddress();
  const suggestions = suggestionsQuery.data ?? [];
  const shouldShowSuggestions =
    canSearch && suggestions.length > 0 && !resolveMutation.isPending;
  const shouldShowNoResults =
    canSearch &&
    !suggestionsQuery.isPending &&
    !suggestionsQuery.isFetching &&
    !suggestionsQuery.isError &&
    suggestions.length === 0;
  const autocompleteError = getUserFacingErrorMessage(
    suggestionsQuery.error,
    "Address suggestions are unavailable right now. Try again shortly."
  );

  useEffect(() => {
    if (value?.address && value.address !== query) {
      setQuery(value.address);
    }
  }, [query, value]);

  useEffect(
    () => () => {
      if (closeSuggestionsTimeout.current) {
        clearTimeout(closeSuggestionsTimeout.current);
      }
    },
    []
  );

  const openSuggestions = () => {
    if (closeSuggestionsTimeout.current) {
      clearTimeout(closeSuggestionsTimeout.current);
      closeSuggestionsTimeout.current = null;
    }

    setIsSuggestionsOpen(true);
  };

  const closeSuggestions = () => {
    setIsSuggestionsOpen(false);
  };

  const handleSuggestionPress = async (placeId: string) => {
    closeSuggestions();

    const resolved = await resolveMutation.mutateAsync({
      placeId,
      sessionToken
    });
    onChange(resolved);
    setQuery(resolved.address);
    setSessionToken(createSessionToken());
  };

  return (
    <View style={{ gap: atomSpacing[3] }}>
      <TextField
        errorText={errorText}
        label="Project Address"
        leftIcon={MapPinIcon}
        onBlur={() => {
          closeSuggestionsTimeout.current = setTimeout(closeSuggestions, 150);
        }}
        onChangeText={(text) => {
          openSuggestions();
          setQuery(text);

          if (text !== value?.address) {
            onChange(null);
          }
        }}
        onFocus={openSuggestions}
        onPressIn={() => {
          openSuggestions();
        }}
        placeholder="Search with Google Maps"
        required={required}
        rightSlot={
          (canSearch && suggestionsQuery.isPending) ||
          suggestionsQuery.isFetching ||
          resolveMutation.isPending ? (
            <Spinner color={atomPalette.accent} size="small" />
          ) : null
        }
        truncate
        value={query}
      />

      {shouldShowSuggestions ? (
        <AppCard
          padding="sm"
          style={projectFormStyles.addressSuggestionsCard}
          tone="muted"
        >
          <View style={{ gap: atomSpacing[2] }}>
            {suggestions.map((suggestion) => (
              <Pressable
                key={suggestion.placeId}
                onPress={() => {
                  void handleSuggestionPress(suggestion.placeId);
                }}
                style={({ pressed }) =>
                  [
                    {
                      borderRadius: 10,
                      opacity: pressed ? 0.72 : 1,
                      padding: atomSpacing[3]
                    },
                    Platform.OS === "web"
                      ? ({ cursor: "pointer" } as ViewStyle)
                      : null
                  ] as ViewStyle[]
                }
              >
                <AppText>{suggestion.text}</AppText>
              </Pressable>
            ))}
            <AppText tone="subtle" variant="caption">
              Address suggestions by Google Maps
            </AppText>
          </View>
        </AppCard>
      ) : null}

      {suggestionsQuery.isError && canSearch ? (
        <FieldMessage tone="error">{autocompleteError}</FieldMessage>
      ) : null}

      {shouldShowNoResults ? (
        <AppCard
          padding="sm"
          style={projectFormStyles.addressSuggestionsCard}
          tone="muted"
        >
          <AppText tone="subtle" variant="bodySm">
            No matching addresses found.
          </AppText>
        </AppCard>
      ) : null}

      {value ? <AddressLocationPreview value={value} /> : null}
    </View>
  );
}

function AddressLocationPreview({ value }: { value: ResolvedProjectAddress }) {
  const mapPreviewQuery = useAddressMapPreview({
    latitude: value.latitude,
    longitude: value.longitude
  });

  if (mapPreviewQuery.isLoading) {
    return <SkeletonBlock height={260} />;
  }

  if (mapPreviewQuery.isError) {
    const message = getUserFacingErrorMessage(
      mapPreviewQuery.error,
      "Map preview is unavailable right now. Try again shortly."
    );

    return <FieldMessage tone="error">{message}</FieldMessage>;
  }

  if (mapPreviewQuery.data) {
    return (
      <View
        accessibilityLabel={`Selected project location: ${value.address}`}
        style={projectFormStyles.addressMapPreview}
      >
        <Image
          alt="Selected project location map preview"
          contentFit="cover"
          source={{ uri: mapPreviewQuery.data.imageDataUrl }}
          style={StyleSheet.absoluteFill}
        />
        <View style={projectFormStyles.addressMapMarker}>
          <Image
            alt=""
            contentFit="contain"
            source={mapMarkerImage}
            style={projectFormStyles.addressMapMarkerImage}
          />
        </View>
      </View>
    );
  }

  return null;
}

function CalendarDateField({
  errorText,
  label,
  onChange,
  value
}: {
  errorText?: string | null;
  label: string;
  onChange: (date: string) => void;
  value: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() =>
    getCalendarMonth(value)
  );
  const selectedDate = parseCalendarDate(value);
  const calendarDays = getCalendarDays(visibleMonth);

  useEffect(() => {
    if (isOpen) {
      setVisibleMonth(getCalendarMonth(value));
    }
  }, [isOpen, value]);

  const selectDate = (date: Date) => {
    onChange(toCalendarDateValue(date));
    setIsOpen(false);
  };

  return (
    <FormField errorText={errorText} label={label}>
      <Pressable
        accessibilityLabel={`${label} date picker`}
        accessibilityRole="button"
        onPress={() => setIsOpen(true)}
        style={StyleSheet.flatten([
          projectFormStyles.datePickerButton,
          errorText ? projectFormStyles.datePickerButtonError : null,
          Platform.OS === "web" ? projectFormStyles.webCursor : null
        ])}
      >
        <CalendarIcon
          color={value ? atomPalette.text : atomPalette.textMuted}
          size={18}
        />
        <AppText tone={value ? "default" : "subtle"} variant="body">
          {formatDateOnly(value, { fallback: "Select date" })}
        </AppText>
      </Pressable>

      <Modal
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
        transparent
        visible={isOpen}
      >
        <View style={projectFormStyles.calendarBackdrop}>
          <View style={projectFormStyles.calendarModal}>
            <View style={projectFormStyles.calendarHeader}>
              <CalendarIconButton
                accessibilityLabel="Previous month"
                icon={ChevronLeftIcon}
                onPress={() =>
                  setVisibleMonth(
                    (current) =>
                      new Date(current.getFullYear(), current.getMonth() - 1, 1)
                  )
                }
              />
              <AppHeading variant="section">
                {formatCalendarMonth(visibleMonth)}
              </AppHeading>
              <CalendarIconButton
                accessibilityLabel="Next month"
                icon={ChevronRightIcon}
                onPress={() =>
                  setVisibleMonth(
                    (current) =>
                      new Date(current.getFullYear(), current.getMonth() + 1, 1)
                  )
                }
              />
            </View>

            <View style={projectFormStyles.calendarWeekdays}>
              {calendarWeekdayLabels.map((weekday) => (
                <Text key={weekday} style={projectFormStyles.calendarWeekday}>
                  {weekday}
                </Text>
              ))}
            </View>

            <View style={projectFormStyles.calendarGrid}>
              {calendarDays.map((day) => {
                const isSelected =
                  selectedDate &&
                  toCalendarDateValue(selectedDate) ===
                    toCalendarDateValue(day.date);

                return (
                  <Pressable
                    accessibilityLabel={`Select ${formatDateOnly(
                      toCalendarDateValue(day.date)
                    )}`}
                    accessibilityRole="button"
                    key={day.key}
                    onPress={() => selectDate(day.date)}
                    style={StyleSheet.flatten([
                      projectFormStyles.calendarDay,
                      day.isCurrentMonth
                        ? null
                        : projectFormStyles.calendarDayOutside,
                      isSelected ? projectFormStyles.calendarDaySelected : null,
                      Platform.OS === "web" ? projectFormStyles.webCursor : null
                    ])}
                  >
                    <Text
                      style={StyleSheet.flatten([
                        projectFormStyles.calendarDayText,
                        day.isCurrentMonth
                          ? null
                          : projectFormStyles.calendarDayTextOutside,
                        isSelected
                          ? projectFormStyles.calendarDayTextSelected
                          : null
                      ])}
                    >
                      {day.date.getDate()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={projectFormStyles.calendarActions}>
              <AppButton
                color="neutral"
                fullWidth={false}
                onPress={() => {
                  onChange("");
                  setIsOpen(false);
                }}
                size="sm"
                variant="bordered"
              >
                Clear
              </AppButton>
              <AppButton
                fullWidth={false}
                onPress={() => setIsOpen(false)}
                size="sm"
              >
                Done
              </AppButton>
            </View>
          </View>
        </View>
      </Modal>
    </FormField>
  );
}

function CalendarIconButton({
  accessibilityLabel,
  icon: Icon,
  onPress
}: {
  accessibilityLabel: string;
  icon: typeof ChevronLeftIcon;
  onPress: (event: GestureResponderEvent) => void;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={StyleSheet.flatten([
        projectFormStyles.calendarIconButton,
        Platform.OS === "web" ? projectFormStyles.webCursor : null
      ])}
    >
      <Icon color={atomPalette.text} size={20} />
    </Pressable>
  );
}

function CoverPicker({
  currentUrl,
  onChange,
  value
}: {
  currentUrl: string | null;
  onChange: (asset: ProjectFormValues["coverAsset"]) => void;
  value: ProjectFormValues["coverAsset"];
}) {
  const previewUri = value?.uri ?? currentUrl;
  const [pickerError, setPickerError] = useState<string | null>(null);

  const pickImage = async () => {
    setPickerError(null);

    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        setPickerError(
          permission.canAskAgain
            ? "Photo access is required to choose a project cover. Allow access and try again."
            : "Photo access is disabled. Enable it in your device settings, then try again."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.82
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      const asset = result.assets[0];
      onChange({
        fileName: asset.fileName,
        mimeType: asset.mimeType,
        uri: asset.uri
      });
    } catch (error) {
      setPickerError(
        getUserFacingErrorMessage(
          error,
          "We couldn't open your photo library. Try again."
        )
      );
    }
  };

  return (
    <View style={{ gap: atomSpacing[3] }}>
      <FieldLabel>Cover Image</FieldLabel>
      <Pressable
        accessibilityLabel="Choose project cover image"
        accessibilityRole="button"
        onPress={() => {
          void pickImage();
        }}
        style={StyleSheet.flatten([
          projectFormStyles.coverPicker,
          Platform.OS === "web" ? projectFormStyles.webCursor : null
        ])}
      >
        {previewUri ? (
          <Image
            contentFit="cover"
            source={{ uri: previewUri }}
            style={{ height: "100%", width: "100%" }}
          />
        ) : (
          <View style={{ alignItems: "center", gap: atomSpacing[2] }}>
            <ImagePlusIcon color={atomPalette.textMuted} size={24} />
            <AppText tone="muted">Choose a cover image</AppText>
          </View>
        )}
      </Pressable>
      {pickerError ? (
        <FieldMessage tone="error">{pickerError}</FieldMessage>
      ) : null}
    </View>
  );
}

const calendarWeekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const calendarMonthLabels = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

function getCalendarMonth(value: string) {
  const parsed = parseCalendarDate(value);
  const today = new Date();
  const source = parsed ?? today;

  return new Date(source.getFullYear(), source.getMonth(), 1);
}

function getCalendarDays(visibleMonth: Date) {
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const firstWeekday = firstDay.getDay();
  const days: Array<{ date: Date; isCurrentMonth: boolean; key: string }> = [];

  for (let offset = 0; offset < 42; offset += 1) {
    const date = new Date(year, month, offset - firstWeekday + 1);

    days.push({
      date,
      isCurrentMonth: date.getMonth() === month,
      key: toCalendarDateValue(date)
    });
  }

  return days;
}

function parseCalendarDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function formatCalendarMonth(date: Date) {
  return `${calendarMonthLabels[date.getMonth()]} ${date.getFullYear()}`;
}

function toCalendarDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const projectFormStyles = StyleSheet.create({
  addressMapMarker: {
    alignItems: "center",
    height: 30,
    justifyContent: "center",
    left: "50%",
    position: "absolute",
    top: "50%",
    transform: [{ translateX: -15 }, { translateY: -27 }],
    width: 30
  },
  addressMapMarkerImage: {
    height: 30,
    width: 30
  },
  addressMapPreview: {
    backgroundColor: atomPalette.surfaceLow,
    borderRadius: 18,
    height: 260,
    overflow: "hidden",
    position: "relative",
    width: "100%"
  },
  addressSuggestionsCard: {
    elevation: 2,
    overflow: "visible",
    zIndex: 20
  },
  calendarActions: {
    flexDirection: "row",
    gap: atomSpacing[3],
    justifyContent: "flex-end"
  },
  calendarBackdrop: {
    alignItems: "center",
    backgroundColor: "rgba(18, 18, 18, 0.28)",
    flex: 1,
    justifyContent: "center",
    padding: atomSpacing[5]
  },
  calendarDay: {
    alignItems: "center",
    aspectRatio: 1,
    borderRadius: 999,
    justifyContent: "center",
    width: `${100 / 7}%`
  },
  calendarDayOutside: {
    opacity: 0.42
  },
  calendarDaySelected: {
    backgroundColor: atomPalette.accent
  },
  calendarDayText: {
    color: atomPalette.text,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18
  },
  calendarDayTextOutside: {
    color: atomPalette.textMuted
  },
  calendarDayTextSelected: {
    color: atomPalette.accentText
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  calendarHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  calendarIconButton: {
    alignItems: "center",
    backgroundColor: atomPalette.surfaceLow,
    borderColor: atomPalette.borderSubtle,
    borderRadius: 14,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  calendarModal: {
    backgroundColor: atomPalette.surface,
    borderColor: atomPalette.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: atomSpacing[5],
    maxWidth: 360,
    padding: atomSpacing[5],
    width: "100%"
  },
  calendarWeekday: {
    color: atomPalette.textMuted,
    flex: 1,
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 16,
    textAlign: "center",
    textTransform: "uppercase"
  },
  calendarWeekdays: {
    flexDirection: "row"
  },
  coverPicker: {
    alignItems: "center",
    backgroundColor: atomPalette.surfaceLow,
    borderColor: atomPalette.borderSubtle,
    borderRadius: 14,
    borderWidth: 1,
    height: 132,
    justifyContent: "center",
    overflow: "hidden"
  },
  datePickerButton: {
    alignItems: "center",
    backgroundColor: atomPalette.surface,
    borderColor: atomPalette.border,
    borderRadius: atomControlRadius,
    borderWidth: 1,
    flexDirection: "row",
    gap: atomSpacing[3],
    minHeight: atomControlHeights.lg,
    paddingHorizontal: atomSpacing[4]
  },
  datePickerButtonError: {
    borderColor: atomPalette.error
  },
  dateGrid: {
    gap: atomSpacing[4]
  },
  dateGridWide: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  fieldGroup: {
    gap: atomSpacing[5]
  },
  fieldGroupWide: {
    flexDirection: "row"
  },
  fieldHalf: {
    flexBasis: 0,
    flexGrow: 1,
    minWidth: 260
  },
  formAction: {
    flex: 1,
    maxWidth: 220
  },
  formActions: {
    flexDirection: "row",
    gap: atomSpacing[3]
  },
  formActionsWide: {
    justifyContent: "flex-end"
  },
  formCardExpanded: {
    alignSelf: "center",
    width: "100%"
  },
  page: {
    gap: atomSpacing[6],
    width: "100%"
  },
  pageExpanded: {
    alignSelf: "center",
    maxWidth: 1120
  },
  webCursor: {
    cursor: "pointer"
  } as ViewStyle
});

function getValuesFromProject(project: Project): ProjectFormValues {
  return {
    address: {
      address: project.address,
      latitude: project.latitude,
      longitude: project.longitude,
      placeId: project.google_place_id
    },
    building_type: project.building_type,
    coverAsset: null,
    description: project.description ?? "",
    end_date: project.end_date ?? "",
    estimated_end_date: project.estimated_end_date ?? "",
    estimated_start_date: project.estimated_start_date ?? "",
    name: project.name,
    phase: project.phase,
    progress_percentage: project.progress_percentage,
    project_type: project.project_type,
    start_date: project.start_date ?? "",
    status: project.status
  };
}

function createSessionToken() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}
