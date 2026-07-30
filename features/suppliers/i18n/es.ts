export default {
  accessibility: {
    cancelDelete: "Cancelar la eliminación del proveedor",
    mapShowing: "Mapa que muestra {{address}}",
    newSupplier: "Nuevo proveedor",
    openSupplier: "Abrir {{name}}",
    sort: "Ordenar proveedores"
  },
  actions: {
    backToDirectory: "Volver al directorio",
    call: "Llamar",
    clearSearch: "Borrar búsqueda",
    create: "Crear proveedor",
    delete: "Eliminar proveedor",
    deleteShort: "Eliminar",
    edit: "Editar",
    email: "Enviar correo",
    loadMore: "Cargar más proveedores",
    new: "Nuevo proveedor",
    open: "Abrir",
    openMaps: "Abrir en Mapas",
    save: "Guardar cambios"
  },
  breadcrumbs: {
    detail: "Detalle del proveedor",
    edit: "Editar",
    new: "Nuevo",
    suppliers: "Proveedores"
  },
  delete: {
    description:
      "Esto elimina al proveedor del catálogo activo. Esta acción no se puede deshacer.",
    title: "¿Eliminar a {{name}}?"
  },
  detail: {
    address: "Dirección",
    contact: "Contacto",
    contactDetails: "Datos de contacto",
    deletedDescription: "{{name}} se eliminó del catálogo de proveedores.",
    deletedTitle: "Proveedor eliminado",
    email: "Correo electrónico",
    location: "Ubicación",
    noAddress: "Sin dirección",
    notes: "Notas",
    notProvided: "No informado",
    noWebsite: "Sin sitio web",
    phone: "Teléfono",
    profile: "PERFIL DEL PROVEEDOR",
    profileDescription: "Registro comercial del catálogo de proveedores",
    website: "Sitio web"
  },
  errors: {
    accountSetup:
      "No pudimos terminar de configurar la cuenta. Cerrá sesión, volvé a ingresar e intentá nuevamente.",
    delete: "No pudimos eliminar este proveedor. Intentá de nuevo.",
    emailApp:
      "No pudimos abrir la aplicación de correo. Copiá la dirección e intentá desde allí.",
    listLoad:
      "No pudimos cargar los proveedores. Revisá tu conexión e intentá de nuevo.",
    listUnavailable: "Proveedores no disponibles",
    load: "No pudimos cargar este proveedor. Intentá de nuevo.",
    mapApp:
      "No pudimos abrir la aplicación de mapas. Copiá la dirección e intentá desde allí.",
    mapPreview:
      "La vista previa del mapa no está disponible. Intentá nuevamente en unos minutos.",
    phoneApp:
      "No pudimos abrir la aplicación de teléfono. Copiá el número e intentá desde allí.",
    save: "No pudimos guardar este proveedor. Revisá tu conexión e intentá de nuevo.",
    signIn: "Iniciá sesión para guardar proveedores.",
    website:
      "No pudimos abrir este sitio web. Copiá la dirección e intentá desde el navegador."
  },
  fields: {
    address: "Dirección",
    contactName: "Nombre de contacto",
    email: "Correo electrónico",
    name: "Nombre del proveedor",
    notes: "Notas",
    phone: "Número de teléfono",
    website: "Sitio web"
  },
  form: {
    createDescription:
      "Agregá los datos de contacto, sitio web y ubicación del proveedor.",
    createTitle: "Nuevo proveedor",
    editDescription:
      "Actualizá la información del proveedor guardada en el directorio.",
    editTitle: "Editar proveedor",
    notesPlaceholder:
      "Detalles de entrega, productos preferidos u otro contexto útil"
  },
  list: {
    description:
      "Mantené listos los datos de contacto y ubicación de tus proveedores.",
    searchPlaceholder: "Buscar proveedores",
    title: "Proveedores"
  },
  search: {
    emptyDescription:
      "Agregá tu primer proveedor para comenzar a completar el directorio.",
    emptyTitle: "Todavía no hay proveedores",
    noMatchDescription:
      "Probá con otro nombre, contacto, sitio web o dirección.",
    noMatchTitle: "No hay proveedores que coincidan"
  },
  sort: {
    ascending: "A-Z",
    descending: "Z-A",
    label: "Orden",
    newest: "Más recientes",
    oldest: "Más antiguos"
  },
  toast: {
    createdDescription: "{{name}} se creó correctamente.",
    createdTitle: "Proveedor creado",
    updatedDescription: "{{name}} se actualizó correctamente.",
    updatedTitle: "Proveedor actualizado"
  },
  validation: {
    contactMax: "El nombre de contacto debe tener 160 caracteres o menos.",
    nameMax: "El nombre del proveedor debe tener 120 caracteres o menos.",
    nameMin: "El nombre del proveedor debe tener al menos 2 caracteres.",
    notesMax: "Las notas deben tener 2000 caracteres o menos.",
    websiteInvalid: "Ingresá un sitio web HTTP o HTTPS válido.",
    websiteMax: "El sitio web debe tener 2048 caracteres o menos."
  }
} as const;
