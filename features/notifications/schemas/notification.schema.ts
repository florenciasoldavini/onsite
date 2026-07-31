import {
  NOTIFICATION_CATEGORY_CODES,
  NOTIFICATION_DESTINATION_KINDS,
  NOTIFICATION_EVENT_CODES
} from "@/features/notifications/constants/notification.constants";
import type {
  NotificationEventRow,
  NotificationItem,
  NotificationPage,
  NotificationRow
} from "@/features/notifications/types/notification";
import { z } from "zod";

const databaseTimestampSchema = z.iso.datetime({
  local: true,
  offset: true
});
const roleCodeSchema = z.string().regex(/^[a-z][a-z0-9_]{1,39}$/);
const eventCodeSchema = z.enum(NOTIFICATION_EVENT_CODES);
const categoryCodeSchema = z.enum(NOTIFICATION_CATEGORY_CODES);
const destinationKindSchema = z.enum(NOTIFICATION_DESTINATION_KINDS);

interface EventContractShape {
  category_code: string;
  destination_kind: string;
  event_code: string;
  invitation_id: string | null;
  next_role_code: string | null;
  previous_role_code: string | null;
}

function matchesEventContract(value: EventContractShape) {
  switch (value.event_code) {
    case "project.invitation_received":
      return (
        value.category_code === "project.invitations" &&
        value.destination_kind === "project_invitations" &&
        value.invitation_id !== null &&
        value.previous_role_code === null &&
        value.next_role_code !== null
      );
    case "project.invitation_accepted":
    case "project.invitation_declined":
      return (
        value.category_code === "project.invitations" &&
        value.destination_kind === "project_team" &&
        value.invitation_id !== null &&
        value.previous_role_code === null &&
        value.next_role_code !== null
      );
    case "project.member_role_changed":
      return (
        value.category_code === "project.team_activity" &&
        value.destination_kind === "project_team" &&
        value.invitation_id === null &&
        value.previous_role_code !== null &&
        value.next_role_code !== null &&
        value.previous_role_code !== value.next_role_code
      );
    case "project.member_removed":
      return (
        value.category_code === "project.team_activity" &&
        value.destination_kind === "none" &&
        value.invitation_id === null &&
        value.previous_role_code !== null &&
        value.next_role_code === null
      );
    case "project.member_left":
      return (
        value.category_code === "project.team_activity" &&
        value.destination_kind === "project_team" &&
        value.invitation_id === null &&
        value.previous_role_code !== null &&
        value.next_role_code === null
      );
    default:
      return false;
  }
}

function validateEventContract(
  value: EventContractShape,
  context: z.RefinementCtx
) {
  if (!matchesEventContract(value)) {
    context.addIssue({
      code: "custom",
      message: "The notification event contract is invalid."
    });
  }
}

const eventContractFields = {
  actor_display_name_snapshot: z.string().trim().min(1).max(240),
  actor_id: z.uuid(),
  category_code: categoryCodeSchema,
  destination_kind: destinationKindSchema,
  event_code: eventCodeSchema,
  invitation_id: z.uuid().nullable(),
  next_role_code: roleCodeSchema.nullable(),
  previous_role_code: roleCodeSchema.nullable(),
  project_id: z.uuid(),
  project_name_snapshot: z.string().trim().min(1).max(160),
  schema_version: z.literal(1)
} as const;

export const NotificationEventSchema: z.ZodType<NotificationEventRow> = z
  .object({
    ...eventContractFields,
    created_at: databaseTimestampSchema,
    id: z.uuid(),
    source_event_id: z.string().trim().min(1).max(200),
    source_kind: z.string().regex(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/)
  })
  .strict()
  .superRefine(validateEventContract);

export const NotificationSchema: z.ZodType<NotificationRow> = z
  .object({
    archived_at: databaseTimestampSchema.nullable(),
    created_at: databaseTimestampSchema,
    event_id: z.uuid(),
    id: z.uuid(),
    read_at: databaseTimestampSchema.nullable(),
    recipient_id: z.uuid()
  })
  .strict();

const notificationItemSchema = z
  .object({
    ...eventContractFields,
    actor_display_name: eventContractFields.actor_display_name_snapshot,
    created_at: databaseTimestampSchema,
    event_id: z.uuid(),
    id: z.uuid(),
    project_name: eventContractFields.project_name_snapshot,
    read_at: databaseTimestampSchema.nullable()
  })
  .omit({
    actor_display_name_snapshot: true,
    project_name_snapshot: true
  })
  .strict()
  .superRefine(validateEventContract);

const notificationCursorSchema = z
  .object({
    created_at: databaseTimestampSchema,
    id: z.uuid()
  })
  .strict();

const notificationPageSchema = z
  .object({
    has_more: z.boolean(),
    items: z.array(notificationItemSchema),
    next_cursor: notificationCursorSchema.nullable()
  })
  .strict()
  .superRefine((value, context) => {
    if (value.has_more !== (value.next_cursor !== null)) {
      context.addIssue({
        code: "custom",
        message: "The notification page cursor is inconsistent."
      });
    }
  });

export function parseNotificationPage(value: unknown): NotificationPage {
  const result = notificationPageSchema.parse(value);

  return {
    hasMore: result.has_more,
    items: result.items.map(
      (item): NotificationItem => ({
        actorDisplayName: item.actor_display_name,
        actorId: item.actor_id,
        categoryCode: item.category_code,
        createdAt: item.created_at,
        destinationKind: item.destination_kind,
        eventCode: item.event_code,
        eventId: item.event_id,
        id: item.id,
        invitationId: item.invitation_id,
        nextRoleCode: item.next_role_code,
        previousRoleCode: item.previous_role_code,
        projectId: item.project_id,
        projectName: item.project_name,
        readAt: item.read_at,
        schemaVersion: item.schema_version
      })
    ),
    nextCursor: result.next_cursor
      ? {
          createdAt: result.next_cursor.created_at,
          id: result.next_cursor.id
        }
      : null
  };
}

const nonnegativeIntegerSchema = z
  .union([z.number(), z.string().regex(/^\d+$/)])
  .transform(Number)
  .pipe(z.number().int().nonnegative().safe());

export function parseNotificationUnreadCount(value: unknown) {
  return nonnegativeIntegerSchema.parse(value);
}

export function parseMarkAllNotificationsReadCount(value: unknown) {
  return nonnegativeIntegerSchema.parse(value);
}

export function parseNotificationReadAt(value: unknown) {
  return databaseTimestampSchema.nullable().parse(value);
}
