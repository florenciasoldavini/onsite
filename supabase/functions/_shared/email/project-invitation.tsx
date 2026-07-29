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
  Text
} from "react-email";

export type ProjectInvitationEmailProps = {
  acceptUrl: string;
  expiresAt: string;
  inviterName: string;
  projectName: string;
  roleName: string;
};

const styles = {
  body: {
    backgroundColor: "#fbf9f8",
    color: "#1b1c1c",
    fontFamily:
      "Geist, Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    margin: "0",
    padding: "0"
  },
  page: { margin: "0 auto", maxWidth: "560px", padding: "40px 20px" },
  wordmark: {
    color: "#737688",
    fontFamily: "'JetBrains Mono', 'SFMono-Regular', Consolas, monospace",
    fontSize: "12px",
    letterSpacing: "0.08em",
    margin: "0 0 20px",
    textTransform: "uppercase" as const
  },
  card: {
    backgroundColor: "#ffffff",
    border: "1px solid #e4e2e2",
    borderRadius: "18px",
    padding: "32px"
  },
  eyebrow: {
    color: "#0055ff",
    fontFamily: "'JetBrains Mono', 'SFMono-Regular', Consolas, monospace",
    fontSize: "12px",
    letterSpacing: "0.08em",
    margin: "0 0 12px",
    textTransform: "uppercase" as const
  },
  heading: {
    color: "#121212",
    fontSize: "28px",
    fontWeight: "800",
    lineHeight: "1.18",
    margin: "0 0 16px"
  },
  paragraph: {
    color: "#434656",
    fontSize: "16px",
    lineHeight: "1.6",
    margin: "0 0 18px"
  },
  ctaWrap: { margin: "28px 0 0", textAlign: "center" as const },
  cta: {
    backgroundColor: "#0055ff",
    borderRadius: "12px",
    color: "#ffffff",
    display: "inline-block",
    fontSize: "15px",
    fontWeight: "700",
    padding: "14px 18px",
    textDecoration: "none"
  },
  meta: {
    color: "#737688",
    fontSize: "13px",
    lineHeight: "1.5",
    margin: "8px 0 0"
  },
  divider: { borderColor: "#efeded", margin: "28px 0 20px" },
  url: {
    color: "#434656",
    fontSize: "12px",
    lineHeight: "1.5",
    margin: "0",
    wordBreak: "break-all" as const
  }
};

export function ProjectInvitationEmail({
  acceptUrl,
  expiresAt,
  inviterName,
  projectName,
  roleName
}: ProjectInvitationEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>
        {inviterName} invited you to collaborate on {projectName}.
      </Preview>
      <Body style={styles.body}>
        <Container style={styles.page}>
          <Text style={styles.wordmark}>onzait</Text>
          <Section style={styles.card}>
            <Text style={styles.eyebrow}>Project invitation</Text>
            <Heading as="h1" style={styles.heading}>
              Join {projectName}
            </Heading>
            <Text style={styles.paragraph}>
              {inviterName} invited you to collaborate as {roleName}.
            </Text>
            <Text style={styles.meta}>
              This invitation expires {expiresAt}.
            </Text>
            <Section style={styles.ctaWrap}>
              <Link href={acceptUrl} style={styles.cta}>
                Review invitation
              </Link>
            </Section>
            <Hr style={styles.divider} />
            <Text style={styles.meta}>
              If the button does not work, copy and paste this link:
            </Text>
            <Text style={styles.url}>{acceptUrl}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export function renderProjectInvitationEmail(
  input: ProjectInvitationEmailProps
) {
  return render(<ProjectInvitationEmail {...input} />);
}
