import { AppButton } from "@/shared/ui/components/button";
import { AppCard } from "@/shared/ui/components/card";
import {
  canDismissDestructiveConfirmation,
  destructiveConfirmationReducer,
  initialDestructiveConfirmationState
} from "@/shared/ui/components/destructive-confirmation-state";
import { AppHeading } from "@/shared/ui/components/heading";
import { AppText } from "@/shared/ui/components/text";
import { atomSpacing } from "@/shared/ui/components/theme";
import type { ReactNode } from "react";
import { useReducer } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, StyleSheet, View } from "react-native";

export interface DestructiveConfirmationController {
  clearError: () => void;
  close: () => void;
  error: string | null;
  isOpen: boolean;
  open: () => void;
  setError: (error: string) => void;
}

export function useDestructiveConfirmation(): DestructiveConfirmationController {
  const [state, dispatch] = useReducer(
    destructiveConfirmationReducer,
    initialDestructiveConfirmationState
  );

  return {
    clearError: () => dispatch({ type: "clear-error" }),
    close: () => dispatch({ type: "close" }),
    error: state.error,
    isOpen: state.isOpen,
    open: () => dispatch({ type: "open" }),
    setError: (error) => dispatch({ error, type: "set-error" })
  };
}

export function DestructiveConfirmationDialog({
  accessibilityLabel,
  confirmLabel,
  controller,
  description,
  isConfirmDisabled = false,
  isPending,
  onConfirm,
  title
}: {
  accessibilityLabel: string;
  confirmLabel?: string;
  controller: DestructiveConfirmationController;
  description: ReactNode;
  isConfirmDisabled?: boolean;
  isPending: boolean;
  onConfirm: () => void | Promise<void>;
  title: ReactNode;
}) {
  const { t } = useTranslation("shared");
  const resolvedConfirmLabel =
    confirmLabel ?? t(($) => $.shared.feedback.destructiveConfirm);
  const requestClose = () => {
    if (canDismissDestructiveConfirmation(isPending)) {
      controller.close();
    }
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={requestClose}
      transparent
      visible={controller.isOpen}
    >
      <View style={styles.root}>
        <Pressable
          accessibilityLabel={accessibilityLabel}
          accessibilityRole="button"
          onPress={requestClose}
          style={StyleSheet.absoluteFill}
        />
        <View pointerEvents="none" style={styles.backdrop} />
        <AppCard padding="lg" style={styles.card}>
          <View style={styles.content}>
            <View style={styles.copy}>
              <AppHeading variant="section">{title}</AppHeading>
              {typeof description === "string" ? (
                <AppText selectable tone="muted">
                  {description}
                </AppText>
              ) : (
                description
              )}
              {controller.error ? (
                <AppText selectable tone="danger">
                  {controller.error}
                </AppText>
              ) : null}
            </View>
            <View style={styles.actions}>
              <AppButton
                color="neutral"
                fullWidth={false}
                isDisabled={isPending}
                onPress={requestClose}
                size="md"
                variant="bordered"
              >
                {t(($) => $.shared.actions.cancel)}
              </AppButton>
              <AppButton
                color="danger"
                fullWidth={false}
                isDisabled={isConfirmDisabled || isPending}
                loading={isPending}
                onPress={() => void onConfirm()}
                size="md"
              >
                {resolvedConfirmLabel}
              </AppButton>
            </View>
          </View>
        </AppCard>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: atomSpacing[3],
    justifyContent: "flex-end"
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.5)"
  },
  card: {
    maxWidth: 520,
    width: "100%"
  },
  content: {
    gap: atomSpacing[5]
  },
  copy: {
    gap: atomSpacing[2]
  },
  root: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: atomSpacing[5]
  }
});
