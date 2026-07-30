import { AppButton } from "@/shared/ui/components/button";
import { AppHeading } from "@/shared/ui/components/heading";
import { Screen } from "@/shared/ui/components/screen";
import { AppText } from "@/shared/ui/components/text";
import { atomPalette, atomSpacing } from "@/shared/ui/components/theme";
import type { AppIconComponent } from "@/shared/ui/icons";
import { AlertIcon } from "@/shared/ui/icons";
import type { PropsWithChildren, ReactNode } from "react";
import { View } from "react-native";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

export type RouteFeedbackKind =
  | "forbidden"
  | "invalid-params"
  | "load-error"
  | "not-found";

export interface RouteFeedbackProps {
  action?: {
    icon?: AppIconComponent;
    label: string;
    onPress: () => void;
  };
  description?: ReactNode;
  icon?: AppIconComponent;
  kind: RouteFeedbackKind;
  resourceName: string;
  title?: ReactNode;
}

type RouteFeedbackOverrides = Omit<RouteFeedbackProps, "kind" | "resourceName">;

export interface RouteStateBoundaryProps extends PropsWithChildren {
  feedback?: {
    forbidden?: RouteFeedbackOverrides;
    invalidParams?: RouteFeedbackOverrides;
    loadError?: RouteFeedbackOverrides;
    notFound?: RouteFeedbackOverrides;
  };
  isError?: boolean;
  isForbidden?: boolean;
  isInvalid?: boolean;
  isLoading?: boolean;
  isNotFound?: boolean;
  loadingFallback: ReactNode;
  resourceName: string;
}

function getDefaultContent(
  kind: RouteFeedbackKind,
  resourceName: string,
  t: TFunction<"shared">
): { description: string; title: string } {
  const titledResourceName =
    resourceName.charAt(0).toUpperCase() + resourceName.slice(1);
  const untitledResourceName =
    resourceName.charAt(0).toLowerCase() + resourceName.slice(1);

  switch (kind) {
    case "invalid-params":
      return {
        description: t(($) => $.shared.feedback.resourceInvalidDescription, {
          resource: resourceName
        }),
        title: t(($) => $.shared.feedback.resourceInvalidTitle, {
          resource: untitledResourceName
        })
      };
    case "not-found":
      return {
        description: t(($) => $.shared.feedback.resourceNotFound, {
          resource: resourceName
        }),
        title: t(($) => $.shared.feedback.resourceNotFoundTitle, {
          resource: titledResourceName
        })
      };
    case "forbidden":
      return {
        description: t(($) => $.shared.feedback.resourceForbidden, {
          resource: resourceName
        }),
        title: t(($) => $.shared.feedback.resourceUnavailableTitle, {
          resource: titledResourceName
        })
      };
    case "load-error":
      return {
        description: t(($) => $.shared.feedback.resourceLoadError, {
          resource: resourceName
        }),
        title: t(($) => $.shared.feedback.resourceUnavailableTitle, {
          resource: titledResourceName
        })
      };
  }
}

export function RouteFeedback({
  action,
  description,
  icon = AlertIcon,
  kind,
  resourceName,
  title
}: RouteFeedbackProps) {
  const { t } = useTranslation("shared");
  const defaults = getDefaultContent(kind, resourceName, t);
  const Icon = icon;

  return (
    <Screen centered>
      <View
        accessibilityRole="alert"
        role="alert"
        testID="route-feedback"
        style={{
          alignItems: "center",
          alignSelf: "center",
          gap: atomSpacing[5],
          maxWidth: 560,
          width: "100%"
        }}
      >
        <Icon color={atomPalette.textMuted} size={40} strokeWidth={1.6} />
        <View style={{ alignItems: "center", gap: atomSpacing[2] }}>
          <AppHeading selectable style={{ textAlign: "center" }} variant="hero">
            {title ?? defaults.title}
          </AppHeading>
          <AppText selectable style={{ textAlign: "center" }} tone="muted">
            {description ?? defaults.description}
          </AppText>
        </View>
        {action ? (
          <AppButton
            fullWidth={false}
            icon={action.icon}
            onPress={action.onPress}
          >
            {action.label}
          </AppButton>
        ) : null}
      </View>
    </Screen>
  );
}

export function RouteStateBoundary({
  children,
  feedback,
  isError = false,
  isForbidden = false,
  isInvalid = false,
  isLoading = false,
  isNotFound = false,
  loadingFallback,
  resourceName
}: RouteStateBoundaryProps) {
  if (isInvalid) {
    return (
      <RouteFeedback
        kind="invalid-params"
        resourceName={resourceName}
        {...feedback?.invalidParams}
      />
    );
  }

  if (isLoading) {
    return loadingFallback;
  }

  if (isError) {
    return (
      <RouteFeedback
        kind="load-error"
        resourceName={resourceName}
        {...feedback?.loadError}
      />
    );
  }

  if (isNotFound) {
    return (
      <RouteFeedback
        kind="not-found"
        resourceName={resourceName}
        {...feedback?.notFound}
      />
    );
  }

  if (isForbidden) {
    return (
      <RouteFeedback
        kind="forbidden"
        resourceName={resourceName}
        {...feedback?.forbidden}
      />
    );
  }

  return children;
}
