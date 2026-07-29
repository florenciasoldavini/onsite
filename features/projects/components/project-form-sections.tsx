import { ClientPickerField } from "@/features/clients/components/client-picker-field";
import { ProjectAddressField } from "@/features/projects/components/project-address-field";
import { ProjectCoverPicker } from "@/features/projects/components/project-cover-picker";
import { ProjectFormCalendarField } from "@/features/projects/components/project-form-calendar-field";
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
import type { ProjectFormValues } from "@/features/projects/types/project.types";
import { AppButton } from "@/shared/ui/components/button";
import { NumericField, TextField } from "@/shared/ui/components/input";
import { SelectField } from "@/shared/ui/components/select-field";
import { atomSpacing } from "@/shared/ui/components/theme";
import { TextAreaField } from "@/shared/ui/components/textarea";
import { SaveIcon } from "@/shared/ui/icons";
import { memo, type ReactNode } from "react";
import {
  Controller,
  useFormState,
  useWatch,
  type Control,
  type UseFormSetValue
} from "react-hook-form";
import { StyleSheet, View } from "react-native";

const statusOptions = PROJECT_STATUSES.map((value) => ({
  label: PROJECT_STATUS_LABELS[value],
  value
}));
const phaseOptions = PROJECT_PHASES.map((value) => ({
  label: PROJECT_PHASE_LABELS[value],
  value
}));
const projectTypeOptions = PROJECT_TYPES.map((value) => ({
  label: PROJECT_TYPE_LABELS[value],
  value
}));
const buildingTypeOptions = PROJECT_BUILDING_TYPES.map((value) => ({
  label: PROJECT_BUILDING_TYPE_LABELS[value],
  value
}));

type ProjectFormSectionProps = {
  control: Control<ProjectFormValues>;
  onInteraction: () => void;
};

export const ProjectCoverSection = memo(function ProjectCoverSection({
  canWrite = true,
  control,
  currentUrl,
  onInteraction,
  setValue
}: ProjectFormSectionProps & {
  canWrite?: boolean;
  currentUrl: string | null;
  setValue: UseFormSetValue<ProjectFormValues>;
}) {
  const coverAsset = useWatch({ control, name: "coverAsset" });

  return (
    <ProjectCoverPicker
      currentUrl={currentUrl}
      disabled={!canWrite}
      onChange={(asset) => {
        setValue("coverAsset", asset, {
          shouldDirty: true,
          shouldValidate: true
        });
        onInteraction();
      }}
      value={coverAsset}
    />
  );
});

export const ProjectIdentitySection = memo(function ProjectIdentitySection({
  canChangeClient = true,
  control,
  onInteraction,
  ownerId
}: ProjectFormSectionProps & {
  canChangeClient?: boolean;
  ownerId?: string;
}) {
  return (
    <>
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
              onInteraction();
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
              onInteraction();
            }}
            placeholder="Scope, crew notes, client context..."
            value={field.value}
          />
        )}
      />

      <Controller
        control={control}
        name="client_id"
        render={({ field }) => (
          <ClientPickerField
            disabled={!canChangeClient}
            onChange={(clientId) => {
              field.onChange(clientId);
              onInteraction();
            }}
            ownerId={ownerId}
            value={field.value}
          />
        )}
      />

      <Controller
        control={control}
        name="address"
        render={({ field, fieldState }) => (
          <ProjectAddressField
            errorText={fieldState.error?.message}
            onChange={(address) => {
              field.onChange(address);
              onInteraction();
            }}
            value={field.value}
          />
        )}
      />
    </>
  );
});

export const ProjectClassificationSection = memo(
  function ProjectClassificationSection({
    control,
    isCompact,
    onInteraction
  }: ProjectFormSectionProps & {
    isCompact: boolean;
  }) {
    return (
      <>
        <View style={[styles.fieldGroup, !isCompact && styles.fieldGroupWide]}>
          <FieldColumn isCompact={isCompact}>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <SelectField
                  label="Status"
                  onChange={(value) => {
                    field.onChange(value);
                    onInteraction();
                  }}
                  options={statusOptions}
                  required
                  value={field.value}
                />
              )}
            />
          </FieldColumn>

          <FieldColumn isCompact={isCompact}>
            <Controller
              control={control}
              name="phase"
              render={({ field }) => (
                <SelectField
                  label="Phase"
                  onChange={(value) => {
                    field.onChange(value);
                    onInteraction();
                  }}
                  options={phaseOptions}
                  required
                  value={field.value}
                />
              )}
            />
          </FieldColumn>
        </View>

        <View style={[styles.fieldGroup, !isCompact && styles.fieldGroupWide]}>
          <FieldColumn isCompact={isCompact}>
            <Controller
              control={control}
              name="project_type"
              render={({ field }) => (
                <SelectField
                  label="Project Type"
                  onChange={(value) => {
                    field.onChange(value);
                    onInteraction();
                  }}
                  options={projectTypeOptions}
                  required
                  value={field.value}
                />
              )}
            />
          </FieldColumn>

          <FieldColumn isCompact={isCompact}>
            <Controller
              control={control}
              name="building_type"
              render={({ field }) => (
                <SelectField
                  label="Building Type"
                  onChange={(value) => {
                    field.onChange(value);
                    onInteraction();
                  }}
                  options={buildingTypeOptions}
                  required
                  value={field.value}
                />
              )}
            />
          </FieldColumn>
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
                onInteraction();
              }}
              placeholder="0"
              required
              value={field.value}
            />
          )}
        />
      </>
    );
  }
);

