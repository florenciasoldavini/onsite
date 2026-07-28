import {
  getClientDisplayName,
  getClientInitials
} from "@/features/clients/schemas/client.schema";
import {
  useClient,
  useClientProjectCount,
  useSoftDeleteClient
} from "@/features/clients/hooks/use-clients";
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
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

export default function ClientDetailScreen() {
  const params = useLocalSearchParams<{ clientId: string }>();
  const clientId = Array.isArray(params.clientId)
    ? params.clientId[0]
    : params.clientId;
  const clientQuery = useClient(clientId);

  if (clientQuery.isLoading) {
    return (
      <Screen>
        <View style={{ gap: atomSpacing[5] }}>
          <SkeletonBlock height={48} width="55%" />
          <SkeletonBlock height={220} />
        </View>
      </Screen>
    );
  }

  if (clientQuery.isError) {
    return (
      <Screen centered>
        <EmptyState
          action={{
            icon: RefreshIcon,
            label: "Retry",
            onPress: () => void clientQuery.refetch()
          }}
          description={getUserFacingErrorMessage(
            clientQuery.error,
            "We couldn't load this client. Try again."
          )}
          icon={UserIcon}
          title="Client unavailable"
        />
      </Screen>
    );
  }

  if (!clientQuery.data) {
    return (
      <Screen centered>
        <EmptyState
          description="This client may have been removed or you may not have access."
          icon={UserIcon}
          title="Client not found"
        />
      </Screen>
    );
  }

  return <ClientDetailContent client={clientQuery.data} />;
}

function ClientDetailContent({
  client
}: {
  client: NonNullable<ReturnType<typeof useClient>["data"]>;
}) {
  const router = useRouter();
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

  const deleteClient = async () => {
    deleteConfirmation.clearError();
    try {
      await deleteMutation.mutateAsync(client.id);
      deleteConfirmation.close();
      toast.show({
        description: `${displayName} was deleted and removed from linked projects.`,
        title: "Client deleted",
        tone: "success"
      });
      router.replace("/directory?section=clients" as never);
    } catch (error) {
      deleteConfirmation.setError(
        getUserFacingErrorMessage(
          error,
          "We couldn't delete this client. Try again."
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
              accessibilityLabel: "Back to clients",
              label: "Clients",
              onPress: () =>
                router.replace("/directory?section=clients" as never)
            },
            { label: "Client Detail" }
          ]}
        />

        <AppCard padding={isCompact ? "md" : "lg"}>
          <View
            style={[
              detailStyles.identityLayout,
              isCompact ? detailStyles.identityLayoutCompact : null
            ]}
          >
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
                  CLIENT PROFILE
                </AppText>
                <AppHeading variant="hero">{displayName}</AppHeading>
                <AppText tone="muted">
                  Contact record for your project catalog
                </AppText>
              </View>
            </View>

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
                Edit
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
                Delete
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
                <AppHeading variant="section">Contact details</AppHeading>
                <AppText tone="subtle" variant="meta">
                  PRIMARY
                </AppText>
              </View>
              <ContactRow
                icon={PhoneIcon}
                label="Phone"
                value={client.phone_number ?? "Not provided"}
              />
              <ContactRow
                icon={MailIcon}
                label="Email"
                value={client.email ?? "Not provided"}
              />
            </View>
          </AppCard>

          <AppCard padding="lg" style={detailStyles.projectsPanel}>
            <View style={detailStyles.sectionContent}>
              <View style={detailStyles.sectionHeading}>
                <View style={{ gap: atomSpacing[1] }}>
                  <AppHeading variant="section">Linked projects</AppHeading>
                  <AppText tone="muted" variant="bodySm">
                    Projects using this client contact
                  </AppText>
                </View>
                {!projectCountQuery.isLoading &&
                !projectCountQuery.isError ? (
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
                <EmptyState
                  action={{
                    icon: RefreshIcon,
                    label: "Retry",
                    onPress: () => void projectsQuery.refetch()
                  }}
                  description={getUserFacingErrorMessage(
                    projectsQuery.error,
                    "We couldn't load linked projects. Try again."
                  )}
                  title="Projects unavailable"
                />
              ) : projects.length === 0 ? (
                <View style={detailStyles.projectsEmpty}>
                  <View style={detailStyles.projectsEmptyIcon}>
                    <ProjectsIcon
                      color={atomPalette.textMuted}
                      size="lg"
                    />
                  </View>
                  <View style={{ gap: atomSpacing[1] }}>
                    <AppHeading variant="card">
                      No linked projects
                    </AppHeading>
                    <AppText
                      style={detailStyles.projectsEmptyCopy}
                      tone="muted"
                      variant="bodySm"
                    >
                      Select this client when creating or editing a project.
                    </AppText>
                  </View>
                  <AppButton
                    color="neutral"
                    fullWidth={false}
                    onPress={() => router.push("/projects" as never)}
                    size="sm"
                    variant="bordered"
                  >
                    View projects
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
                      Load more projects
                    </AppButton>
                  ) : null}
                </View>
              )}
            </View>
          </AppCard>
        </View>
      </View>

      <DestructiveConfirmationDialog
        accessibilityLabel="Cancel deleting client"
        confirmLabel="Delete client"
        controller={deleteConfirmation}
        description={
          projectCountQuery.isFetching ? (
            <AppText tone="muted">Checking linked projects…</AppText>
          ) : projectCountQuery.isError ? (
            <AppText tone="danger">
              We couldn&apos;t check linked projects. Close this message and try
              again.
            </AppText>
          ) : (
            <AppText tone="muted">
              {projectCountQuery.data === 0
                ? "This removes the client from your active catalog."
                : `This client is linked to ${projectCountQuery.data} ${
                    projectCountQuery.data === 1 ? "project" : "projects"
                  }. Deleting the client will unlink ${
                    projectCountQuery.data === 1 ? "it" : "them"
                  } from those projects.`}
            </AppText>
          )
        }
        isConfirmDisabled={
          projectCountQuery.isFetching || projectCountQuery.isError
        }
        isPending={deleteMutation.isPending}
        onConfirm={deleteClient}
        title={`Delete ${displayName}?`}
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
