import {
  useInviteProjectMember,
  useRemoveProjectMember,
  useResendProjectInvitation,
  useRevokeProjectInvitation,
  useUpdateProjectMemberRole
} from "@/features/projects/hooks/use-project-collaboration";
import {
  projectInviteInputSchema,
  type ProjectInviteInput
} from "@/features/projects/schemas/project-participant.schema";
import type {
  ProjectInvitationSummary,
  ProjectMemberSummary,
  ProjectRoleOption
} from "@/features/projects/types/project-participant";
import { AppButton } from "@/shared/ui/components/button";
import { AppCard } from "@/shared/ui/components/card";
import {
  DestructiveConfirmationDialog,
  useDestructiveConfirmation
} from "@/shared/ui/components/destructive-confirmation-dialog";
import { EmptyState } from "@/shared/ui/components/empty-state";
import { AppHeading } from "@/shared/ui/components/heading";
import { TextField } from "@/shared/ui/components/input";
import { SelectField } from "@/shared/ui/components/select-field";
import { AppText } from "@/shared/ui/components/text";
import { atomSpacing } from "@/shared/ui/components/theme";
import { useAppToast } from "@/shared/ui/components/toast";
import { MailIcon, TrashIcon, UserIcon } from "@/shared/ui/icons";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import { useLocalization } from "@/features/localization/hooks/use-localization";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

export function InviteMemberCard({
  projectId,
  roles
}: {
  projectId: string;
  roles: ProjectRoleOption[];
}) {
  const inviteMutation = useInviteProjectMember(projectId);
  const { language } = useLocalization();
  const { t } = useTranslation("features/projects");
  const toast = useAppToast();
  const defaultRole = roles[0]?.code ?? "";
  const form = useForm<ProjectInviteInput>({
    defaultValues: { email: "", language, roleCode: defaultRole },
    mode: "onChange",
    resolver: zodResolver(projectInviteInputSchema)
  });

  useEffect(() => {
    if (!form.getValues("roleCode") && defaultRole) {
      form.setValue("roleCode", defaultRole, { shouldValidate: true });
    }
  }, [defaultRole, form]);

  const submit = form.handleSubmit(async (values) => {
    try {
      await inviteMutation.mutateAsync(values);
      form.reset({ email: "", language, roleCode: defaultRole });
      toast.show({
        description: t(
          ($) => $["features/projects"].invitationForm.sentDescription,
          { email: values.email }
        ),
        title: t(
          ($) => $["features/projects"].invitationForm.sentTitle
        ),
        tone: "success"
      });
    } catch (error) {
      form.setError("root", {
        message: getUserFacingErrorMessage(
          error,
          t(($) => $["features/projects"].invitationForm.sendError)
        )
      });
    }
  });

  return (
    <AppCard padding="lg">
      <View style={{ gap: atomSpacing[4] }}>
        <AppHeading variant="section">
          {t(($) => $["features/projects"].invitationForm.title)}
        </AppHeading>
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <TextField
              autoCapitalize="none"
              errorText={fieldState.error?.message}
              keyboardType="email-address"
              label={t(
                ($) => $["features/projects"].invitationForm.email
              )}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholder="person@example.com"
              required
              value={field.value}
            />
          )}
        />
        <Controller
          control={form.control}
          name="roleCode"
          render={({ field, fieldState }) => (
            <SelectField
              errorText={fieldState.error?.message}
              label={t(($) => $["features/projects"].invitationForm.role)}
              onChange={field.onChange}
              options={roles.map((role) => ({
                label: projectRoleLabel(role.code, role.displayName, t),
                value: role.code
              }))}
              required
              value={field.value}
            />
          )}
        />
        <Controller
          control={form.control}
          name="language"
          render={({ field, fieldState }) => (
            <SelectField
              errorText={fieldState.error?.message}
              label={t(
                ($) => $["features/projects"].invitationForm.language
              )}
              onChange={field.onChange}
              options={[
                {
                  label: t(
                    ($) =>
                      $["features/projects"].invitationForm.languageSpanish
                  ),
                  value: "es"
                },
                {
                  label: t(
                    ($) =>
                      $["features/projects"].invitationForm.languageEnglish
                  ),
                  value: "en"
                }
              ]}
              required
              value={field.value}
            />
          )}
        />
        {form.formState.errors.root?.message ? (
          <AppText selectable tone="danger">
            {form.formState.errors.root.message}
          </AppText>
        ) : null}
        <AppButton
          fullWidth={false}
          icon={MailIcon}
          isDisabled={!form.formState.isValid || inviteMutation.isPending}
          loading={inviteMutation.isPending}
          onPress={() => void submit()}
        >
          {t(($) => $["features/projects"].invitationForm.send)}
        </AppButton>
      </View>
    </AppCard>
  );
}

function projectRoleLabel(
  code: string,
  fallback: string,
  t: ReturnType<typeof useTranslation<"features/projects">>["t"]
) {
  switch (code) {
    case "collaborator":
      return t(($) => $["features/projects"].roles.collaborator);
    case "manager":
      return t(($) => $["features/projects"].roles.manager);
    case "member":
      return t(($) => $["features/projects"].roles.member);
    case "owner":
      return t(($) => $["features/projects"].roles.owner);
    case "viewer":
      return t(($) => $["features/projects"].roles.viewer);
    default:
      return fallback || code;
  }
}

