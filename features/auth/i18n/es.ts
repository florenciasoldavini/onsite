export default {
  callback: {
    backProfile: "Volver al perfil",
    backSignIn: "Volver al inicio de sesión",
    descriptionLink:
      "Volvé de forma segura a tu perfil mientras se confirma el nuevo método de inicio de sesión.",
    descriptionSignIn:
      "Estamos completando la redirección de forma segura mientras finaliza la sesión.",
    eyebrow: "Autenticación / Redirección",
    failureLink: "No pudimos terminar de vincular tu cuenta.",
    failureLinkAction:
      "No pudimos vincular este método de inicio de sesión. Volvé a tu perfil e intentá de nuevo.",
    failureSignIn: "No pudimos completar la redirección de inicio de sesión.",
    failureSignInAction:
      "No pudimos iniciar tu sesión. Volvé al inicio de sesión e intentá de nuevo.",
    linking: "Vinculando {{provider}}",
    loading: "Completando el acceso seguro…",
    panelTag: "Autenticación / Redirección",
    resolution: "Redirección / Resolución de sesión",
    signingIn: "Iniciando sesión",
    status: "ESTADO / REDIRECCIÓN EN CURSO / ESPERANDO CONFIRMACIÓN",
    title: "Completando el acceso"
  },
  common: {
    apple: "Continuar con Apple",
    email: "Correo electrónico",
    google: "Continuar con Google",
    password: "Contraseña",
    passwordHint:
      "Usá 8 o más caracteres, una mayúscula, un número y un símbolo."
  },
  errors: {
    accountLoad:
      "No pudimos cargar tu cuenta. Revisá tu conexión e intentá de nuevo.",
    accountSetup:
      "No pudimos terminar de configurar tu cuenta. Cerrá sesión, volvé a ingresar e intentá de nuevo.",
    dataService:
      "La aplicación no está conectada al servicio de datos. Intentá de nuevo más tarde.",
    oauthStart: "No pudimos iniciar ese método de acceso. Intentá de nuevo.",
    oauthStartSignUp:
      "No pudimos iniciar ese método de registro. Intentá de nuevo.",
    profileUpdate:
      "No pudimos actualizar tu perfil. Revisá tu conexión e intentá de nuevo.",
    sessionRestore:
      "No pudimos restaurar tu sesión. Iniciá sesión e intentá de nuevo.",
    signIn:
      "No pudimos iniciar tu sesión. Revisá los datos e intentá de nuevo.",
    signOut:
      "No pudimos cerrar tu sesión. Revisá tu conexión e intentá de nuevo.",
    signUp: "No pudimos crear tu cuenta. Revisá los datos e intentá de nuevo."
  },
  reset: {
    confirmPassword: "Confirmar contraseña",
    descriptionRequest: "Solicitá un enlace seguro para restablecerla.",
    descriptionUpdate: "Definí una nueva contraseña para tu cuenta.",
    emailHint: "Ingresá el correo electrónico asociado a tu cuenta.",
    invalidLink:
      "No pudimos abrir este enlace de recuperación. Solicitá uno nuevo e intentá de nuevo.",
    newPassword: "Nueva contraseña",
    panelRequest: "Recuperación / Solicitud",
    panelUpdate: "Recuperación / Actualización",
    prompt: "¿Recordaste tu contraseña?",
    requestAction: "Enviar enlace",
    requestError:
      "No pudimos enviar el correo para restablecer la contraseña. Intentá de nuevo.",
    returnSignIn: "Volver al inicio de sesión",
    titleRequest: "Restablecer contraseña",
    titleUpdate: "Actualizar contraseña",
    updateAction: "Actualizar contraseña",
    updateError: "No pudimos actualizar tu contraseña. Intentá de nuevo."
  },
  shell: {
    defaultPanelTag: "Acceso / Portal de obra"
  },
  signIn: {
    action: "Iniciar sesión",
    createAccount: "Crear una cuenta",
    description: "Accedé a tu espacio de trabajo.",
    divider: "O CONTINUAR CON CORREO",
    email: "Correo electrónico",
    forgot: "¿La olvidaste?",
    panelTag: "Acceso / Iniciar sesión",
    password: "Contraseña segura",
    prompt: "¿Sos nuevo en la plataforma?",
    title: "Bienvenido de nuevo"
  },
  signUp: {
    description: "Creá el acceso a tu espacio de trabajo.",
    divider: "O CREAR CON CORREO",
    panelTag: "Acceso / Nueva sesión",
    prompt: "¿Ya tenés una cuenta?",
    signIn: "Iniciar sesión",
    title: "Crear cuenta"
  },
  validation: {
    confirmPassword: "Confirmá tu contraseña",
    emailInvalid: "Ingresá un correo electrónico válido",
    emailRequired: "El correo electrónico es obligatorio",
    passwordLength: "La contraseña debe tener al menos 8 caracteres",
    passwordNumber: "La contraseña debe incluir al menos un número",
    passwordRequired: "La contraseña es obligatoria",
    passwordsMatch: "Las contraseñas no coinciden",
    passwordSpecial: "La contraseña debe incluir al menos un símbolo",
    passwordUppercase: "La contraseña debe incluir al menos una mayúscula"
  },
  verify: {
    alreadyVerified: "¿Ya lo verificaste?",
    description:
      "Confirmá tu correo electrónico antes de ingresar al espacio de trabajo.",
    emailLabel: "Correo electrónico",
    invalidEmail: "Volvé al registro e ingresá un correo electrónico válido.",
    missingEmail: "No se proporcionó un correo electrónico.",
    panelTag: "Acceso / Verificar correo",
    resend: "Reenviar enlace de verificación",
    resendCountdown_one: "Reenviar en {{count}} s",
    resendCountdown_many: "Reenviar en {{count}} s",
    resendCountdown_other: "Reenviar en {{count}} s",
    resendError:
      "No pudimos reenviar el correo de verificación. Intentá de nuevo.",
    sent: "Enlace enviado. Revisá tu bandeja de entrada y correo no deseado.",
    signIn: "Iniciar sesión",
    title: "Revisá tu correo"
  }
} as const;
