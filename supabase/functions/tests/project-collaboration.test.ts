import { renderProjectInvitationEmail } from "../_shared/email/project-invitation.tsx";
import {
  databasePublicMessage,
  requireEmail,
  requireRoleCode,
  requireToken,
  sha256
} from "../project-collaboration/index.ts";

function assertEquals(actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `Expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}.`
    );
  }
}

function assertThrows(fn: () => unknown) {
  try {
    fn();
  } catch {
    return;
  }
  throw new Error("Expected the function to throw.");
}

Deno.test(
  "invitation tokens are stored as deterministic SHA-256 hashes",
  async () => {
    assertEquals(
      await sha256("test-invitation-token"),
      "88637e5197b3379640394d7ec1329166baff5cd624526fd77236c8f7efe49eb9"
    );
  }
);

Deno.test(
  "collaboration inputs normalize emails and validate stable role codes",
  () => {
    assertEquals(requireEmail(" Manager@Example.COM "), "manager@example.com");
    assertEquals(requireRoleCode("site_photographer"), "site_photographer");
    assertEquals(
      requireToken("abcdefghijklmnopqrstuvwxyz123456"),
      "abcdefghijklmnopqrstuvwxyz123456"
    );
    assertThrows(() => requireEmail("provider payload"));
    assertThrows(() => requireRoleCode("Owner Administrator"));
    assertThrows(() => requireToken("short"));
  }
);

Deno.test("database errors expose only approved product messages", () => {
  assertEquals(
    databasePublicMessage({
      message: "Wait before resending this invitation."
    }),
    "Wait before resending this invitation."
  );
  assertEquals(
    databasePublicMessage({ message: "relation secret_table does not exist" }),
    "We couldn't complete that collaboration action. Try again."
  );
});

Deno.test(
  "invitation email links keep raw tokens in the URL fragment",
  async () => {
    const html = await renderProjectInvitationEmail({
      acceptUrl:
        "https://onzait.example/invitations/accept#token=private-token-value",
      expiresAt: "August 4, 2026",
      inviterName: "Project Owner",
      projectName: "River House",
      roleName: "Contributor"
    });

    assertEquals(html.includes("River House"), true);
    assertEquals(html.includes("Contributor"), true);
    assertEquals(
      html.includes(
        "https://onzait.example/invitations/accept#token=private-token-value"
      ),
      true
    );
    assertEquals(
      html.includes("/invitations/accept/private-token-value"),
      false
    );
  }
);
