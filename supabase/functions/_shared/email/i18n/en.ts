const en = {
  common: {
    fallbackLink:
      "If the button does not work, copy and paste this link into your browser:",
    utc: "UTC",
    wordmark: "onzait",
  },
  invitation: {
    cta: "Review invitation",
    eyebrow: "Project invitation",
    expires: "This invitation expires {{expiresAt}} (UTC).",
    fallbackInviter: "A project owner",
    fallbackProject: "an Onzait project",
    footer:
      "You are receiving this because {{inviterName}} invited this address to an Onzait project.",
    heading: "Join {{projectName}}",
    paragraph: "{{inviterName}} invited you to collaborate as {{roleName}}.",
    preview: "{{inviterName}} invited you to collaborate on {{projectName}}.",
    roles: {
      collaborator: "Collaborator",
      manager: "Manager",
      member: "Member",
      owner: "Owner",
      viewer: "Viewer",
    },
    subject: "You're invited to {{projectName}}",
  },
  auth: {
    confirmation: {
      cta: "Confirm email",
      eyebrow: "Confirm your email",
      heading: "Finish creating your Onzait account",
      paragraph:
        "Confirm this email address to activate your account and continue to Onzait.",
      preview: "Confirm your email address for Onzait.",
      subject: "Confirm your Onzait email",
    },
    recovery: {
      cta: "Reset password",
      eyebrow: "Password recovery",
      heading: "Reset your Onzait password",
      paragraph:
        "Use this secure link to choose a new password for your Onzait account.",
      preview: "Reset your Onzait password.",
      subject: "Reset your Onzait password",
    },
    footer:
      "If you did not request this email, you can ignore it. The link will expire automatically.",
  },
  welcome: {
    cta: "Open Onzait",
    eyebrow: "Welcome",
    fallbackName: "there",
    footer:
      "You are receiving this because a welcome email was requested for your Onzait account.",
    heading: "Welcome to Onzait, {{name}}",
    paragraph:
      "Your workspace is ready. Onzait keeps projects, job-site updates, and client coordination in one structured place.",
    preview: "Welcome to Onzait. Your workspace is ready.",
    secondParagraph:
      "Start by checking your project dashboard and adding the details your team needs to move with confidence.",
    subject: "Welcome to Onzait",
  },
} as const;

export default en;
