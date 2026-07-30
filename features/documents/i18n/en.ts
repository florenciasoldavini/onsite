export default {
  "accessibility": {
    "cancelDelete": "Cancel deleting document",
    "categoryFilter": "Filter documents by category",
    "closeEdit": "Close document editing",
    "delete": "Delete {{name}}",
    "download": "Download {{name}}",
    "edit": "Edit {{name}}",
    "open": "Open {{name}}",
    "upload": "Upload a project document"
  },
  "actions": {
    "add": "Add document",
    "backProject": "Back to project",
    "backProjects": "Back to projects",
    "chooseFile": "Choose file",
    "clearFilters": "Clear filters",
    "delete": "Delete document",
    "download": "Download",
    "edit": "Edit",
    "loadMore": "Load more",
    "open": "Open",
    "save": "Save changes",
    "upload": "Upload document"
  },
  "categories": {
    "all": "All categories",
    "contract": "Contract",
    "drawing": "Drawing",
    "invoice": "Invoice",
    "manual": "Manual",
    "other": "Other",
    "permit": "Permit",
    "report": "Report",
    "specification": "Specification"
  },
  "delete": {
    "description": "This document will be removed from the project and its private file will be deleted. This action cannot be undone.",
    "title": "Delete {{name}}?"
  },
  "edit": {
    "category": "Category",
    "name": "Document name",
    "title": "Edit document"
  },
  "errors": {
    "access": "We couldn't prepare this document. Check your connection and try again.",
    "delete": "We couldn't delete this document. Check your connection and try again.",
    "listUnavailable": "Documents unavailable",
    "loadList": "We couldn't load the project documents. Check your connection and try again.",
    "update": "We couldn't save these document details. Check your connection and try again.",
    "upload": "We couldn't upload this document. Check your connection and try again.",
    "uploadAccess": "We couldn't verify your document upload access. Check your connection and try again."
  },
  "fileErrors": {
    "empty": "The selected file is empty. Choose another file.",
    "invalidSignature": "The file contents do not match its PDF, JPG, or PNG type.",
    "missingMetadata": "The selected file is missing required name, type, or size information.",
    "tooLarge": "Choose a file smaller than 25 MB.",
    "unsupportedType": "Choose a PDF, JPG, or PNG file."
  },
  "list": {
    "category": "Category",
    "description": "Private drawings, permits, contracts, manuals, and other project files.",
    "emptyDescription": "Upload the first private file for this project.",
    "emptyReadOnlyDescription": "No documents have been added to this project yet.",
    "emptyTitle": "No documents yet",
    "fileDetails": "{{type}} · {{size}}",
    "filteredDescription": "No documents match the current search and category.",
    "filteredTitle": "No matching documents",
    "project": "Project",
    "searchPlaceholder": "Search document names or filenames",
    "title": "Documents",
    "uploaded": "Uploaded {{date}} by {{name}}"
  },
  "stage": {
    "cancelled": "File selection cancelled.",
    "failed": "Document upload failed.",
    "saved": "Document saved.",
    "saving": "Saving document details…",
    "uploading": "Uploading private file…",
    "validating": "Checking file…"
  },
  "toast": {
    "deletedDescription": "{{name}} was removed from the project.",
    "deletedTitle": "Document deleted",
    "downloadedTitle": "Download ready",
    "openedTitle": "Document opened",
    "updatedDescription": "{{name}} was updated.",
    "updatedTitle": "Document updated",
    "uploadedDescription": "{{name}} was added to the project.",
    "uploadedTitle": "Document uploaded"
  },
  "upload": {
    "category": "Category",
    "description": "Upload one private PDF, JPG, or PNG file up to 25 MB.",
    "file": "File",
    "fileHelper": "PDF, JPG, or PNG · maximum 25 MB",
    "name": "Document name",
    "noFile": "No file selected",
    "selectedFile": "{{name}} · {{size}}",
    "title": "Upload document"
  },
  "validation": {
    "nameMax": "Document name must be 160 characters or fewer.",
    "nameRequired": "Enter a document name."
  }
} as const;
