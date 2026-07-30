export default {
  info: {
    avatarAccessibility: "Cambiar foto de perfil",
    avatarError: "La foto de perfil no está disponible. Actualizá la página.",
    firstName: "Nombre",
    lastName: "Apellido",
    personalDetails: "Datos personales",
    phone: "Teléfono",
    photoDenied:
      "El acceso a fotos está desactivado. Habilitalo en la configuración del dispositivo e intentá nuevamente.",
    photoError: "No pudimos abrir la biblioteca de fotos. Intentá nuevamente.",
    photoPermission:
      "Se necesita acceso a las fotos para elegir una imagen de perfil. Permití el acceso e intentá nuevamente.",
    profile: "Perfil",
    save: "Guardar perfil",
    signInError: "Iniciá sesión para actualizar el perfil.",
    updated: "Perfil actualizado"
  },
  methods: {
    apple: "Apple",
    appleSupporting: "Cuenta de Apple",
    checking: "Comprobando métodos vinculados...",
    connected: "Accesos conectados",
    connecting: "Conectando {{provider}}...",
    email: "Correo electrónico",
    emailSupporting: "Acceso con contraseña",
    google: "Google",
    googleSupporting: "Cuenta de Google",
    link: "Vincular",
    linkAccessibility: "Vincular acceso con {{provider}}",
    linked: "Vinculado",
    linkedStatus: "Acceso con {{provider}} vinculado.",
    linkError: "No pudimos confirmar la vinculación con {{provider}}.",
    title: "Métodos de acceso"
  },
  security: {
    change: "Cambiar contraseña",
    confirm: "Confirmar contraseña",
    heading: "Seguridad de la cuenta",
    newPassword: "Nueva contraseña",
    passwordHint: "Usá 8 o más caracteres, mayúscula, número y símbolo.",
    settings: "Configuración de contraseña",
    updated: "Contraseña actualizada."
  },
  workspace: {
    logout: "Cerrar sesión",
    methods: "Acceso",
    profile: "Perfil",
    security: "Seguridad",
    title: "Perfil"
  }
} as const;