export function MembersCard({
  canManage,
  members,
  ownerUserId,
  projectId,
  roles
}: {
  canManage: boolean;
  members: ProjectMemberSummary[];
  ownerUserId: string;
  projectId: string;
  roles: ProjectRoleOption[];
}) {
  const { t } = useTranslation("features/projects");
  const updateRole = useUpdateProjectMemberRole(projectId);
  const removeMember = useRemoveProjectMember(projectId);
  const confirmation = useDestructiveConfirmation();
  const [selected, setSelected] = useState<ProjectMemberSummary | null>(null);

  const confirmRemoval = async () => {
    if (!selected) return;
    confirmation.clearError();
    try {
      await removeMember.mutateAsync(selected.id);
      confirmation.close();
      setSelected(null);
    } catch (error) {
      confirmation.setError(
        getUserFacingErrorMessage(
          error,
          t(($) => $["features/projects"].team.removeError)
        )
      );
    }
  };

  return (
    <>
      <AppCard padding="lg">
        <View style={{ gap: atomSpacing[4] }}>
          <AppHeading variant="section">
            {t(($) => $["features/projects"].team.activeMembers)}
          </AppHeading>
          {members.map((member) => {
            const isOwner = member.userId === ownerUserId;
            return (
              <View
                key={member.id}
                style={{
                  alignItems: "center",
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: atomSpacing[3],
                  justifyContent: "space-between"
                }}
              >
                <View style={{ flex: 1, gap: atomSpacing[1], minWidth: 180 }}>
                  <AppText selectable variant="label">
                    {member.firstName} {member.lastName ?? ""}
                  </AppText>
                  <AppText selectable tone="muted" variant="bodySm">
                    {member.email}
                  </AppText>
                </View>
                {canManage && !isOwner ? (
                  <View
                    style={{
                      alignItems: "center",
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: atomSpacing[2]
                    }}
                  >
                    <SelectField
                      disabled={updateRole.isPending}
                      label={t(($) => $["features/projects"].team.role)}
                      onChange={(roleCode) =>
                        updateRole.mutate({
                          membershipId: member.id,
                          roleCode
                        })
                      }
                      options={roles.map((role) => ({
                        label: projectRoleLabel(
                          role.code,
                          role.displayName,
                          t
                        ),
                        value: role.code
                      }))}
                      value={member.roleCode}
                    />
                    <AppButton
                      accessibilityLabel={`Remove ${member.firstName}`}
                      color="danger"
                      fullWidth={false}
                      icon={TrashIcon}
                      layout="icon"
                      onPress={() => {
                        setSelected(member);
                        confirmation.open();
                      }}
                      variant="bordered"
                    />
                  </View>
                ) : (
                  <AppText tone="accent" variant="label">
                    {isOwner
                      ? t(($) => $["features/projects"].roles.owner)
                      : projectRoleLabel(
                          member.roleCode,
                          roleLabel(member.roleCode, roles),
                          t
                        )}
                  </AppText>
                )}
              </View>
            );
          })}
          {updateRole.isError ? (
            <AppText selectable tone="danger">
              {getUserFacingErrorMessage(
                updateRole.error,
                t(($) => $["features/projects"].team.changeRoleError)
              )}
            </AppText>
          ) : null}
        </View>
      </AppCard>
      <DestructiveConfirmationDialog
        accessibilityLabel={t(
          ($) => $["features/projects"].team.removeMember
        )}
        confirmLabel={t(($) => $["features/projects"].team.remove)}
        controller={confirmation}
        description={t(
          ($) => $["features/projects"].team.removeDescription,
          {
            name:
              selected?.firstName ??
              t(($) => $["features/projects"].team.memberFallback)
          }
        )}
        isPending={removeMember.isPending}
        onConfirm={confirmRemoval}
        title={t(($) => $["features/projects"].team.removeMember)}
      />
    </>
  );
}

