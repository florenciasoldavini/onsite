export default {
  accessibility: {
    fullPhoto: "Foto completa del proyecto",
    loadingMore: "Cargando más fotos",
    markMarketing: "Marcar foto para marketing",
    moveEarlier: "Mover foto hacia arriba",
    moveLater: "Mover foto hacia abajo",
    openHint: "Abre los detalles de la foto",
    photo: "Foto del proyecto",
    remove: "Eliminar la foto seleccionada",
    removeSelection: "Quitar la foto de la selección por lote",
    selectBatch: "Seleccionar foto para cambios por lote",
    selectedPhoto: "Foto seleccionada {{number}}"
  },
  actions: {
    add: "Agregar fotos",
    addProject: "Agregar fotos del proyecto",
    backPhotos: "Volver a las fotos",
    backProjects: "Volver a proyectos",
    delete: "Eliminar foto",
    save: "Guardar cambios",
    select: "Seleccionar",
    selected: "Seleccionada"
  },
  categories: {
    all: "Todas las categorías",
    delivery: "Entrega",
    general: "General",
    issue: "Problema",
    milestone: "Hito",
    progress: "Avance",
    quality: "Calidad",
    safety: "Seguridad"
  },
  detail: {
    cancelDelete: "Cancelar la eliminación de la foto",
    caption: "Descripción (opcional)",
    captionHelper: "Agregá contexto que ayude al equipo a comprender la foto.",
    captured: "Capturada",
    category: "Categoría",
    deleteDescription:
      "Esta foto se eliminará de la galería del proyecto. Por el momento, esta acción no se puede deshacer desde la aplicación.",
    deletedTitle: "Foto eliminada",
    deleteTitle: "¿Eliminar foto?",
    dimensions: "Dimensiones",
    eyebrow: "FOTO DEL PROYECTO",
    location: "Ubicación",
    locationExif: "{{latitude}}, {{longitude}} (EXIF de la foto)",
    marketing: "Marketing",
    notAvailable: "No disponible",
    photoDetails: "Detalles de la foto",
    unavailable: "No disponible",
    updatedTitle: "Detalles de la foto actualizados"
  },
  errors: {
    access:
      "No pudimos verificar el acceso a la foto. Revisá tu conexión e intentá de nuevo.",
    delete:
      "No pudimos eliminar esta foto. Revisá tu conexión e intentá de nuevo.",
    listUnavailable: "Fotos no disponibles",
    load: "No pudimos cargar esta foto. Revisá tu conexión e intentá de nuevo.",
    loadList:
      "No pudimos cargar las fotos del proyecto. Revisá tu conexión e intentá de nuevo.",
    notFound:
      "Es posible que esta foto se haya eliminado o que no tengas acceso.",
    update:
      "No pudimos actualizar esta foto. Revisá tu conexión e intentá de nuevo."
  },
  gallery: {
    allPhotos: "Todas las fotos",
    emptyDescription:
      "Registrá avances, problemas, entregas y otros momentos del proyecto.",
    emptyTitle: "Todavía no hay fotos del proyecto",
    filteredDescription: "Ninguna foto coincide con los filtros seleccionados.",
    filteredTitle: "No hay fotos que coincidan",
    marketing: "Marketing",
    project: "Proyecto",
    title: "Fotos",
    titleEyebrow: "FOTOS DEL PROYECTO"
  },
  marketing: {
    helper:
      "Conserva la categoría operativa y facilita encontrar la foto para futuros usos promocionales.",
    label: "Marketing",
    mark: "Marcar para marketing",
    markedSuffix: ", marcada para marketing"
  },
  stage: {
    failed: "No se pudo subir la foto.",
    preparing: "Preparando y convirtiendo la foto…",
    retrying: "Reintentando la foto…",
    saved: "Foto guardada.",
    uploading: "Subiendo la imagen completa y la miniatura…"
  },
  upload: {
    addCount: "Agregar fotos ({{current}}/{{limit}})",
    applyCategory: "Aplicar categoría",
    batchCategory: "Categoría para las fotos seleccionadas",
    batchChanges: "Cambios por lote",
    camera: "Tomar foto",
    cameraDenied:
      "El acceso a la cámara está desactivado. Habilitalo para Onzait en la configuración del dispositivo e intentá de nuevo.",
    cameraRequired:
      "Se necesita acceso a la cámara para tomar una foto del proyecto. Permití el acceso e intentá de nuevo.",
    captionPlaceholder: "¿Qué debería saber el equipo sobre esta foto?",
    category: "Categoría",
    categoryHelper:
      "Elegí el motivo principal por el que esta foto forma parte del registro del proyecto.",
    chooseLibrary: "Elegir de la biblioteca",
    clearMarketing: "Quitar marketing",
    description: "Todas las fotos de este lote se guardarán en este proyecto.",
    fixedProject: "PROYECTO FIJO",
    libraryDenied:
      "El acceso a las fotos está desactivado. Habilitalo para Onzait en la configuración del dispositivo e intentá de nuevo.",
    libraryRequired:
      "Se necesita acceso a las fotos para seleccionar fotos del proyecto. Permití el acceso e intentá de nuevo.",
    limitDescription_one: "Solo se pudo agregar {{count}} foto más.",
    limitDescription_many: "Solo se pudieron agregar {{count}} fotos más.",
    limitDescription_other: "Solo se pudieron agregar {{count}} fotos más.",
    limitTitle: "Se alcanzó el límite de 20 fotos",
    markMarketing: "Marcar para marketing",
    noSelection:
      "No hay fotos seleccionadas, por lo que los cambios se aplican a todas.",
    openCamera: "No pudimos abrir la cámara. Intentá de nuevo.",
    openLibrary: "No pudimos abrir la biblioteca de fotos. Intentá de nuevo.",
    partialDescription:
      "{{saved}} guardadas. {{failed}} quedan en la cola de revisión.",
    partialTitle: "Algunas fotos necesitan otro intento",
    photoNumber: "FOTO {{number}}",
    projectPhotos: "Fotos del proyecto",
    retry: "Reintentar carga",
    save: "Guardar fotos",
    savedDescription_one: "Se agregó {{count}} foto al proyecto.",
    savedDescription_many: "Se agregaron {{count}} fotos al proyecto.",
    savedDescription_other: "Se agregaron {{count}} fotos al proyecto.",
    savedTitle: "Fotos guardadas",
    selectedCount_one: "Se aplica a {{count}} foto seleccionada.",
    selectedCount_many: "Se aplica a {{count}} fotos seleccionadas.",
    selectedCount_other: "Se aplica a {{count}} fotos seleccionadas.",
    startError:
      "No pudimos iniciar la carga. Revisá el proyecto e intentá de nuevo.",
    upload: "Subir fotos",
    uploadAccess:
      "No pudimos verificar el permiso para subir fotos. Revisá tu conexión e intentá de nuevo.",
    uploadError: "No se pudo subir esta foto. Revisá tu conexión y reintentá.",
    uploadForbidden: "Tu acceso al proyecto no permite agregar fotos.",
    uploadUnavailable: "Carga de fotos no disponible"
  }
} as const;
