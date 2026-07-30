import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  render,
  Section,
  Text,
} from "react-email";
import { createEmailTranslator, type EmailLanguage } from "./localization.ts";

export type SupportedAuthEmailAction = "recovery" | "signup";

const styles = {
  body: {
    backgroundColor: "#fbf9f8",
    color: "#1b1c1c",
    fontFamily:
      "Geist, Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    margin: "0",
    padding: "0",
  },
  card: {
    backgroundColor: "#ffffff",
    border: "1px solid #e4e2e2",
    borderRadius: "18px",
    padding: "32px",
  },
  cta: {
    backgroundColor: "#0055ff",
    borderRadius: "12px",
    color: "#ffffff",
    display: "inline-block",
    fontSize: "15px",
    fontWeight: "700",
    padding: "14px 18px",
    textDecoration: "none",
  },
  footer: {
    color: "#737688",
    fontSize: "12px",
    lineHeight: "1.5",
    margin: "20px 0 0",
    textAlign: "center" as const,
  },
  heading: {
    color: "#121212",
    fontSize: "28px",
    fontWeight: "800",
    lineHeight: "1.18",
    margin: "0 0 16px",
  },
  meta: {
    color: "#737688",
    fontSize: "13px",
    lineHeight: "1.5",
    margin: "0 0 8px",
  },
  page: { margin: "0 auto", maxWidth: "560px", padding: "40px 20px" },
  paragraph: {
    color: "#434656",
    fontSize: "16px",
    lineHeight: "1.6",
    margin: "0 0 24px",
  },
  url: {
    color: "#434656",
    fontSize: "12px",
    lineHeight: "1.5",
    margin: "0",
    wordBreak: "break-all" as const,
  },
};

function AuthEmail({
  actionUrl,
  language,
  strings,
}: {
  actionUrl: string;
  language: EmailLanguage;
  strings: {
    cta: string;
    eyebrow: string;
    fallbackLink: string;
    footer: string;
    heading: string;
    paragraph: string;
    preview: string;
  };
}) {
  return (
    <Html lang={language}>
      <Head />
      <Preview>{strings.preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.page}>
          <Text style={styles.meta}>ONZAIT</Text>
          <Section style={styles.card}>
            <Text style={styles.meta}>{strings.eyebrow}</Text>
            <Heading as="h1" style={styles.heading}>
              {strings.heading}
            </Heading>
            <Text style={styles.paragraph}>{strings.paragraph}</Text>
            <Section style={{ margin: "28px 0", textAlign: "center" }}>
              <Link href={actionUrl} style={styles.cta}>
                {strings.cta}
              </Link>
            </Section>
            <Hr style={{ borderColor: "#efeded", margin: "28px 0 20px" }} />
            <Text style={styles.meta}>{strings.fallbackLink}</Text>
            <Text style={styles.url}>{actionUrl}</Text>
          </Section>
          <Text style={styles.footer}>{strings.footer}</Text>
        </Container>
      </Body>
    </Html>
  );
}

export async function buildAuthEmail(input: {
  action: SupportedAuthEmailAction;
  actionUrl: string;
  language: unknown;
}) {
  const { language, t } = await createEmailTranslator(input.language);
  const prefix = input.action === "signup"
    ? "auth.confirmation"
    : "auth.recovery";
  const strings = {
    cta: t(`${prefix}.cta`),
    eyebrow: t(`${prefix}.eyebrow`),
    fallbackLink: t("common.fallbackLink"),
    footer: t("auth.footer"),
    heading: t(`${prefix}.heading`),
    paragraph: t(`${prefix}.paragraph`),
    preview: t(`${prefix}.preview`),
  };

  return {
    html: await render(
      <AuthEmail
        actionUrl={input.actionUrl}
        language={language}
        strings={strings}
      />,
    ),
    subject: t(`${prefix}.subject`),
  };
}
