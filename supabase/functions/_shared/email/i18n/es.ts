const es = {
  common: {
    fallbackLink:
      "Si el botón no funciona, copiá y pegá este enlace en el navegador:",
    utc: "UTC",
    wordmark: "onzait",
  },
  invitation: {
    cta: "Revisar invitación",
    eyebrow: "Invitación al proyecto",
    expires: "Esta invitación vence el {{expiresAt}} (UTC).",
    fallbackInviter: "La persona responsable del proyecto",
    fallbackProject: "un proyecto de Onzait",
    footer:
      "Recibís este correo porque {{inviterName}} invitó a esta dirección a un proyecto de Onzait.",
    heading: "Sumate a {{projectName}}",
    paragraph: "{{inviterName}} te invitó a colaborar con el rol {{roleName}}.",
    preview: "{{inviterName}} te invitó a colaborar en {{projectName}}.",
    roles: {
      collaborator: "Colaborador",
      manager: "Responsable",
      member: "Miembro",
      owner: "Propietario",
      viewer: "Observador",
    },
    subject: "Invitación para colaborar en {{projectName}}",
  },
  auth: {
    confirmation: {
      cta: "Confirmar correo",
      eyebrow: "Confirmá tu correo",
      heading: "Terminá de crear tu cuenta de Onzait",
      paragraph:
        "Confirmá esta dirección de correo para activar la cuenta y continuar a Onzait.",
      preview: "Confirmá tu dirección de correo para Onzait.",
      subject: "Confirmá tu correo de Onzait",
    },
    recovery: {
      cta: "Restablecer contraseña",
      eyebrow: "Recuperación de contraseña",
      heading: "Restablecé tu contraseña de Onzait",
      paragraph:
        "Usá este enlace seguro para elegir una nueva contraseña para tu cuenta de Onzait.",
      preview: "Restablecé tu contraseña de Onzait.",
      subject: "Restablecé tu contraseña de Onzait",
    },
    footer:
      "Si no solicitaste este correo, podés ignorarlo. El enlace vencerá automáticamente.",
  },
  welcome: {
    cta: "Abrir Onzait",
    eyebrow: "Bienvenida",
    fallbackName: "hola",
    footer:
      "Recibís este correo porque se solicitó un mensaje de bienvenida para tu cuenta de Onzait.",
    heading: "Te damos la bienvenida a Onzait, {{name}}",
    paragraph:
      "Tu espacio de trabajo está listo. Onzait reúne proyectos, novedades de obra y coordinación con clientes en un solo lugar.",
    preview: "Te damos la bienvenida a Onzait. Tu espacio está listo.",
    secondParagraph:
      "Empezá por revisar el panel de proyectos y agregar los datos que el equipo necesita para avanzar con confianza.",
    subject: "Te damos la bienvenida a Onzait",
  },
} as const;

export default es;
