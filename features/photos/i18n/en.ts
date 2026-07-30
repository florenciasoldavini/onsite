export default {
  accessibility: {
    fullPhoto: "Full project photo",
    loadingMore: "Loading more photos",
    markMarketing: "Mark photo for marketing",
    moveEarlier: "Move photo earlier",
    moveLater: "Move photo later",
    openHint: "Opens photo details",
    photo: "Project photo",
    remove: "Remove selected photo",
    removeSelection: "Remove photo from batch selection",
    selectBatch: "Select photo for batch changes",
    selectedPhoto: "Selected photo {{number}}"
  },
  actions: {
    add: "Add photos",
    addProject: "Add project photos",
    backPhotos: "Back to photos",
    backProjects: "Back to projects",
    delete: "Delete photo",
    save: "Save changes",
    select: "Select",
    selected: "Selected"
  },
  categories: {
    all: "All categories",
    delivery: "Delivery",
    general: "General",
    issue: "Issue",
    milestone: "Milestone",
    progress: "Progress",
    quality: "Quality",
    safety: "Safety"
  },
  detail: {
    cancelDelete: "Cancel deleting photo",
    caption: "Caption (optional)",
    captionHelper: "Add context that will help the team understand the photo.",
    captured: "Captured",
    category: "Category",
    deleteDescription:
      "This photo will be removed from the project gallery. This action cannot currently be undone in the app.",
    deletedTitle: "Photo deleted",
    deleteTitle: "Delete photo?",
    dimensions: "Dimensions",
    eyebrow: "PROJECT PHOTO",
    location: "Location",
    locationExif: "{{latitude}}, {{longitude}} (photo EXIF)",
    marketing: "Marketing",
    notAvailable: "Not available",
    photoDetails: "Photo details",
    unavailable: "Unavailable",
    updatedTitle: "Photo details updated"
  },
  errors: {
    access:
      "We couldn't verify your photo access. Check your connection and try again.",
    delete:
      "We couldn't delete this photo. Check your connection and try again.",
    listUnavailable: "Photos unavailable",
    load: "We couldn't load this photo. Check your connection and try again.",
    loadList:
      "We couldn't load the project photos. Check your connection and try again.",
    notFound: "This photo may have been removed or you may not have access.",
    update:
      "We couldn't update this photo. Check your connection and try again."
  },
  gallery: {
    allPhotos: "All photos",
    emptyDescription:
      "Capture progress, issues, deliveries, and other project moments.",
    emptyTitle: "No project photos yet",
    filteredDescription: "No photos match the selected filters.",
    filteredTitle: "No matching photos",
    marketing: "Marketing",
    project: "Project",
    title: "Photos",
    titleEyebrow: "PROJECT PHOTOS"
  },
  marketing: {
    helper:
      "Keeps the operational category while making this photo easy to find for future promotional use.",
    label: "Marketing",
    mark: "Mark for marketing",
    markedSuffix: ", marked for marketing"
  },
  stage: {
    failed: "Photo could not be uploaded.",
    preparing: "Preparing and converting photo…",
    retrying: "Retrying photo…",
    saved: "Photo saved.",
    uploading: "Uploading full image and thumbnail…"
  },
  upload: {
    addCount: "Add photos ({{current}}/{{limit}})",
    applyCategory: "Apply category",
    batchCategory: "Category for selected photos",
    batchChanges: "Batch changes",
    camera: "Camera",
    cameraDenied:
      "Camera access is disabled. Enable Camera access for Onzait in your device settings, then try again.",
    cameraRequired:
      "Camera access is required to take a project photo. Allow access and try again.",
    captionPlaceholder: "What should the team know about this photo?",
    category: "Category",
    categoryHelper:
      "Choose the primary reason this photo belongs in the project record.",
    chooseLibrary: "Photo library",
    clearMarketing: "Clear marketing",
    description: "Every photo in this batch will be saved to this project.",
    fixedProject: "FIXED PROJECT",
    libraryDenied:
      "Photo access is disabled. Enable Photos access for Onzait in your device settings, then try again.",
    libraryRequired:
      "Photo access is required to select project photos. Allow access and try again.",
    limitDescription_one: "Only {{count}} more photo could be added.",
    limitDescription_many: "Only {{count}} more photos could be added.",
    limitDescription_other: "Only {{count}} more photos could be added.",
    limitTitle: "20-photo limit reached",
    markMarketing: "Mark marketing",
    noSelection: "No photos selected, so changes apply to all photos.",
    openCamera: "We couldn't open the camera. Try again.",
    openLibrary: "We couldn't open your photo library. Try again.",
    partialDescription:
      "{{saved}} saved. {{failed}} remain in the review queue.",
    partialTitle: "Some photos need another try",
    photoNumber: "PHOTO {{number}}",
    projectPhotos: "Project photos",
    retry: "Retry upload",
    save: "Save photos",
    savedDescription_one: "{{count}} photo added to the project.",
    savedDescription_many: "{{count}} photos added to the project.",
    savedDescription_other: "{{count}} photos added to the project.",
    savedTitle: "Photos saved",
    selectedCount_one: "Applies to {{count}} selected photo.",
    selectedCount_many: "Applies to {{count}} selected photos.",
    selectedCount_other: "Applies to {{count}} selected photos.",
    startError:
      "We couldn't start this upload. Check the project and try again.",
    upload: "Upload photos",
    uploadAccess:
      "We couldn't verify your photo upload access. Check your connection and try again.",
    uploadError:
      "This photo could not be uploaded. Check your connection and retry.",
    uploadForbidden: "Your project access does not allow adding photos.",
    uploadUnavailable: "Photo upload unavailable"
  }
} as const;
