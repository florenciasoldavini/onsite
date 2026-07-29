import {
  atomPalette,
  atomRadii,
  atomSpacing
} from "@/shared/ui/components/theme";
import { StyleSheet, type ViewStyle } from "react-native";

export const projectDetailStyles = StyleSheet.create({
  actionCard: {
    aspectRatio: 1,
    borderRadius: atomRadii.xl,
    borderWidth: 1,
    flexBasis: "45%",
    flexGrow: 1,
    justifyContent: "space-between",
    maxWidth: 360,
    minWidth: 0,
    padding: atomSpacing[6]
  },
  actionCardAccent: {
    backgroundColor: atomPalette.accent,
    borderColor: atomPalette.accent
  },
  actionCardDefault: {
    backgroundColor: atomPalette.surface,
    borderColor: atomPalette.border
  },
  actionCardExpanded: {
    maxWidth: undefined,
    padding: atomSpacing[5]
  },
  actionCardHovered: {
    borderColor: atomPalette.borderStrong
  },
  actionCardPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }]
  },
  actionGrid: {
    alignSelf: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: atomSpacing[5],
    maxWidth: 744,
    width: "100%"
  },
  actionGridExpanded: {
    alignSelf: "stretch",
    flex: 0.72,
    maxWidth: 420
  },
  actionLabel: {
    alignItems: "flex-start"
  },
  actionLabelText: {
    letterSpacing: 1.4,
    textAlign: "left"
  },
  actionsMenu: {
    backgroundColor: atomPalette.surface,
    borderColor: atomPalette.border,
    borderRadius: atomRadii.md,
    borderWidth: 1,
    boxShadow: "0 10px 28px rgba(18, 18, 18, 0.14)",
    gap: atomSpacing[1],
    padding: atomSpacing[1],
    position: "absolute"
  },
  actionsMenuItem: {
    alignItems: "center",
    borderRadius: atomRadii.sm,
    flexDirection: "row",
    gap: atomSpacing[3],
    minHeight: 42,
    paddingHorizontal: atomSpacing[3],
    paddingVertical: atomSpacing[2]
  },
  actionsMenuItemPressed: {
    backgroundColor: atomPalette.surfaceLow
  },
  detailWorkspace: {
    gap: atomSpacing[5]
  },
  detailWorkspaceExpanded: {
    alignItems: "stretch",
    flexDirection: "row"
  },
  pageStack: {
    gap: atomSpacing[6]
  },
  progressCard: {
    alignSelf: "center",
    backgroundColor: atomPalette.surface,
    borderColor: atomPalette.border,
    borderRadius: atomRadii.xl,
    borderWidth: 1,
    maxWidth: 744,
    minHeight: 440,
    overflow: "hidden",
    position: "relative",
    width: "100%"
  },
  progressCardContent: {
    flex: 1,
    padding: atomSpacing[6],
    paddingTop: atomSpacing[16]
  },
  progressCardExpanded: {
    alignSelf: "stretch",
    flex: 1,
    maxWidth: undefined
  },
  progressDataBadge: {
    alignItems: "center",
    borderBottomColor: atomPalette.border,
    borderBottomLeftRadius: atomRadii.lg,
    borderBottomWidth: 1,
    borderLeftColor: atomPalette.border,
    borderLeftWidth: 1,
    flexDirection: "row",
    gap: atomSpacing[3],
    paddingHorizontal: atomSpacing[5],
    paddingVertical: atomSpacing[4],
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 1
  },
  progressDataDot: {
    backgroundColor: atomPalette.accent,
    borderRadius: atomRadii.full,
    height: 9,
    width: 9
  },
  progressFill: {
    backgroundColor: atomPalette.accent,
    height: "100%"
  },
  progressMeterBlock: {
    gap: atomSpacing[5],
    paddingTop: atomSpacing[8]
  },
  progressMeterLabel: {
    flex: 1,
    fontSize: 9,
    lineHeight: 12
  },
  progressMeterLabelCenter: {
    textAlign: "center"
  },
  progressMeterLabelRight: {
    textAlign: "right"
  },
  progressMeterLabels: {
    flexDirection: "row",
    gap: atomSpacing[2],
    justifyContent: "space-between"
  },
  progressMetric: {
    alignItems: "flex-end",
    flexShrink: 1,
    gap: atomSpacing[2],
    maxWidth: "46%",
    minWidth: 0,
    paddingBottom: atomSpacing[3]
  },
  progressMetricValue: {
    fontSize: 20,
    fontVariant: ["tabular-nums"],
    lineHeight: 26
  },
  progressNumber: {
    color: atomPalette.accent,
    fontSize: 92,
    fontVariant: ["tabular-nums"],
    letterSpacing: -5,
    lineHeight: 96
  },
  progressNumberRow: {
    alignItems: "flex-end",
    flexDirection: "row"
  },
  progressPercent: {
    fontSize: 34,
    lineHeight: 48,
    paddingBottom: atomSpacing[2]
  },
  progressPhaseTitle: {
    fontSize: 42,
    letterSpacing: -1.2,
    lineHeight: 48,
    paddingTop: atomSpacing[5]
  },
  progressTrack: {
    backgroundColor: atomPalette.surfaceLow,
    height: 6,
    overflow: "hidden"
  },
  progressValuesRow: {
    alignItems: "flex-end",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: atomSpacing[4],
    justifyContent: "space-between",
    paddingTop: atomSpacing[10]
  },
  titleContent: {
    flex: 1,
    minWidth: 0
  },
  titleRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: atomSpacing[4],
    justifyContent: "space-between"
  },
  webCursor: {
    cursor: "pointer"
  } as ViewStyle
});
