export default {
  accessibility: {
    clearSearch: "Clear search",
    closeSelectMenu: "Close select menu",
    hidePassword: "Hide password",
    loading: "Loading",
    loadingScreen: "Loading screen",
    primaryNavigation: "Primary navigation",
    showPassword: "Show password"
  },
  actions: {
    add: "Add",
    cancel: "Cancel",
    close: "Close",
    delete: "Delete",
    edit: "Edit",
    retry: "Retry",
    save: "Save",
    search: "Search"
  },
  address: {
    attribution: "Address suggestions by Google Maps",
    clear: "Clear {{label}}",
    mapAlt: "Selected location map preview",
    noResults: "No matching addresses found.",
    searchPlaceholder: "Search with Google Maps",
    selected: "Selected location: {{address}}"
  },
  catalogPicker: {
    clear: "Clear selected {{entity}}",
    clearAction: "Clear",
    loadError: "We couldn't load {{entities}}. Try again.",
    loading: "Loading {{entities}}…",
    loadMore: "Load more {{entities}}",
    noContactDetails: "No contact details",
    noMatches: "No matching {{entities}}.",
    searchPlaceholder: "Search by name, phone, or email",
    select: "Select {{name}}"
  },
  feedback: {
    destructiveConfirm: "Delete",
    forbiddenDescription: "You do not have permission to view this page.",
    forbiddenTitle: "Access unavailable",
    invalidDescription: "Check the link and try again.",
    invalidTitle: "Invalid link",
    loadErrorDescription: "Check your connection and try again.",
    loadErrorTitle: "We couldn't load this page",
    loading: "Loading…",
    notFoundDescription: "It may have been removed or is no longer available.",
    notFoundTitle: "Not found",
    pageAction: "Go to Onzait",
    pageDescription:
      "The page you requested does not exist or the link is no longer valid.",
    pageTitle: "Page not found",
    resourceForbidden: "You don't have permission to access this {{resource}}.",
    resourceInvalidDescription:
      "This {{resource}} link is incomplete or invalid.",
    resourceInvalidTitle: "Invalid {{resource}} link",
    resourceLoadError:
      "We couldn't load this {{resource}}. Check your connection and try again.",
    resourceNotFound:
      "This {{resource}} may have been removed or you may not have access.",
    resourceNotFoundTitle: "{{resource}} not found",
    resourceUnavailableTitle: "{{resource}} unavailable",
    unavailableTitle: "Content unavailable"
  },
  genericErrors: {
    alreadyExists: "An account or record with these details already exists.",
    differentPassword:
      "Choose a password that is different from your current password.",
    fileDuplicate:
      "A file with these details already exists. Choose another file and try again.",
    fileTooLarge:
      "This file is too large to upload. Choose a smaller file and try again.",
    inUse: "This item is still in use and cannot be changed right now.",
    invalidCredentials:
      "The email or password is incorrect. Check your details and try again.",
    linkingDisabled:
      "Account linking is temporarily unavailable. Try again later.",
    methodAlreadyLinked: "That sign-in method is already linked to an account.",
    methodUnavailable: "That sign-in method is not available right now.",
    notFound: "The requested item could not be found.",
    permission: "You do not have permission to complete this action.",
    rateLimited: "Too many requests were made. Wait a moment and try again.",
    serviceUnavailable:
      "The service is temporarily unavailable. Try again shortly.",
    sessionExpired: "Your session has expired. Sign in and try again.",
    transport: "Check your internet connection and try again.",
    unconfirmedEmail: "Confirm your email address before signing in.",
    weakPassword: "Choose a stronger password and try again."
  },
  optional: "(optional)",
  validation: {
    email: "Enter a valid email address.",
    firstNameMax: "First name must be 80 characters or fewer.",
    firstNameRequired: "First name is required.",
    lastNameMax: "Last name must be 80 characters or fewer.",
    phone: "Enter a valid phone number.",
    phoneMax: "Phone number must be 40 characters or fewer."
  }
} as const;
