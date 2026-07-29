import { atomPalette, atomSpacing } from "@/shared/ui/components/theme";
import { StyleSheet } from "react-native";

export const projectsScreenStyles = StyleSheet.create({
  controlsRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: atomSpacing[2]
  },
  expandedList: {
    flex: 1,
    gap: atomSpacing[4],
    minHeight: 0
  },
  filterControl: {
    flexShrink: 0
  },
  listHeader: {
    gap: atomSpacing[6],
    marginBottom: atomSpacing[6]
  },
  mapBody: {
    flex: 1,
    gap: atomSpacing[4],
    minHeight: 0
  },
  mapScreenContainer: {
    paddingBottom: atomSpacing[5]
  },
  mapScreenStack: {
    flex: 1,
    minHeight: 0
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(20, 22, 28, 0.18)"
  },
  modalBody: {
    gap: atomSpacing[5],
    paddingBottom: atomSpacing[1]
  },
  modalCard: {
    borderColor: atomPalette.borderSubtle,
    maxHeight: "86%",
    width: "100%"
  },
  modalContent: {
    maxWidth: 560,
    width: "100%"
  },
  modalFooter: {
    flexDirection: "row",
    gap: atomSpacing[3],
    paddingTop: atomSpacing[5]
  },
  modalFooterAction: {
    flex: 1
  },
  modalHeader: {
    borderBottomColor: atomPalette.borderSubtle,
    borderBottomWidth: 1,
    marginBottom: atomSpacing[5],
    paddingBottom: atomSpacing[4]
  },
  modalRoot: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: atomSpacing[4]
  },
  paginationFooter: {
    alignItems: "center",
    paddingVertical: atomSpacing[5]
  },
  projectListContent: {
    flexGrow: 1,
    paddingBottom: atomSpacing[6]
  },
  projectRow: {
    gap: atomSpacing[4]
  },
  projectRowSeparator: {
    height: atomSpacing[4]
  },
  screenContent: {
    flex: 1,
    minWidth: 0
  },
  searchExpanded: {
    flex: 1,
    maxWidth: 420,
    minWidth: 280
  },
  searchFluid: {
    width: "100%"
  },
  toolbar: {
    gap: atomSpacing[3]
  },
  toolbarExpanded: {
    alignItems: "center",
    flexDirection: "row"
  },
  viewTabsExpanded: {
    marginLeft: "auto",
    width: 220
  }
});
