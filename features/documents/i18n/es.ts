export default {
  "accessibility": {
    "cancelDelete": "Cancelar eliminación del documento",
    "categoryFilter": "Filtrar documentos por categoría",
    "closeEdit": "Cerrar edición del documento",
    "delete": "Eliminar {{name}}",
    "download": "Descargar {{name}}",
    "edit": "Editar {{name}}",
    "open": "Abrir {{name}}",
    "upload": "Subir un documento del proyecto"
  },
  "actions": {
    "add": "Agregar documento",
    "backProject": "Volver al proyecto",
    "backProjects": "Volver a proyectos",
    "chooseFile": "Elegir archivo",
    "clearFilters": "Limpiar filtros",
    "delete": "Eliminar documento",
    "download": "Descargar",
    "edit": "Editar",
    "loadMore": "Cargar más",
    "open": "Abrir",
    "save": "Guardar cambios",
    "upload": "Subir documento"
  },
  "categories": {
    "all": "Todas las categorías",
    "contract": "Contrato",
    "drawing": "Plano",
    "invoice": "Factura",
    "manual": "Manual",
    "other": "Otro",
    "permit": "Permiso",
    "report": "Informe",
    "specification": "Especificación"
  },
  "delete": {
    "description": "Este documento se eliminará del proyecto y su archivo privado será borrado. Esta acción no se puede deshacer.",
    "title": "¿Eliminar {{name}}?"
  },
  "edit": {
    "category": "Categoría",
    "name": "Nombre del documento",
    "title": "Editar documento"
  },
  "errors": {
    "access": "No pudimos preparar este documento. Revisá tu conexión e intentá de nuevo.",
    "delete": "No pudimos eliminar este documento. Revisá tu conexión e intentá de nuevo.",
    "listUnavailable": "Documentos no disponibles",
    "loadList": "No pudimos cargar los documentos del proyecto. Revisá tu conexión e intentá de nuevo.",
    "update": "No pudimos guardar los datos del documento. Revisá tu conexión e intentá de nuevo.",
    "upload": "No pudimos subir este documento. Revisá tu conexión e intentá de nuevo.",
    "uploadAccess": "No pudimos verificar tu acceso para subir documentos. Revisá tu conexión e intentá de nuevo."
  },
  "fileErrors": {
    "empty": "El archivo seleccionado está vacío. Elegí otro archivo.",
    "invalidSignature": "El contenido del archivo no coincide con su tipo PDF, JPG o PNG.",
    "missingMetadata": "Al archivo seleccionado le falta el nombre, tipo o tamaño requerido.",
    "tooLarge": "Elegí un archivo de menos de 25 MB.",
    "unsupportedType": "Elegí un archivo PDF, JPG o PNG."
  },
  "list": {
    "category": "Categoría",
    "description": "Planos, permisos, contratos, manuales y otros archivos privados del proyecto.",
    "emptyDescription": "Subí el primer archivo privado de este proyecto.",
    "emptyReadOnlyDescription": "Todavía no se agregaron documentos a este proyecto.",
    "emptyTitle": "Todavía no hay documentos",
    "fileDetails": "{{type}} · {{size}}",
    "filteredDescription": "No hay documentos que coincidan con la búsqueda y categoría actuales.",
    "filteredTitle": "No hay documentos coincidentes",
    "project": "Proyecto",
    "searchPlaceholder": "Buscar nombres de documentos o archivos",
    "title": "Documentos",
    "uploaded": "Subido el {{date}} por {{name}}"
  },
  "stage": {
    "cancelled": "Selección de archivo cancelada.",
    "failed": "Falló la carga del documento.",
    "saved": "Documento guardado.",
    "saving": "Guardando datos del documento…",
    "uploading": "Subiendo archivo privado…",
    "validating": "Verificando archivo…"
  },
  "toast": {
    "deletedDescription": "{{name}} se eliminó del proyecto.",
    "deletedTitle": "Documento eliminado",
    "downloadedTitle": "Descarga lista",
    "openedTitle": "Documento abierto",
    "updatedDescription": "Se actualizó {{name}}.",
    "updatedTitle": "Documento actualizado",
    "uploadedDescription": "Se agregó {{name}} al proyecto.",
    "uploadedTitle": "Documento subido"
  },
  "upload": {
    "category": "Categoría",
    "description": "Subí un archivo PDF, JPG o PNG privado de hasta 25 MB.",
    "file": "Archivo",
    "fileHelper": "PDF, JPG o PNG · máximo 25 MB",
    "name": "Nombre del documento",
    "noFile": "Ningún archivo seleccionado",
    "selectedFile": "{{name}} · {{size}}",
    "title": "Subir documento"
  },
  "validation": {
    "nameMax": "El nombre debe tener 160 caracteres o menos.",
    "nameRequired": "Ingresá un nombre para el documento."
  }
} as const;
