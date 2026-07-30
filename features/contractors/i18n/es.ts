export default {
  accessibility: {
    backToDetail: "Volver al detalle del contratista",
    backToDirectory: "Volver al directorio de contratistas",
    cancelDelete: "Cancelar eliminación del contratista",
    new: "Nuevo contratista",
    open: "Abrir {{name}}",
    sort: "Ordenar contratistas"
  },
  actions: {
    call: "Llamar",
    clearSearch: "Limpiar búsqueda",
    create: "Crear contratista",
    delete: "Eliminar contratista",
    loadMore: "Cargar más contratistas",
    new: "Nuevo contratista",
    save: "Guardar cambios"
  },
  breadcrumbs: {
    contractors: "Contratistas",
    detail: "Detalle del contratista",
    edit: "Editar",
    new: "Nuevo"
  },
  delete: {
    description:
      "Esto elimina al contratista del catálogo activo. Esta acción no se puede deshacer.",
    title: "¿Eliminar a {{name}}?"
  },
  detail: {
    contactDetails: "Datos de contacto",
    deletedDescription: "{{name}} se eliminó correctamente.",
    deletedTitle: "Contratista eliminado",
    email: "Correo electrónico",
    emailError:
      "No pudimos abrir la aplicación de correo. Copiá la dirección e intentá desde allí.",
    notProvided: "No informado",
    phone: "Teléfono",
    phoneError:
      "No pudimos abrir la aplicación de teléfono. Copiá el número e intentá desde allí.",
    primary: "PRINCIPAL",
    profile: "PERFIL DEL CONTRATISTA",
    profileDescription: "Contacto del catálogo de contratistas"
  },
  errors: {
    accountSetup:
      "No pudimos terminar de configurar la cuenta. Cerrá sesión, volvé a ingresar e intentá nuevamente.",
    delete: "No pudimos eliminar el contratista. Intentá nuevamente.",
    listUnavailable: "Contratistas no disponibles",
    load: "No pudimos cargar el contratista. Intentá nuevamente.",
    loadList:
      "No pudimos cargar los contratistas. Revisá la conexión e intentá nuevamente.",
    save: "No pudimos guardar el contratista. Revisá la conexión e intentá nuevamente.",
    signIn: "Iniciá sesión para guardar contratistas."
  },
  fields: {
    contractor: "Contratista",
    email: "Correo electrónico",
    firstName: "Nombre",
    lastName: "Apellido",
    phone: "Teléfono"
  },
  form: {
    createDescription:
      "Agregá un contacto contratista y asignale trabajadores más adelante.",
    createTitle: "Nuevo contratista",
    editDescription: "Actualizá los datos guardados en el catálogo.",
    editTitle: "Editar contratista"
  },
  list: {
    description:
      "Mantené los contactos de contratistas listos para futuras asignaciones.",
    noEmail: "Sin correo electrónico",
    noPhone: "Sin teléfono",
    searchPlaceholder: "Buscar contratistas",
    title: "Contratistas"
  },
  picker: {
    entities: "contratistas",
    entity: "contratista",
    label: "Contratista"
  },
  search: {
    emptyDescription:
      "Agregá el primer contratista para comenzar a armar el directorio.",
    emptyTitle: "Todavía no hay contratistas",
    noMatchDescription: "Probá con otro nombre, teléfono o correo electrónico.",
    noMatchTitle: "No hay contratistas coincidentes"
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
    createdTitle: "Contratista creado",
    updatedDescription: "{{name}} se actualizó correctamente.",
    updatedTitle: "Contratista actualizado"
  }
} as const;
