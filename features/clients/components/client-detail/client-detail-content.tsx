import {
  getClientDisplayName,
  getClientInitials
} from "@/features/clients/schemas/client.schema";
import {
  useClient,
  useClientProjectCount,
  useSoftDeleteClient
} from "@/features/clients/hooks/use-clients";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { ProjectCard } from "@/features/projects/components/project-card";
import { useProjects } from "@/features/projects/hooks/use-projects";
import { AppButton } from "@/shared/ui/components/button";
import { Breadcrumb } from "@/shared/ui/components/breadcrumb";
import { AppCard } from "@/shared/ui/components/card";
import {
  DestructiveConfirmationDialog,
  useDestructiveConfirmation
} from "@/shared/ui/components/destructive-confirmation-dialog";
import { EmptyState } from "@/shared/ui/components/empty-state";
import { AppHeading } from "@/shared/ui/components/heading";
import { InlineErrorState } from "@/shared/ui/components/inline-error-state";
import { RouteStateBoundary } from "@/shared/ui/components/route-feedback";
import { Screen } from "@/shared/ui/components/screen";
import { SkeletonBlock } from "@/shared/ui/components/skeleton-block";
import { AppText } from "@/shared/ui/components/text";
import { useAppToast } from "@/shared/ui/components/toast";
import {
  atomPalette,
  atomRadii,
  atomSpacing
} from "@/shared/ui/components/theme";
import { useLayoutMode } from "@/shared/hooks/use-layout-mode";
import {
  MailIcon,
  PencilIcon,
  PhoneIcon,
  ProjectsIcon,
  RefreshIcon,
  TrashIcon,
  UserIcon
} from "@/shared/ui/icons";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";

