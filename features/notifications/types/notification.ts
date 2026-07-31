import type {
  NOTIFICATION_CATEGORY_CODES,
  NOTIFICATION_DESTINATION_KINDS,
  NOTIFICATION_EVENT_CODES
} from "@/features/notifications/constants/notification.constants";

export type NotificationEventCode = (typeof NOTIFICATION_EVENT_CODES)[number];
export type NotificationCategoryCode =
  (typeof NOTIFICATION_CATEGORY_CODES)[number];
export type NotificationDestinationKind =
  (typeof NOTIFICATION_DESTINATION_KINDS)[number];
export type NotificationSchemaVersion = 1;

export interface NotificationEventRow {
  actor_display_name_snapshot: string;
  actor_id: string;
  category_code: NotificationCategoryCode;
  created_at: string;
  destination_kind: NotificationDestinationKind;
  event_code: NotificationEventCode;
  id: string;
  invitation_id: string | null;
  next_role_code: string | null;
  previous_role_code: string | null;
  project_id: string;
  project_name_snapshot: string;
  schema_version: NotificationSchemaVersion;
  source_event_id: string;
  source_kind: string;
}

export interface NotificationRow {
  archived_at: string | null;
  created_at: string;
  event_id: string;
  id: string;
  read_at: string | null;
  recipient_id: string;
}

export interface NotificationItem {
  actorDisplayName: string;
  actorId: string;
  categoryCode: NotificationCategoryCode;
  createdAt: string;
  destinationKind: NotificationDestinationKind;
  eventCode: NotificationEventCode;
  eventId: string;
  id: string;
  invitationId: string | null;
  nextRoleCode: string | null;
  previousRoleCode: string | null;
  projectId: string;
  projectName: string;
  readAt: string | null;
  schemaVersion: NotificationSchemaVersion;
}

export interface NotificationCursor {
  createdAt: string;
  id: string;
}

export interface NotificationPage {
  hasMore: boolean;
  items: NotificationItem[];
  nextCursor: NotificationCursor | null;
}