export const ProjectScheduleSection = memo(function ProjectScheduleSection({
  control,
  isCompact,
  onInteraction
}: ProjectFormSectionProps & {
  isCompact: boolean;
}) {
  return (
    <View style={[styles.dateGrid, !isCompact && styles.dateGridWide]}>
      <ProjectDateController
        control={control}
        isCompact={isCompact}
        label="Estimated Start"
        name="estimated_start_date"
        onInteraction={onInteraction}
      />
      <ProjectDateController
        control={control}
        isCompact={isCompact}
        label="Estimated End"
        name="estimated_end_date"
        onInteraction={onInteraction}
      />
      <ProjectDateController
        control={control}
        isCompact={isCompact}
        label="Actual Start"
        name="start_date"
        onInteraction={onInteraction}
      />
      <ProjectDateController
        control={control}
        isCompact={isCompact}
        label="Actual End"
        name="end_date"
        onInteraction={onInteraction}
      />
    </View>
  );
});

export function ProjectFormActions({
  control,
  isCompact,
  isSubmitting,
  mode,
  onCancel,
  onSubmit,
  onValidate
}: {
  control: Control<ProjectFormValues>;
  isCompact: boolean;
  isSubmitting: boolean;
  mode: "create" | "edit";
  onCancel: () => void;
  onSubmit: () => Promise<void>;
  onValidate: () => Promise<boolean>;
}) {
  const { isDirty, isValid } = useFormState({ control });
  const name = useWatch({ control, name: "name" });
  const address = useWatch({ control, name: "address" });
  const status = useWatch({ control, name: "status" });
  const phase = useWatch({ control, name: "phase" });
  const projectType = useWatch({ control, name: "project_type" });
  const buildingType = useWatch({ control, name: "building_type" });
  const progressPercentage = useWatch({
    control,
    name: "progress_percentage"
  });
  const areRequiredFieldsComplete = Boolean(
    name.trim().length >= 2 &&
      address &&
      status &&
      phase &&
      projectType &&
      buildingType &&
      Number.isInteger(progressPercentage) &&
      progressPercentage >= 0 &&
      progressPercentage <= 100
  );
  const hasProjectChanges = mode === "create" || isDirty;

  return (
    <View style={[styles.formActions, !isCompact && styles.formActionsWide]}>
      <View style={styles.formAction}>
        <AppButton
          color="neutral"
          isDisabled={isSubmitting}
          onPress={onCancel}
          variant="bordered"
        >
          Cancel
        </AppButton>
      </View>
      <View style={styles.formAction}>
        <AppButton
          icon={SaveIcon}
          isDisabled={
            !areRequiredFieldsComplete ||
            !isValid ||
            !hasProjectChanges ||
            isSubmitting
          }
          loading={isSubmitting}
          onDisabledPress={() => void onValidate()}
          onPress={() => void onSubmit()}
        >
          {mode === "create" ? "Create" : "Save"}
        </AppButton>
      </View>
    </View>
  );
}

function FieldColumn({
  children,
  isCompact
}: {
  children: ReactNode;
  isCompact: boolean;
}) {
  return (
    <View style={!isCompact ? styles.fieldHalf : undefined}>{children}</View>
  );
}

function ProjectDateController({
  control,
  isCompact,
  label,
  name,
  onInteraction
}: ProjectFormSectionProps & {
  isCompact: boolean;
  label: string;
  name:
    | "end_date"
    | "estimated_end_date"
    | "estimated_start_date"
    | "start_date";
}) {
  return (
    <FieldColumn isCompact={isCompact}>
      <Controller
        control={control}
        name={name}
        render={({ field, fieldState }) => (
          <ProjectFormCalendarField
            errorText={fieldState.error?.message}
            label={label}
            onChange={(date) => {
              field.onChange(date);
              onInteraction();
            }}
            value={field.value}
          />
        )}
      />
    </FieldColumn>
  );
}

const styles = StyleSheet.create({
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
  }
});
