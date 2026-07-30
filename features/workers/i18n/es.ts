export default {
  accessibility: {
    backToDetail: "Volver al detalle del trabajador",
    backToDirectory: "Volver al directorio de trabajadores",
    cancelDelete: "Cancelar eliminación del trabajador",
    filterContractor: "Filtrar trabajadores por contratista",
    new: "Nuevo trabajador",
    open: "Abrir {{name}}",
    sort: "Ordenar trabajadores"
  },
  actions: {
    call: "Llamar",
    clearFilters: "Limpiar filtros",
    create: "Crear trabajador",
    delete: "Eliminar trabajador",
    loadMore: "Cargar más trabajadores",
    new: "Nuevo trabajador",
    open: "Abrir",
    save: "Guardar cambios"
  },
  breadcrumbs: {
    detail: "Detalle del trabajador",
    edit: "Editar",
    new: "Nuevo",
    workers: "Trabajadores"
  },
  delete: {
    description:
      "Esto elimina al trabajador del catálogo activo. Esta acción no se puede deshacer.",
    title: "¿Eliminar a {{name}}?"
  },
  detail: {
    contactDetails: "Datos de contacto",
    contractor: "Contratista",
    deletedDescription: "{{name}} se eliminó correctamente.",
    deletedTitle: "Trabajador eliminado",
    email: "Correo electrónico",
    emailError:
      "No pudimos abrir la aplicación de correo. Copiá la dirección e intentá desde allí.",
    independent: "Trabajador independiente",
    notProvided: "No informado",
    noTrades: "No hay rubros seleccionados",
    phone: "Teléfono",
    phoneError:
      "No pudimos abrir la aplicación de teléfono. Copiá el número e intentá desde allí.",
    primary: "PRINCIPAL",
    profile: "PERFIL DEL TRABAJADOR",
    profileDescription: "Contacto y perfil de trabajo del catálogo",
    relationships: "Relaciones de trabajo",
    tradeCategories: "Rubros"
  },
  errors: {
    accountSetup:
      "No pudimos terminar de configurar la cuenta. Cerrá sesión, volvé a ingresar e intentá nuevamente.",
    delete: "No pudimos eliminar el trabajador. Intentá nuevamente.",
    listUnavailable: "Trabajadores no disponibles",
    load: "No pudimos cargar el trabajador. Intentá nuevamente.",
    loadList:
      "No pudimos cargar los trabajadores. Revisá la conexión e intentá nuevamente.",
    save: "No pudimos guardar el trabajador. Revisá la conexión e intentá nuevamente.",
    signIn: "Iniciá sesión para guardar trabajadores."
  },
  fields: {
    contractor: "Contratista",
    email: "Correo electrónico",
    firstName: "Nombre",
    lastName: "Apellido",
    loadingTrades: "Cargando rubros…",
    loadMoreTrades: "Cargar más rubros",
    phone: "Teléfono",
    tradeCategories: "Rubros",
    tradeHelper:
      "Seleccioná los tipos de trabajo que esta persona realiza habitualmente.",
    tradeLoadError: "No pudimos cargar los rubros.",
    worker: "Trabajador"
  },
  filters: {
    all: "Todos",
    contractor: "Contratista",
    loadMoreContractors: "Cargar más filtros de contratistas",
    loadMoreTrades: "Cargar más filtros de rubros",
    trade: "Filtrar por rubro",
    tradeHelper: "Se mostrarán trabajadores que coincidan con algún rubro."
  },
  form: {
    createDescription:
      "Agregá un trabajador y registrá su contratista y rubros habituales.",
    createTitle: "Nuevo trabajador",
    editDescription: "Actualizá los datos de contacto y sus relaciones.",
    editTitle: "Editar trabajador"
  },
  list: {
    description: "Administrá contactos, contratistas y rubros habituales.",
    independent: "Trabajador independiente",
    noTrades: "No hay rubros seleccionados",
    searchPlaceholder: "Buscar trabajadores",
    title: "Trabajadores"
  },
  search: {
    emptyDescription:
      "Agregá el primer trabajador para comenzar a armar el directorio.",
    emptyTitle: "Todavía no hay trabajadores",
    noMatchDescription: "Probá con otro nombre, contratista o rubro.",
    noMatchTitle: "No hay trabajadores coincidentes"
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
    createdTitle: "Trabajador creado",
    updatedDescription: "{{name}} se actualizó correctamente.",
    updatedTitle: "Trabajador actualizado"
  }
} as const;
