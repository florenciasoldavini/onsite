export default {
  accessibility: {
    backToDetail: "Back to contractor detail",
    backToDirectory: "Back to contractor directory",
    cancelDelete: "Cancel deleting contractor",
    new: "New contractor",
    open: "Open {{name}}",
    sort: "Sort contractors"
  },
  actions: {
    call: "Call",
    clearSearch: "Clear search",
    create: "Create contractor",
    delete: "Delete contractor",
    loadMore: "Load more contractors",
    new: "New contractor",
    save: "Save changes"
  },
  breadcrumbs: {
    contractors: "Contractors",
    detail: "Contractor Detail",
    edit: "Edit",
    new: "New"
  },
  delete: {
    description:
      "This removes the contractor from your active catalog. This action cannot be undone.",
    title: "Delete {{name}}?"
  },
  detail: {
    contactDetails: "Contact details",
    deletedDescription: "{{name}} was deleted successfully.",
    deletedTitle: "Contractor deleted",
    email: "Email",
    emailError:
      "We couldn't open your email app. Copy the address and try it there.",
    notProvided: "Not provided",
    phone: "Phone",
    phoneError:
      "We couldn't open your phone app. Copy the number and try it there.",
    primary: "PRIMARY",
    profile: "CONTRACTOR PROFILE",
    profileDescription: "Contact record for your contractor catalog"
  },
  errors: {
    accountSetup:
      "We could not finish setting up your account. Sign out and back in, then try again.",
    delete: "We couldn't delete this contractor. Try again.",
    listUnavailable: "Contractors unavailable",
    load: "We couldn't load this contractor. Try again.",
    loadList:
      "We couldn't load your contractors. Check your connection and try again.",
    save: "We couldn't save this contractor. Check your connection and try again.",
    signIn: "You must be signed in to save contractors."
  },
  fields: {
    contractor: "Contractor",
    email: "Email",
    firstName: "First name",
    lastName: "Last name",
    phone: "Phone number"
  },
  form: {
    createDescription: "Add a contractor contact now and assign workers later.",
    createTitle: "New contractor",
    editDescription:
      "Update the contact details stored in your contractor catalog.",
    editTitle: "Edit contractor"
  },
  list: {
    description:
      "Keep contractor contact details ready for future worker assignments.",
    noEmail: "No email address",
    noPhone: "No phone number",
    searchPlaceholder: "Search contractors",
    title: "Contractors"
  },
  picker: {
    entities: "contractors",
    entity: "contractor",
    label: "Contractor"
  },
  search: {
    emptyDescription:
      "Add your first contractor to start building your directory.",
    emptyTitle: "No contractors yet",
    noMatchDescription: "Try another name, phone number, or email.",
    noMatchTitle: "No matching contractors"
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
    createdTitle: "Contractor created",
    updatedDescription: "{{name}} was updated successfully.",
    updatedTitle: "Contractor updated"
  }
} as const;
