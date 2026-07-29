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
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";

export function InviteMemberCard({
  projectId,
  roles
}: {
  projectId: string;
  roles: ProjectRoleOption[];
}) {
  const inviteMutation = useInviteProjectMember(projectId);
  const toast = useAppToast();
  const defaultRole = roles[0]?.code ?? "";
  const form = useForm<ProjectInviteInput>({
    defaultValues: { email: "", roleCode: defaultRole },
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
      form.reset({ email: "", roleCode: defaultRole });
      toast.show({
        description: `An invitation was sent to ${values.email}.`,
        title: "Invitation sent",
        tone: "success"
      });
    } catch (error) {
      form.setError("root", {
        message: getUserFacingErrorMessage(
          error,
          "We couldn't send this invitation. Try again."
        )
      });
    }
  });

  return (
    <AppCard padding="lg">
      <View style={{ gap: atomSpacing[4] }}>
        <AppHeading variant="section">Invite a member</AppHeading>
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <TextField
              autoCapitalize="none"
              errorText={fieldState.error?.message}
              keyboardType="email-address"
              label="Email address"
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
              label="Project role"
              onChange={field.onChange}
              options={roles.map((role) => ({
                label: role.displayName,
                value: role.code
              }))}
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
          Send invitation
        </AppButton>
      </View>
    </AppCard>
  );
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
          "We couldn't remove this project member. Try again."
        )
      );
    }
  };

  return (
    <>
      <AppCard padding="lg">
        <View style={{ gap: atomSpacing[4] }}>
          <AppHeading variant="section">Active members</AppHeading>
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
                      label="Role"
                      onChange={(roleCode) =>
                        updateRole.mutate({
                          membershipId: member.id,
                          roleCode
                        })
                      }
                      options={roles.map((role) => ({
                        label: role.displayName,
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
                    {isOwner ? "Owner" : roleLabel(member.roleCode, roles)}
                  </AppText>
                )}
              </View>
            );
          })}
          {updateRole.isError ? (
            <AppText selectable tone="danger">
              {getUserFacingErrorMessage(
                updateRole.error,
                "We couldn't change this member's role. Try again."
              )}
            </AppText>
          ) : null}
        </View>
      </AppCard>
      <DestructiveConfirmationDialog
        accessibilityLabel="Close remove member confirmation"
        confirmLabel="Remove"
        controller={confirmation}
        description={`${selected?.firstName ?? "This member"} will immediately lose access to the project.`}
        isPending={removeMember.isPending}
        onConfirm={confirmRemoval}
        title="Remove project member?"
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
          "We couldn't revoke this invitation. Try again."
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
          "We couldn't resend this invitation. Try again."
        )
      );
    }
  };

  return (
    <>
      <AppCard padding="lg">
        <View style={{ gap: atomSpacing[4] }}>
          <AppHeading variant="section">Pending invitations</AppHeading>
          {resend.isError ? (
            <AppText selectable tone="danger">
              {getUserFacingErrorMessage(
                resend.error,
                "We couldn't resend this invitation. Try again."
              )}
            </AppText>
          ) : null}
          {pending.length === 0 ? (
            <EmptyState
              description="New invitations will appear here until they are accepted or declined."
              icon={UserIcon}
              title="No pending invitations"
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
                      {roleLabel(invitation.roleCode, roles)} ·{" "}
                      {invitation.deliveryStatus === "failed"
                        ? "Email failed"
                        : "Awaiting response"}
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
                      {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend"}
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
                      Revoke
                    </AppButton>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </AppCard>
      <DestructiveConfirmationDialog
        accessibilityLabel="Close revoke invitation confirmation"
        confirmLabel="Revoke"
        controller={confirmation}
        description={`The invitation for ${selected?.email ?? "this person"} will stop working immediately.`}
        isPending={revoke.isPending}
        onConfirm={confirmRevoke}
        title="Revoke invitation?"
      />
      <DestructiveConfirmationDialog
        accessibilityLabel="Close resend invitation confirmation"
        confirmLabel="Resend"
        controller={resendConfirmation}
        description={`A new invitation email will be sent to ${selectedResend?.email ?? "this person"}, and their previous link will stop working.`}
        isPending={resend.isPending}
        onConfirm={confirmResend}
        title="Resend invitation?"
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
