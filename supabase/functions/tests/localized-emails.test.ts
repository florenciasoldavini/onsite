import { buildAuthEmail } from "../_shared/email/auth-email.tsx";
import { buildProjectInvitationEmail } from "../_shared/email/project-invitation.tsx";
import { buildWelcomeToOnzaitEmail } from "../_shared/email/welcome-to-onzait.tsx";
import { resolveEmailLanguage } from "../_shared/email/localization.ts";
import emailEn from "../_shared/email/i18n/en.ts";
import emailEs from "../_shared/email/i18n/es.ts";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

Deno.test("email language validation defaults missing and invalid values to Spanish", () => {
  assert(
    resolveEmailLanguage(undefined) === "es",
    "Missing language must use Spanish.",
  );
  assert(
    resolveEmailLanguage("pt") === "es",
    "Unsupported language must use Spanish.",
  );
  assert(resolveEmailLanguage("en") === "en", "English must remain supported.");
});

Deno.test("email resources keep key, plural, blank, and interpolation parity", () => {
  const english = flatten(emailEn);
  const spanish = flatten(emailEs);
  assert(
    JSON.stringify([...english.keys()]) === JSON.stringify([...spanish.keys()]),
    "Email resource keys or plural variants differ.",
  );

  for (const [key, englishValue] of english) {
    const spanishValue = spanish.get(key) ?? "";
    assert(
      englishValue.trim().length > 0,
      `English email value is blank: ${key}`,
    );
    assert(
      spanishValue.trim().length > 0,
      `Spanish email value is blank: ${key}`,
    );
    assert(
      JSON.stringify(interpolations(englishValue)) ===
        JSON.stringify(interpolations(spanishValue)),
      `Email interpolation values differ: ${key}`,
    );
  }
});

Deno.test("welcome email renders complete Spanish and English variants", async () => {
  const [spanish, english] = await Promise.all([
    buildWelcomeToOnzaitEmail({
      appUrl: "https://onzait.example",
      language: "es",
      name: "Florencia",
    }),
    buildWelcomeToOnzaitEmail({
      appUrl: "https://onzait.example",
      language: "en",
      name: "Florencia",
    }),
  ]);

  assert(
    spanish.html.includes('lang="es"'),
    "Spanish HTML language is missing.",
  );
  assert(
    english.html.includes('lang="en"'),
    "English HTML language is missing.",
  );
  assert(
    spanish.subject !== english.subject,
    "Welcome subjects must be localized.",
  );
  assert(
    spanish.html.includes("Florencia"),
    "The recipient name must be preserved.",
  );
  assert(
    english.html.includes("Florencia"),
    "The recipient name must be preserved.",
  );
});

Deno.test("project invitations localize roles and UTC expiry without changing user data", async () => {
  const invitation = await buildProjectInvitationEmail({
    acceptUrl: "https://onzait.example/invitations/accept#token=secret",
    expiresAt: "2026-08-04T15:30:00.000Z",
    inviterName: "María",
    language: "es",
    projectName: "River House",
    roleCode: "collaborator",
  });

  assert(
    invitation.html.includes('lang="es"'),
    "Spanish HTML language is missing.",
  );
  assert(
    invitation.html.includes("Colaborador"),
    "Stable role code was not translated.",
  );
  assert(
    invitation.html.includes("River House"),
    "Project name must remain unchanged.",
  );
  assert(
    invitation.html.includes("UTC"),
    "Email expiry must state its time zone.",
  );
  assert(
    invitation.html.includes("#token=secret"),
    "Token fragment must remain intact.",
  );
});

Deno.test("confirmation and recovery emails localize trusted action links", async () => {
  const confirmation = await buildAuthEmail({
    action: "signup",
    actionUrl:
      "https://project.supabase.co/auth/v1/verify?token=hash&type=signup",
    language: "es",
  });
  const recovery = await buildAuthEmail({
    action: "recovery",
    actionUrl:
      "https://project.supabase.co/auth/v1/verify?token=hash&type=recovery",
    language: "en",
  });

  assert(
    confirmation.html.includes('lang="es"'),
    "Confirmation language is missing.",
  );
  assert(recovery.html.includes('lang="en"'), "Recovery language is missing.");
  assert(
    confirmation.html.includes("token=hash"),
    "Confirmation link was not rendered.",
  );
  assert(
    recovery.html.includes("token=hash"),
    "Recovery link was not rendered.",
  );
});

function flatten(
  value: Record<string, unknown>,
  prefix = "",
): Map<string, string> {
  const entries = Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof child === "string"
      ? [[path, child] as const]
      : [...flatten(child as Record<string, unknown>, path).entries()];
  });
  return new Map(entries.sort(([left], [right]) => left.localeCompare(right)));
}

function interpolations(value: string) {
  return [...value.matchAll(/\{\{\s*([^},\s]+).*?\}\}/g)]
    .map((match) => match[1])
    .sort();
}
