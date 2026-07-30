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

type WelcomeToOnzaitEmailProps = {
  appUrl: string;
  language: EmailLanguage;
  strings: {
    cta: string;
    eyebrow: string;
    fallbackLink: string;
    footer: string;
    heading: string;
    paragraph: string;
    preview: string;
    secondParagraph: string;
  };
};

const body = {
  backgroundColor: "#fbf9f8",
  color: "#1b1c1c",
  fontFamily:
    "Geist, Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  margin: "0",
  padding: "0",
};

const page = {
  margin: "0 auto",
  maxWidth: "560px",
  padding: "40px 20px",
};

const wordmark = {
  color: "#737688",
  fontFamily: "'JetBrains Mono', 'SFMono-Regular', Consolas, monospace",
  fontSize: "12px",
  letterSpacing: "0.08em",
  margin: "0 0 20px",
  textTransform: "uppercase" as const,
};

const card = {
  backgroundColor: "#ffffff",
  border: "1px solid #e4e2e2",
  borderRadius: "18px",
  padding: "32px",
};

const eyebrow = {
  color: "#0055ff",
  fontFamily: "'JetBrains Mono', 'SFMono-Regular', Consolas, monospace",
  fontSize: "12px",
  letterSpacing: "0.08em",
  margin: "0 0 12px",
  textTransform: "uppercase" as const,
};

const heading = {
  color: "#121212",
  fontSize: "28px",
  fontWeight: "800",
  lineHeight: "1.18",
  margin: "0 0 16px",
};

const paragraph = {
  color: "#434656",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 18px",
};

const ctaWrap = {
  margin: "28px 0 0",
  textAlign: "center" as const,
};

const cta = {
  backgroundColor: "#0055ff",
  borderRadius: "12px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "15px",
  fontWeight: "700",
  padding: "14px 18px",
  textDecoration: "none",
};

const divider = {
  borderColor: "#efeded",
  margin: "28px 0 20px",
};

const fallbackLabel = {
  color: "#737688",
  fontSize: "13px",
  lineHeight: "1.5",
  margin: "0 0 8px",
};

const fallbackUrl = {
  color: "#434656",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: "0",
  wordBreak: "break-all" as const,
};

const footer = {
  color: "#737688",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: "20px 0 0",
  textAlign: "center" as const,
};

export function WelcomeToOnzaitEmail({
  appUrl,
  language,
  strings,
}: WelcomeToOnzaitEmailProps) {
  return (
    <Html lang={language}>
      <Head />
      <Preview>{strings.preview}</Preview>
      <Body style={body}>
        <Container style={page}>
          <Text style={wordmark}>onzait</Text>

          <Section style={card}>
            <Text style={eyebrow}>{strings.eyebrow}</Text>

            <Heading as="h1" style={heading}>
              {strings.heading}
            </Heading>

            <Text style={paragraph}>
              {strings.paragraph}
            </Text>

            <Text style={{ ...paragraph, marginBottom: "24px" }}>
              {strings.secondParagraph}
            </Text>

            <Section style={ctaWrap}>
              <Link href={appUrl} style={cta}>
                {strings.cta}
              </Link>
            </Section>

            <Hr style={divider} />

            <Text style={fallbackLabel}>
              {strings.fallbackLink}
            </Text>
            <Text style={fallbackUrl}>{appUrl}</Text>
          </Section>

          <Text style={footer}>
            {strings.footer}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export async function buildWelcomeToOnzaitEmail(input: {
  appUrl: string;
  language: unknown;
  name: string;
}) {
  const { language, t } = await createEmailTranslator(input.language);
  const strings = {
    cta: t("welcome.cta"),
    eyebrow: t("welcome.eyebrow"),
    fallbackLink: t("common.fallbackLink"),
    footer: t("welcome.footer"),
    heading: t("welcome.heading", { name: input.name }),
    paragraph: t("welcome.paragraph"),
    preview: t("welcome.preview"),
    secondParagraph: t("welcome.secondParagraph"),
  };

  return {
    html: await render(
      <WelcomeToOnzaitEmail
        appUrl={input.appUrl}
        language={language}
        strings={strings}
      />,
    ),
    subject: t("welcome.subject"),
  };
}