export function ClientDetailContent({
  client
}: {
  client: NonNullable<ReturnType<typeof useClient>["data"]>;
}) {
  const router = useRouter();
  const { t } = useTranslation("features/clients");
  const { t: tShared } = useTranslation("shared");
  const { user } = useAuth();
  const { isCompact, isExpanded } = useLayoutMode();
  const toast = useAppToast();
  const projectsQuery = useProjects({
    clientId: client.id,
    sort: "created_desc"
  });
  const projectCountQuery = useClientProjectCount(client.id);
  const deleteMutation = useSoftDeleteClient();
  const deleteConfirmation = useDestructiveConfirmation();
  const projects = useMemo(
    () => projectsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [projectsQuery.data]
  );
  const displayName = getClientDisplayName(client);
  const canManageClient =
    user?.role === "admin" || user?.id === client.owner_id;

  const deleteClient = async () => {
    deleteConfirmation.clearError();
    try {
      await deleteMutation.mutateAsync(client.id);
      deleteConfirmation.close();
      toast.show({
        description: t(
          ($) => $["features/clients"].detail.deletedDescription,
          { name: displayName }
        ),
        title: t(($) => $["features/clients"].detail.deletedTitle),
        tone: "success"
      });
      router.replace("/directory?section=clients" as never);
    } catch (error) {
      deleteConfirmation.setError(
        getUserFacingErrorMessage(
          error,
          t(($) => $["features/clients"].errors.delete)
        )
      );
    }
  };

  return (
    <Screen>
      <View style={detailStyles.page}>
        <Breadcrumb
          items={[
            {
              accessibilityLabel: t(
                ($) => $["features/clients"].accessibility.backToClients
              ),
              label: t(($) => $["features/clients"].list.title),
              onPress: () =>
                router.replace("/directory?section=clients" as never)
            },
            { label: t(($) => $["features/clients"].breadcrumbs.detail) }
          ]}
        />

        <AppCard padding={isCompact ? "md" : "lg"}>
          <View
            style={[
              detailStyles.identityLayout,
              isCompact ? detailStyles.identityLayoutCompact : null
            ]}
          >
            {canManageClient ? (
              <View
                style={[
                  detailStyles.identityContent,
                  isCompact ? detailStyles.identityContentCompact : null
                ]}
              >
                <View
                  style={[
                    detailStyles.avatar,
                    isCompact ? detailStyles.avatarCompact : null
                  ]}
                >
                  <AppText
                    style={isCompact ? detailStyles.avatarTextCompact : null}
                    tone="accent"
                    variant="label"
                  >
                    {getClientInitials(client)}
                  </AppText>
                </View>
                <View style={detailStyles.identityCopy}>
                  <AppText tone="accent" variant="eyebrow">
                    {t(($) => $["features/clients"].detail.profile)}
                  </AppText>
                  <AppHeading variant="hero">{displayName}</AppHeading>
                  <AppText tone="muted">
                    {t(
                      ($) => $["features/clients"].detail.profileDescription
                    )}
                  </AppText>
                </View>
              </View>
            ) : null}

            <View
              style={[
                detailStyles.identityActions,
                isCompact ? detailStyles.identityActionsCompact : null
              ]}
            >
              <AppButton
                color="neutral"
                fullWidth={isCompact}
                icon={PencilIcon}
                iconAfter={false}
                onPress={() =>
                  router.push(`/clients/${client.id}/edit` as never)
                }
                size="sm"
                variant="bordered"
              >
                {tShared(($) => $.shared.actions.edit)}
              </AppButton>
              <AppButton
                color="danger"
                fullWidth={isCompact}
                icon={TrashIcon}
                iconAfter={false}
                onPress={() => {
                  deleteConfirmation.open();
                  void projectCountQuery.refetch();
                }}
                size="sm"
                variant="bordered"
              >
                {tShared(($) => $.shared.actions.delete)}
              </AppButton>
            </View>
          </View>
        </AppCard>

        <View
          style={[
            detailStyles.workspace,
            isExpanded ? detailStyles.workspaceExpanded : null
          ]}
        >
          <AppCard
            padding="lg"
            style={isExpanded ? detailStyles.contactPanelExpanded : null}
          >
            <View style={detailStyles.sectionContent}>
              <View style={detailStyles.sectionHeading}>
                <AppHeading variant="section">
                  {t(($) => $["features/clients"].detail.contactDetails)}
                </AppHeading>
                <AppText tone="subtle" variant="meta">
                  {t(($) => $["features/clients"].detail.primary)}
                </AppText>
              </View>
              <ContactRow
                icon={PhoneIcon}
                label={t(($) => $["features/clients"].detail.phone)}
                value={
                  client.phone_number ??
                  t(($) => $["features/clients"].detail.notProvided)
                }
              />
              <ContactRow
                icon={MailIcon}
                label={t(($) => $["features/clients"].detail.email)}
                value={
                  client.email ??
                  t(($) => $["features/clients"].detail.notProvided)
                }
              />
            </View>
          </AppCard>

          <AppCard padding="lg" style={detailStyles.projectsPanel}>
            <View style={detailStyles.sectionContent}>
              <View style={detailStyles.sectionHeading}>
                <View style={{ gap: atomSpacing[1] }}>
                  <AppHeading variant="section">
                    {t(($) => $["features/clients"].detail.linkedProjects)}
                  </AppHeading>
                  <AppText tone="muted" variant="bodySm">
                    {t(
                      ($) =>
                        $["features/clients"].detail.linkedProjectsDescription
                    )}
                  </AppText>
                </View>
                {!projectCountQuery.isLoading && !projectCountQuery.isError ? (
                  <View style={detailStyles.countBadge}>
                    <AppText tone="accent" variant="label">
                      {projectCountQuery.data ?? 0}
                    </AppText>
                  </View>
                ) : null}
              </View>

              {projectsQuery.isLoading ? (
                <SkeletonBlock height={190} />
              ) : projectsQuery.isError ? (
                <InlineErrorState
                  action={{
                    icon: RefreshIcon,
                    label: tShared(($) => $.shared.actions.retry),
                    onPress: () => void projectsQuery.refetch()
                  }}
                  description={getUserFacingErrorMessage(
                    projectsQuery.error,
                    t(
                      ($) => $["features/clients"].detail.linkedProjectsError
                    )
                  )}
                  title={t(
                    ($) =>
                      $["features/clients"].detail.linkedProjectsUnavailable
                  )}
                />
              ) : projects.length === 0 ? (
                <View style={detailStyles.projectsEmpty}>
                  <View style={detailStyles.projectsEmptyIcon}>
                    <ProjectsIcon color={atomPalette.textMuted} size="lg" />
                  </View>
                  <View style={{ gap: atomSpacing[1] }}>
                    <AppHeading variant="card">
                      {t(
                        ($) => $["features/clients"].detail.noLinkedProjects
                      )}
                    </AppHeading>
                    <AppText
                      style={detailStyles.projectsEmptyCopy}
                      tone="muted"
                      variant="bodySm"
                    >
                      {t(
                        ($) =>
                          $["features/clients"].detail
                            .noLinkedProjectsDescription
                      )}
                    </AppText>
                  </View>
                  <AppButton
                    color="neutral"
                    fullWidth={false}
                    onPress={() => router.push("/projects" as never)}
                    size="sm"
                    variant="bordered"
                  >
                    {t(($) => $["features/clients"].detail.viewProjects)}
                  </AppButton>
                </View>
              ) : (
                <View style={{ gap: atomSpacing[4] }}>
                  {projects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      onPress={() =>
                        router.push(`/projects/${project.id}` as never)
                      }
                      project={project}
                    />
                  ))}
                  {projectsQuery.hasNextPage ? (
                    <AppButton
                      color="neutral"
                      loading={projectsQuery.isFetchingNextPage}
                      onPress={() => void projectsQuery.fetchNextPage()}
                      size="sm"
                      variant="bordered"
                    >
                      {t(
                        ($) => $["features/clients"].detail.loadMoreProjects
                      )}
                    </AppButton>
                  ) : null}
                </View>
              )}
            </View>
          </AppCard>
        </View>
      </View>

      <DestructiveConfirmationDialog
        accessibilityLabel={t(
          ($) => $["features/clients"].accessibility.cancelDelete
        )}
        confirmLabel={t(($) => $["features/clients"].actions.delete)}
        controller={deleteConfirmation}
        description={
          projectCountQuery.isFetching ? (
            <AppText tone="muted">
              {t(($) => $["features/clients"].delete.checkingProjects)}
            </AppText>
          ) : projectCountQuery.isError ? (
            <AppText tone="danger">
              {t(($) => $["features/clients"].delete.checkProjectsError)}
            </AppText>
          ) : (
            <AppText tone="muted">
              {(projectCountQuery.data ?? 0) === 0
                ? t(
                    ($) => $["features/clients"].delete.descriptionUnlinked
                  )
                : t(($) => $["features/clients"].delete.linkedProjects, {
                    count: projectCountQuery.data ?? 0
                  })}
            </AppText>
          )
        }
        isConfirmDisabled={
          projectCountQuery.isFetching || projectCountQuery.isError
        }
        isPending={deleteMutation.isPending}
        onConfirm={deleteClient}
        title={t(($) => $["features/clients"].delete.title, {
          name: displayName
        })}
      />
    </Screen>
  );
}

