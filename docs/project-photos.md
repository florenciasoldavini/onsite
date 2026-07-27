# Project Photos

Purpose: product, architecture, storage, and privacy contract for project-specific photos
Source of truth for: current photo categories, upload behavior, marketing classification, EXIF retention, and deferred scope
Update when: photo visibility, processing, location use, publishing, consent, or global intake changes
Last reviewed: 2026-07-27

## Current Product Scope

Managers can add up to 20 photos from within one active project. A batch never changes projects during review. Each photo has:

- one operational category: `general`, `progress`, `issue`, `safety`, `quality`, `delivery`, or `milestone`
- an optional caption of at most 1,000 characters
- an independent `is_marketing` flag

Marketing is an organizational classification only. It does not publish a photo, change who can see it, or represent client/subject consent.

Photos and Documentation are separate project actions. Global cross-project intake and assignment review remain deferred to GitHub issue #67.

## Processing and Storage

- Apple HEIC/HEIF photos are converted automatically; users do not need to convert them first.
- Every image is normalized to JPEG. Remaining embedded metadata is stripped from generated files.
- The full image has a maximum 3,200-pixel long edge and 6 MiB size.
- The gallery thumbnail has a maximum 640-pixel long edge.
- At most two photos are processed and uploaded concurrently.
- The original selected file is never uploaded or retained.
- Generated UUIDs create immutable full and thumbnail paths under `projects/{project_id}/photos/{photo_id}/`.
- The private `project-photos` bucket is read through short-lived signed URLs.
- A database row must actively reference an object before it is readable.

If database persistence fails, the service removes both newly uploaded objects. Deletion soft-deletes the row before object cleanup so the photo becomes unreadable immediately. Cleanup failures are reported to Sentry for reconciliation without restoring the deleted row.

## Location and Privacy

This version does not request device location for photo uploads.

Capture time and coordinates are read only from metadata already embedded in the selected photo. Coordinates are optional and stored with `location_source = photo_exif`. The generated JPEGs do not retain EXIF metadata, but selected coordinates remain in the protected database row so a future global intake workflow can suggest a project assignment.

Project owners and admins are the only supported readers until project participation is implemented. Location must not be shown to users who cannot read the photo itself.

Before implementing social publishing or external sharing, add an explicit authorization and consent model. The marketing flag alone must never be treated as publication permission.

## Deferred

- global cross-project batch intake and location matching
- manual cross-project reorganization
- publishing or social network integrations
- marketing consent and release tracking
- tags, albums, video, task/report links, and background uploads
