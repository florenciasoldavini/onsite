export const NOTIFICATION_EVENT_CODES = [
  "project.invitation_received",
  "project.invitation_accepted",
  "project.invitation_declined",
  "project.member_role_changed",
  "project.member_removed",
  "project.member_left"
] as const;

export const NOTIFICATION_CATEGORY_CODES = [
  "project.invitations",
  "project.team_activity"
] as const;

export const NOTIFICATION_DESTINATION_KINDS = [
  "project_invitations",
  "project_team",
  "none"
] as const;
