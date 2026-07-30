export default {
  accessibility: {
    backToClient: "Volver al cliente",
    backToClientDetail: "Volver al detalle del cliente",
    backToClients: "Volver a clientes",
    cancelDelete: "Cancelar eliminación del cliente",
    closeQuickCreate: "Cerrar creación rápida de cliente",
    newClient: "Nuevo cliente",
    openClient: "Abrir {{name}}",
    sort: "Ordenar clientes"
  },
  actions: {
    clearSearch: "Limpiar búsqueda",
    create: "Crear cliente",
    delete: "Eliminar cliente",
    loadMore: "Cargar más clientes",
    new: "Nuevo cliente",
    save: "Guardar cambios"
  },
  breadcrumbs: {
    client: "Cliente",
    detail: "Detalle del cliente",
    edit: "Editar",
    new: "Nuevo"
  },
  delete: {
    checkingProjects: "Comprobando proyectos vinculados…",
    checkProjectsError:
      "No pudimos comprobar los proyectos vinculados. Cerrá este mensaje e intentá nuevamente.",
    description:
      "Esto elimina al cliente del catálogo activo y desvincula los proyectos activos.",
    descriptionUnlinked: "Esto elimina al cliente del catálogo activo.",
    linkedProjects_one:
      "Este cliente está vinculado con {{count}} proyecto. Al eliminarlo, se desvinculará de ese proyecto.",
    linkedProjects_many:
      "Este cliente está vinculado con {{count}} proyectos. Al eliminarlo, se desvinculará de esos proyectos.",
    linkedProjects_other:
      "Este cliente está vinculado con {{count}} proyectos. Al eliminarlo, se desvinculará de esos proyectos.",
    title: "¿Eliminar a {{name}}?"
  },
  detail: {
    contactDetails: "Datos de contacto",
    deletedDescription: "{{name}} se eliminó correctamente.",
    deletedTitle: "Cliente eliminado",
    email: "Correo electrónico",
    linkedProjects: "Proyectos vinculados",
    linkedProjectsDescription: "Proyectos que usan este contacto",
    linkedProjectsError:
      "No pudimos cargar los proyectos vinculados. Reintentá.",
    linkedProjectsUnavailable: "Proyectos no disponibles",
    loadMoreProjects: "Cargar más proyectos",
    noLinkedProjects: "No hay proyectos vinculados",
    noLinkedProjectsDescription:
      "Seleccioná este cliente al crear o editar un proyecto.",
    notProvided: "No informado",
    phone: "Teléfono",
    primary: "PRINCIPAL",
    profile: "PERFIL DEL CLIENTE",
    profileDescription: "Contacto del catálogo de proyectos",
    viewProjects: "Ver proyectos"
  },
  errors: {
    accountSetup:
      "No pudimos terminar de configurar la cuenta. Cerrá sesión, volvé a ingresar e intentá nuevamente.",
    create: "No pudimos crear el cliente. Intentá nuevamente.",
    delete: "No pudimos eliminar el cliente. Intentá nuevamente.",
    editForbidden: "No tenés permiso para editar este cliente.",
    editUnavailable: "Edición de cliente no disponible",
    listUnavailable: "Clientes no disponibles",
    load: "No pudimos cargar el cliente. Intentá nuevamente.",
    loadList:
      "No pudimos cargar los clientes. Revisá la conexión e intentá nuevamente.",
    save: "No pudimos guardar el cliente. Revisá la conexión e intentá nuevamente.",
    signIn: "Iniciá sesión para guardar clientes."
  },
  fields: {
    client: "Cliente",
    email: "Correo electrónico",
    firstName: "Nombre",
    lastName: "Apellido",
    phone: "Teléfono"
  },
  form: {
    createDescription:
      "Agregá los datos de contacto y vinculá al cliente con proyectos cuando sea necesario.",
    createTitle: "Nuevo cliente",
    editDescription:
      "Actualizá los datos guardados en el catálogo de clientes.",
    editTitle: "Editar cliente"
  },
  list: {
    description:
      "Mantené los datos de contacto de clientes vinculados con los proyectos correctos.",
    noEmail: "Sin correo electrónico",
    noPhone: "Sin teléfono",
    searchPlaceholder: "Buscar clientes",
    title: "Clientes"
  },
  picker: {
    entities: "clientes",
    entity: "cliente",
    label: "Cliente",
    quickCreate: "Crear cliente rápidamente"
  },
  search: {
    emptyDescription:
      "Agregá el primer cliente para vincular sus datos de contacto con proyectos.",
    emptyTitle: "Todavía no hay clientes",
    noMatchDescription: "Probá con otro nombre, teléfono o correo electrónico.",
    noMatchTitle: "No hay clientes coincidentes"
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
    createdTitle: "Cliente creado",
    updatedDescription: "{{name}} se actualizó correctamente.",
    updatedTitle: "Cliente actualizado"
  }
} as const;
