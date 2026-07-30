import type {
  DocumentAccessMode,
  ProjectDocument
} from "@/features/documents/types/document";
import { useLocalization } from "@/features/localization/hooks/use-localization";
import { AppBadge } from "@/shared/ui/components/badge";
import { AppButton } from "@/shared/ui/components/button";
import { AppCard } from "@/shared/ui/components/card";
import { AppHeading } from "@/shared/ui/components/heading";
import { AppText } from "@/shared/ui/components/text";
import { atomPalette, atomSpacing } from "@/shared/ui/components/theme";
import {
  DownloadIcon,
  FileTextIcon,
  OpenEyeIcon,
  PencilIcon,
  TrashIcon
} from "@/shared/ui/icons";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

export function DocumentCard({
  accessingMode,
  canWrite,
  document,
  onAccess,
  onDelete,
  onEdit
}: {
  accessingMode: DocumentAccessMode | null;
  canWrite: boolean;
  document: ProjectDocument;
  onAccess: (mode: DocumentAccessMode) => void;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const { formattingLocale } = useLocalization();
  const { t } = useTranslation("features/documents");
  const categoryLabel = getCategoryLabel(document.category, t);
  const date = new Intl.DateTimeFormat(formattingLocale, {
    dateStyle: "medium"
  }).format(new Date(document.created_at));

  return (
    <AppCard style={{ flex: 1 }}>
      <View style={{ flex: 1, gap: atomSpacing[4] }}>
        <View
          style={{
            alignItems: "flex-start",
            flexDirection: "row",
            gap: atomSpacing[3]
          }}
        >
          <View
            style={{
              alignItems: "center",
              backgroundColor: `${atomPalette.accent}12`,
              borderRadius: 12,
              height: 44,
              justifyContent: "center",
              width: 44
            }}
          >
            <FileTextIcon color={atomPalette.accent} />
          </View>
          <View style={{ flex: 1, gap: atomSpacing[2] }}>
            <AppHeading numberOfLines={2} variant="card">
              {document.name}
            </AppHeading>
            <AppBadge>{categoryLabel}</AppBadge>
          </View>
        </View>

        <View style={{ gap: atomSpacing[1] }}>
          <AppText numberOfLines={1} selectable tone="muted">
            {document.original_filename}
          </AppText>
          <AppText tone="subtle" variant="meta">
            {t(($) => $["features/documents"].list.fileDetails, {
              size: formatFileSize(document.file_size_bytes),
              type: document.file_extension.toLocaleUpperCase()
            })}
          </AppText>
          <AppText tone="subtle" variant="meta">
            {t(($) => $["features/documents"].list.uploaded, {
              date,
              name: document.uploaded_by_display_name
            })}
          </AppText>
        </View>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: atomSpacing[2],
            marginTop: "auto"
          }}
        >
          <AppButton
            accessibilityLabel={t(
              ($) => $["features/documents"].accessibility.open,
              { name: document.name }
            )}
            color="neutral"
            fullWidth={false}
            icon={OpenEyeIcon}
            iconAfter={false}
            loading={accessingMode === "open"}
            onPress={() => onAccess("open")}
            size="sm"
            variant="bordered"
          >
            {t(($) => $["features/documents"].actions.open)}
          </AppButton>
          <AppButton
            accessibilityLabel={t(
              ($) => $["features/documents"].accessibility.download,
              { name: document.name }
            )}
            color="neutral"
            fullWidth={false}
            icon={DownloadIcon}
            iconAfter={false}
            loading={accessingMode === "download"}
            onPress={() => onAccess("download")}
            size="sm"
            variant="bordered"
          >
            {t(($) => $["features/documents"].actions.download)}
          </AppButton>
          {canWrite ? (
            <>
              <AppButton
                accessibilityLabel={t(
                  ($) => $["features/documents"].accessibility.edit,
                  { name: document.name }
                )}
                color="neutral"
                fullWidth={false}
                icon={PencilIcon}
                iconAfter={false}
                onPress={onEdit}
                size="sm"
                variant="ghost"
              >
                {t(($) => $["features/documents"].actions.edit)}
              </AppButton>
              <AppButton
                accessibilityLabel={t(
                  ($) => $["features/documents"].accessibility.delete,
                  { name: document.name }
                )}
                color="danger"
                fullWidth={false}
                icon={TrashIcon}
                iconAfter={false}
                onPress={onDelete}
                size="sm"
                variant="ghost"
              >
                {t(($) => $["features/documents"].actions.delete)}
              </AppButton>
            </>
          ) : null}
        </View>
      </View>
    </AppCard>
  );
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getCategoryLabel(
  category: ProjectDocument["category"],
  t: ReturnType<typeof useTranslation<"features/documents">>["t"]
) {
  switch (category) {
    case "drawing":
      return t(($) => $["features/documents"].categories.drawing);
    case "specification":
      return t(($) => $["features/documents"].categories.specification);
    case "permit":
      return t(($) => $["features/documents"].categories.permit);
    case "contract":
      return t(($) => $["features/documents"].categories.contract);
    case "manual":
      return t(($) => $["features/documents"].categories.manual);
    case "report":
      return t(($) => $["features/documents"].categories.report);
    case "invoice":
      return t(($) => $["features/documents"].categories.invoice);
    case "other":
      return t(($) => $["features/documents"].categories.other);
  }
}
