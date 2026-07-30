# Project Documents

Purpose: product, authorization, Storage, and implementation contract for simple project documents
Source of truth for: document metadata, supported files, access, upload, download, and deletion behavior
Update when: document categories, file limits, permissions, Storage behavior, or deferred scope changes
Last reviewed: 2026-07-30

## Product Scope

A project document is one database record with one immutable private file. Users may upload, list, search, filter, open, download, rename, recategorize, and delete documents.

There are no revisions, replacements, statuses, archive states, approvals, document dates, descriptions, embedded previews, or offline document cache. An incorrect file must be deleted and uploaded again.

Supported file types are PDF, JPEG, and PNG. Each file may be at most 25 MiB.

## Metadata

`project_documents` stores:

- the project and uploader derived by trusted database behavior;
- a required display name of at most 160 characters;
- one stable category code: `drawing`, `specification`, `permit`, `contract`, `manual`, `report`, `invoice`, or `other`;
- the immutable original filename, MIME type, normalized extension, byte size, and object path;
- creation, update, and soft-deletion timestamps;
- the uploader display name captured at upload time for stable list attribution.

Object paths are immutable and must match:

`projects/{projectId}/documents/{documentId}/file.{pdf|jpg|png}`

Editing changes only the display name and category.

## Authorization

All active participants with `project.read` may list, open, and download active documents. `project.documents.write` permits upload, metadata edits, and deletion and is assigned to owners and managers. Global admins inherit all project capabilities. Contributors and viewers are read-only.

Archived projects, removed members, outsiders, cross-project paths, orphaned objects, and soft-deleted document rows do not receive document access.

The client uses project capability hooks for UI affordances. Table and Storage RLS remain authoritative.

## Upload Transaction

The picker accepts one file at a time on web, iOS, and Android. The form derives the initial display name from the filename and requires the user to select a category.

Before upload, the client validates:

- required filename, MIME type, and byte size metadata;
- the 25 MiB maximum;
- a supported extension and matching MIME type;
- the PDF, JPEG, or PNG magic-byte signature.

The app generates the document UUID and immutable path, uploads with `upsert: false`, and then inserts the row. If row persistence fails, the service removes the staged object. Failed compensation is sent to monitoring without filenames or signed URLs.

Upload feedback distinguishes validation, upload, metadata save, success, failure, and cancelled selection. Uploads are intentionally indeterminate, foreground-only, and full-retry in this version.

## Open and Download

The `project-documents` bucket is private and cannot be listed. Reads require `project.read` plus a matching active document row.

Signed URLs are created only after an explicit Open or Download action and expire after five minutes:

- Open requests inline disposition and uses the browser or native system viewer.
- Download requests attachment disposition with a sanitized original filename.

Web starts the browser download without replacing the app route. Native downloads to the app cache, presents the system share/save sheet, and deletes the temporary copy when safe. These files are not persistent offline documents.

## Deletion

Deletion requires an explicit danger confirmation. The service soft-deletes the database row first, immediately removing read access, then removes the Storage object. A cleanup failure does not restore the row; it is reported for reconciliation.

## Listing and Performance

The catalog uses a virtualized responsive list with 25-row pages ordered by `created_at DESC, id DESC`. Queries select summary fields only, exclude `deleted_at`, search display and original filenames, and optionally filter by category.

The UI distinguishes route failure, loading, query failure, empty catalog, filtered-empty results, content, and load-more states.

## Deferred Work

Revisions, replacement, archive/status workflows, document dates and descriptions, Office files, approval, transmittals, OCR, signatures, annotations, malware scanning, upload percentage, pause/resume, background transfer, restart recovery, and offline availability are separate follow-ups.