export function PendingInvitationsCard({
  invitations,
  projectId,
  roles
}: {
  invitations: ProjectInvitationSummary[];
  projectId: string;
  roles: ProjectRoleOption[];
}) {
  const { t } = useTranslation("features/projects");
  const resend = useResendProjectInvitation(projectId);
  const revoke = useRevokeProjectInvitation(projectId);
  const confirmation = useDestructiveConfirmation();
  const resendConfirmation = useDestructiveConfirmation();
  const [selected, setSelected] = useState<ProjectInvitationSummary | null>(
    null
  );
  const [selectedResend, setSelectedResend] =
    useState<ProjectInvitationSummary | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const pending = useMemo(
    () => invitations.filter((invitation) => invitation.status === "pending"),
    [invitations]
  );

  useEffect(() => {
    const hasCooldown = pending.some(
      (invitation) => getResendCooldownSeconds(invitation, now) > 0
    );
    if (!hasCooldown) return;

    const timer = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(timer);
  }, [now, pending]);

  const confirmRevoke = async () => {
    if (!selected) return;
    confirmation.clearError();
    try {
      await revoke.mutateAsync(selected.id);
      confirmation.close();
      setSelected(null);
    } catch (error) {
      confirmation.setError(
        getUserFacingErrorMessage(
          error,
          t(($) => $["features/projects"].team.revokeError)
        )
      );
    }
  };

  const confirmResend = async () => {
    if (!selectedResend) return;
    resendConfirmation.clearError();
    try {
      await resend.mutateAsync(selectedResend.id);
      resendConfirmation.close();
      setSelectedResend(null);
    } catch (error) {
      resendConfirmation.setError(
        getUserFacingErrorMessage(
          error,
          t(($) => $["features/projects"].team.resendError)
        )
      );
    }
  };

  return (
    <>
      <AppCard padding="lg">
        <View style={{ gap: atomSpacing[4] }}>
          <AppHeading variant="section">
            {t(($) => $["features/projects"].invitations.pending)}
          </AppHeading>
          {resend.isError ? (
            <AppText selectable tone="danger">
              {getUserFacingErrorMessage(
                resend.error,
                t(($) => $["features/projects"].team.resendError)
              )}
            </AppText>
          ) : null}
          {pending.length === 0 ? (
            <EmptyState
              description={t(
                ($) => $["features/projects"].team.emptyInvitationsDescription
              )}
              icon={UserIcon}
              title={t(
                ($) => $["features/projects"].team.emptyInvitations
              )}
            />
          ) : (
            pending.map((invitation) => {
              const cooldown = getResendCooldownSeconds(invitation, now);

              return (
                <View
                  key={invitation.id}
                  style={{
                    alignItems: "center",
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: atomSpacing[3],
                    justifyContent: "space-between"
                  }}
                >
                  <View style={{ flex: 1, gap: atomSpacing[1], minWidth: 180 }}>
                    <AppText selectable variant="label">
                      {invitation.email}
                    </AppText>
                    <AppText tone="muted" variant="bodySm">
                      {projectRoleLabel(
                        invitation.roleCode,
                        roleLabel(invitation.roleCode, roles),
                        t
                      )}{" "}
                      ·{" "}
                      {invitation.deliveryStatus === "failed"
                        ? t(
                            ($) =>
                              $["features/projects"].invitations.emailFailed
                          )
                        : t(
                            ($) =>
                              $["features/projects"].invitations.awaiting
                          )}
                    </AppText>
                  </View>
                  <View style={{ flexDirection: "row", gap: atomSpacing[2] }}>
                    <AppButton
                      color="neutral"
                      fullWidth={false}
                      isDisabled={
                        cooldown > 0 || resend.isPending || revoke.isPending
                      }
                      loading={resend.isPending}
                      onPress={() => {
                        setSelectedResend(invitation);
                        resendConfirmation.open();
                      }}
                      size="sm"
                      variant="bordered"
                    >
                      {cooldown > 0
                        ? t(
                            ($) =>
                              $["features/projects"].invitations
                                .resendCountdown,
                            { count: cooldown }
                          )
                        : t(
                            ($) =>
                              $["features/projects"].invitations.resend
                          )}
                    </AppButton>
                    <AppButton
                      color="danger"
                      fullWidth={false}
                      isDisabled={resend.isPending || revoke.isPending}
                      loading={revoke.isPending}
                      onPress={() => {
                        setSelected(invitation);
                        confirmation.open();
                      }}
                      size="sm"
                      variant="bordered"
                    >
                      {t(($) => $["features/projects"].invitations.revoke)}
                    </AppButton>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </AppCard>
      <DestructiveConfirmationDialog
        accessibilityLabel={t(
          ($) => $["features/projects"].team.revokeTitle
        )}
        confirmLabel={t(
          ($) => $["features/projects"].invitations.revoke
        )}
        controller={confirmation}
        description={t(
          ($) => $["features/projects"].team.revokeDescription,
          { email: selected?.email ?? "—" }
        )}
        isPending={revoke.isPending}
        onConfirm={confirmRevoke}
        title={t(($) => $["features/projects"].team.revokeTitle)}
      />
      <DestructiveConfirmationDialog
        accessibilityLabel={t(
          ($) => $["features/projects"].team.resendTitle
        )}
        confirmLabel={t(
          ($) => $["features/projects"].invitations.resend
        )}
        controller={resendConfirmation}
        description={t(
          ($) => $["features/projects"].team.resendDescription,
          { email: selectedResend?.email ?? "—" }
        )}
        isPending={resend.isPending}
        onConfirm={confirmResend}
        title={t(($) => $["features/projects"].team.resendTitle)}
      />
    </>
  );
}

function roleLabel(roleCode: string, roles: ProjectRoleOption[]) {
  return roles.find((role) => role.code === roleCode)?.displayName ?? roleCode;
}

function getResendCooldownSeconds(
  invitation: ProjectInvitationSummary,
  now: number
) {
  if (!invitation.lastSentAt) return 0;
  return Math.max(
    0,
    Math.ceil(
      (new Date(invitation.lastSentAt).getTime() + 60_000 - now) / 1_000
    )
  );
}
