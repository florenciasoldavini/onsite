export default {
  accessibility: {
    clearSearch: "Borrar búsqueda",
    closeSelectMenu: "Cerrar menú de selección",
    hidePassword: "Ocultar contraseña",
    loading: "Cargando",
    loadingScreen: "Cargando pantalla",
    primaryNavigation: "Navegación principal",
    showPassword: "Mostrar contraseña"
  },
  actions: {
    add: "Agregar",
    cancel: "Cancelar",
    close: "Cerrar",
    delete: "Eliminar",
    edit: "Editar",
    retry: "Intentar de nuevo",
    save: "Guardar",
    search: "Buscar"
  },
  address: {
    attribution: "Sugerencias de direcciones de Google Maps",
    clear: "Borrar {{label}}",
    mapAlt: "Vista previa del mapa de la ubicación seleccionada",
    noResults: "No se encontraron direcciones que coincidan.",
    searchPlaceholder: "Buscar con Google Maps",
    selected: "Ubicación seleccionada: {{address}}"
  },
  catalogPicker: {
    clear: "Borrar {{entity}} seleccionado",
    clearAction: "Borrar",
    loadError: "No pudimos cargar {{entities}}. Intentá de nuevo.",
    loading: "Cargando {{entities}}…",
    loadMore: "Cargar más {{entities}}",
    noContactDetails: "Sin datos de contacto",
    noMatches: "No hay {{entities}} que coincidan.",
    searchPlaceholder: "Buscar por nombre, teléfono o correo electrónico",
    select: "Seleccionar {{name}}"
  },
  feedback: {
    destructiveConfirm: "Eliminar",
    forbiddenDescription: "No tenés permiso para ver esta página.",
    forbiddenTitle: "Acceso no disponible",
    invalidDescription: "Revisá el enlace e intentá de nuevo.",
    invalidTitle: "Enlace inválido",
    loadErrorDescription: "Revisá tu conexión e intentá de nuevo.",
    loadErrorTitle: "No pudimos cargar esta página",
    loading: "Cargando…",
    notFoundDescription:
      "Es posible que se haya eliminado o que ya no esté disponible.",
    notFoundTitle: "No encontrado",
    pageAction: "Ir a Onzait",
    pageDescription:
      "La página solicitada no existe o el enlace ya no es válido.",
    pageTitle: "Página no encontrada",
    resourceForbidden: "No tenés permiso para acceder a este {{resource}}.",
    resourceInvalidDescription:
      "El enlace de {{resource}} está incompleto o no es válido.",
    resourceInvalidTitle: "Enlace de {{resource}} inválido",
    resourceLoadError:
      "No pudimos cargar {{resource}}. Revisá tu conexión e intentá de nuevo.",
    resourceNotFound:
      "Es posible que {{resource}} se haya eliminado o que no tengas acceso.",
    resourceNotFoundTitle: "{{resource}} no encontrado",
    resourceUnavailableTitle: "{{resource}} no disponible",
    unavailableTitle: "Contenido no disponible"
  },
  genericErrors: {
    alreadyExists: "Ya existe una cuenta o un registro con estos datos.",
    differentPassword:
      "Elegí una contraseña diferente de tu contraseña actual.",
    fileDuplicate:
      "Ya existe un archivo con estos datos. Elegí otro archivo e intentá de nuevo.",
    fileTooLarge:
      "El archivo es demasiado grande. Elegí uno más pequeño e intentá de nuevo.",
    inUse: "Este elemento todavía está en uso y no se puede modificar ahora.",
    invalidCredentials:
      "El correo electrónico o la contraseña son incorrectos. Revisá los datos e intentá de nuevo.",
    linkingDisabled:
      "La vinculación de cuentas no está disponible temporalmente. Intentá de nuevo más tarde.",
    methodAlreadyLinked: "Ese método de acceso ya está vinculado a una cuenta.",
    methodUnavailable: "Ese método de acceso no está disponible ahora.",
    notFound: "No se pudo encontrar el elemento solicitado.",
    permission: "No tenés permiso para completar esta acción.",
    rateLimited:
      "Se hicieron demasiadas solicitudes. Esperá un momento e intentá de nuevo.",
    serviceUnavailable:
      "El servicio no está disponible temporalmente. Intentá de nuevo en unos minutos.",
    sessionExpired: "Tu sesión venció. Iniciá sesión e intentá de nuevo.",
    transport: "Revisá tu conexión a internet e intentá de nuevo.",
    unconfirmedEmail: "Confirmá tu correo electrónico antes de iniciar sesión.",
    weakPassword: "Elegí una contraseña más segura e intentá de nuevo."
  },
  optional: "(opcional)",
  validation: {
    email: "Ingresá un correo electrónico válido.",
    firstNameMax: "El nombre debe tener 80 caracteres o menos.",
    firstNameRequired: "El nombre es obligatorio.",
    lastNameMax: "El apellido debe tener 80 caracteres o menos.",
    phone: "Ingresá un número de teléfono válido.",
    phoneMax: "El número de teléfono debe tener 40 caracteres o menos."
  }
} as const;