function ContactRow({
  icon: Icon,
  label,
  value
}: {
  icon: typeof PhoneIcon;
  label: string;
  value: string;
}) {
  return (
    <View style={detailStyles.contactRow}>
      <View style={detailStyles.contactIcon}>
        <Icon color={atomPalette.accent} size="md" />
      </View>
      <View style={{ flex: 1, gap: atomSpacing[1] }}>
        <AppText tone="subtle" variant="meta">
          {label}
        </AppText>
        <AppText selectable>{value}</AppText>
      </View>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    backgroundColor: `${atomPalette.accent}14`,
    borderColor: `${atomPalette.accent}28`,
    borderRadius: 999,
    borderWidth: 1,
    height: 72,
    justifyContent: "center",
    width: 72
  },
  avatarCompact: {
    height: 56,
    width: 56
  },
  avatarTextCompact: {
    fontSize: 12
  },
  contactIcon: {
    alignItems: "center",
    backgroundColor: `${atomPalette.accent}0d`,
    borderRadius: atomRadii.md,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  contactPanelExpanded: {
    flexBasis: 336,
    flexGrow: 0
  },
  contactRow: {
    alignItems: "center",
    backgroundColor: atomPalette.surfaceLow,
    borderColor: atomPalette.borderSubtle,
    borderRadius: atomRadii.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: atomSpacing[3],
    padding: atomSpacing[4]
  },
  countBadge: {
    alignItems: "center",
    backgroundColor: `${atomPalette.accent}12`,
    borderRadius: 999,
    justifyContent: "center",
    minHeight: 32,
    minWidth: 32,
    paddingHorizontal: atomSpacing[2]
  },
  identityActions: {
    flexDirection: "row",
    gap: atomSpacing[2]
  },
  identityActionsCompact: {
    alignSelf: "stretch"
  },
  identityContent: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: atomSpacing[4],
    minWidth: 0
  },
  identityContentCompact: {
    alignItems: "flex-start"
  },
  identityCopy: {
    flex: 1,
    gap: atomSpacing[1],
    minWidth: 0
  },
  identityLayout: {
    alignItems: "center",
    flexDirection: "row",
    gap: atomSpacing[5],
    justifyContent: "space-between"
  },
  identityLayoutCompact: {
    alignItems: "flex-start",
    flexDirection: "column"
  },
  page: {
    alignSelf: "center",
    gap: atomSpacing[5],
    maxWidth: 1040,
    width: "100%"
  },
  projectsEmpty: {
    alignItems: "center",
    backgroundColor: atomPalette.surfaceLow,
    borderColor: atomPalette.borderSubtle,
    borderRadius: atomRadii.lg,
    borderStyle: "dashed",
    borderWidth: 1,
    gap: atomSpacing[3],
    justifyContent: "center",
    minHeight: 210,
    padding: atomSpacing[6]
  },
  projectsEmptyCopy: {
    maxWidth: 320,
    textAlign: "center"
  },
  projectsEmptyIcon: {
    alignItems: "center",
    backgroundColor: atomPalette.surface,
    borderColor: atomPalette.borderSubtle,
    borderRadius: 999,
    borderWidth: 1,
    height: 52,
    justifyContent: "center",
    width: 52
  },
  projectsPanel: {
    flex: 1,
    minWidth: 0
  },
  sectionContent: {
    gap: atomSpacing[4]
  },
  sectionHeading: {
    alignItems: "center",
    flexDirection: "row",
    gap: atomSpacing[3],
    justifyContent: "space-between"
  },
  workspace: {
    gap: atomSpacing[4]
  },
  workspaceExpanded: {
    alignItems: "flex-start",
    flexDirection: "row"
  }
});
