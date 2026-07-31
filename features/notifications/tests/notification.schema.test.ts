import {
  NotificationEventSchema,
  NotificationSchema,
  parseMarkAllNotificationsReadCount,
  parseNotificationPage,
  parseNotificationReadAt,
  parseNotificationUnreadCount
} from "@/features/notifications/schemas/notification.schema";

const validEvent = {
  actor_display_name_snapshot: "Notification Actor",
  actor_id: "00000000-0000-4000-8000-000000000301",
  category_code: "project.invitations",
  created_at: "2026-07-31T10:00:00.000+00:00",
  destination_kind: "project_invitations",
  event_code: "project.invitation_received",
  id: "30000000-0000-4000-8000-000000000301",
  invitation_id: "20000000-0000-4000-8000-000000000301",
  next_role_code: "manager",
  previous_role_code: null,
  project_id: "10000000-0000-4000-8000-000000000301",
  project_name_snapshot: "Notification Project",
  schema_version: 1,
  source_event_id: "301",
  source_kind: "project.collaboration"
} as const;

describe("notification schema", () => {
  it("accepts matching event and inbox table rows", () => {
    expect(NotificationEventSchema.safeParse(validEvent).success).toBe(true);
    expect(
      NotificationSchema.safeParse({
        archived_at: null,
        created_at: validEvent.created_at,
        event_id: validEvent.id,
        id: "40000000-0000-4000-8000-000000000301",
        read_at: null,
        recipient_id: "00000000-0000-4000-8000-000000000302"
      }).success
    ).toBe(true);
  });

  it("rejects an event with a mismatched category or destination", () => {
    expect(
      NotificationEventSchema.safeParse({
        ...validEvent,
        category_code: "project.team_activity"
      }).success
    ).toBe(false);
    expect(
      NotificationEventSchema.safeParse({
        ...validEvent,
        destination_kind: "project_team"
      }).success
    ).toBe(false);
  });

  it("rejects unsupported versions and extra persisted content", () => {
    expect(
      NotificationEventSchema.safeParse({
        ...validEvent,
        schema_version: 2
      }).success
    ).toBe(false);
    expect(
      NotificationEventSchema.safeParse({
        ...validEvent,
        rendered_copy: "You were invited",
        url: "https://example.com/invitation"
      }).success
    ).toBe(false);
  });

  it("parses a database page into the application notification contract", () => {
    expect(
      parseNotificationPage({
        has_more: true,
        items: [
          {
            actor_display_name: validEvent.actor_display_name_snapshot,
            actor_id: validEvent.actor_id,
            category_code: validEvent.category_code,
            created_at: validEvent.created_at,
            destination_kind: validEvent.destination_kind,
            event_code: validEvent.event_code,
            event_id: validEvent.id,
            id: "40000000-0000-4000-8000-000000000301",
            invitation_id: validEvent.invitation_id,
            next_role_code: validEvent.next_role_code,
            previous_role_code: validEvent.previous_role_code,
            project_id: validEvent.project_id,
            project_name: validEvent.project_name_snapshot,
            read_at: null,
            schema_version: validEvent.schema_version
          }
        ],
        next_cursor: {
          created_at: validEvent.created_at,
          id: "40000000-0000-4000-8000-000000000301"
        }
      })
    ).toEqual({
      hasMore: true,
      items: [
        {
          actorDisplayName: "Notification Actor",
          actorId: validEvent.actor_id,
          categoryCode: "project.invitations",
          createdAt: validEvent.created_at,
          destinationKind: "project_invitations",
          eventCode: "project.invitation_received",
          eventId: validEvent.id,
          id: "40000000-0000-4000-8000-000000000301",
          invitationId: validEvent.invitation_id,
          nextRoleCode: "manager",
          previousRoleCode: null,
          projectId: validEvent.project_id,
          projectName: "Notification Project",
          readAt: null,
          schemaVersion: 1
        }
      ],
      nextCursor: {
        createdAt: validEvent.created_at,
        id: "40000000-0000-4000-8000-000000000301"
      }
    });
  });

  it("rejects inconsistent cursor metadata", () => {
    expect(() =>
      parseNotificationPage({
        has_more: false,
        items: [],
        next_cursor: {
          created_at: validEvent.created_at,
          id: "40000000-0000-4000-8000-000000000301"
        }
      })
    ).toThrow();
  });

  it("parses unread, read timestamp, and mark-all RPC results", () => {
    expect(parseNotificationUnreadCount("4")).toBe(4);
    expect(parseMarkAllNotificationsReadCount(3)).toBe(3);
    expect(parseNotificationReadAt(validEvent.created_at)).toBe(
      validEvent.created_at
    );
    expect(parseNotificationReadAt(null)).toBeNull();
  });
});
