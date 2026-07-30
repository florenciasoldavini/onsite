export default {
  accessibility: {
    cancelDelete: "Cancel deleting supplier",
    mapShowing: "Map showing {{address}}",
    newSupplier: "New supplier",
    openSupplier: "Open {{name}}",
    sort: "Sort suppliers"
  },
  actions: {
    backToDirectory: "Back to directory",
    call: "Call",
    clearSearch: "Clear search",
    create: "Create supplier",
    delete: "Delete supplier",
    deleteShort: "Delete",
    edit: "Edit",
    email: "Email",
    loadMore: "Load more suppliers",
    new: "New supplier",
    open: "Open",
    openMaps: "Open in Maps",
    save: "Save changes"
  },
  breadcrumbs: {
    detail: "Supplier Detail",
    edit: "Edit",
    new: "New",
    suppliers: "Suppliers"
  },
  delete: {
    description:
      "This removes the supplier from your active catalog. This action cannot be undone.",
    title: "Delete {{name}}?"
  },
  detail: {
    address: "Address",
    contact: "Contact",
    contactDetails: "Contact details",
    deletedDescription: "{{name}} was removed from your supplier catalog.",
    deletedTitle: "Supplier deleted",
    email: "Email",
    location: "Location",
    noAddress: "No address",
    notes: "Notes",
    notProvided: "Not provided",
    noWebsite: "No website",
    phone: "Phone",
    profile: "SUPPLIER PROFILE",
    profileDescription: "Business record in your supplier catalog",
    website: "Website"
  },
  errors: {
    accountSetup:
      "We could not finish setting up your account. Sign out and back in, then try again.",
    delete: "We couldn't delete this supplier. Try again.",
    emailApp:
      "We couldn't open your email app. Copy the address and try it there.",
    listLoad:
      "We couldn't load your suppliers. Check your connection and try again.",
    listUnavailable: "Suppliers unavailable",
    load: "We couldn't load this supplier. Try again.",
    mapApp:
      "We couldn't open your maps app. Copy the address and try it there.",
    mapPreview: "Map preview is unavailable right now. Try again shortly.",
    phoneApp:
      "We couldn't open your phone app. Copy the number and try it there.",
    save: "We couldn't save this supplier. Check your connection and try again.",
    signIn: "You must be signed in to save suppliers.",
    website:
      "We couldn't open this website. Copy the address and try it in your browser."
  },
  fields: {
    address: "Address",
    contactName: "Contact name",
    email: "Email",
    name: "Supplier name",
    notes: "Notes",
    phone: "Phone number",
    website: "Website"
  },
  form: {
    createDescription:
      "Add a supplier's contact, website, and location details.",
    createTitle: "New supplier",
    editDescription:
      "Update the supplier information stored in your directory.",
    editTitle: "Edit supplier",
    notesPlaceholder:
      "Delivery details, preferred products, or other useful context"
  },
  list: {
    description:
      "Keep supplier contact and location details ready for your projects.",
    searchPlaceholder: "Search suppliers",
    title: "Suppliers"
  },
  search: {
    emptyDescription:
      "Add your first supplier to start building your directory.",
    emptyTitle: "No suppliers yet",
    noMatchDescription: "Try another name, contact, website, or address.",
    noMatchTitle: "No matching suppliers"
  },
  sort: {
    ascending: "A-Z",
    descending: "Z-A",
    label: "Sort",
    newest: "Newest",
    oldest: "Oldest"
  },
  toast: {
    createdDescription: "{{name}} was created successfully.",
    createdTitle: "Supplier created",
    updatedDescription: "{{name}} was updated successfully.",
    updatedTitle: "Supplier updated"
  },
  validation: {
    contactMax: "Contact name must be 160 characters or fewer.",
    nameMax: "Supplier name must be 120 characters or fewer.",
    nameMin: "Supplier name must be at least 2 characters.",
    notesMax: "Notes must be 2000 characters or fewer.",
    websiteInvalid: "Enter a valid HTTP or HTTPS website.",
    websiteMax: "Website must be 2048 characters or fewer."
  }
} as const;
