export default {
  accessibility: {
    backToClient: "Back to client",
    backToClientDetail: "Back to client detail",
    backToClients: "Back to clients",
    cancelDelete: "Cancel deleting client",
    closeQuickCreate: "Close quick-create client",
    newClient: "New client",
    openClient: "Open {{name}}",
    sort: "Sort clients"
  },
  actions: {
    clearSearch: "Clear search",
    create: "Create client",
    delete: "Delete client",
    loadMore: "Load more clients",
    new: "New client",
    save: "Save changes"
  },
  breadcrumbs: {
    client: "Client",
    detail: "Client Detail",
    edit: "Edit",
    new: "New"
  },
  delete: {
    checkingProjects: "Checking linked projects…",
    checkProjectsError:
      "We couldn't check linked projects. Close this message and try again.",
    description:
      "This removes the client from your active catalog and unlinks active projects.",
    descriptionUnlinked: "This removes the client from your active catalog.",
    linkedProjects_one:
      "This client is linked to {{count}} project. Deleting the client will unlink it from that project.",
    linkedProjects_many:
      "This client is linked to {{count}} projects. Deleting the client will unlink them from those projects.",
    linkedProjects_other:
      "This client is linked to {{count}} projects. Deleting the client will unlink them from those projects.",
    title: "Delete {{name}}?"
  },
  detail: {
    contactDetails: "Contact details",
    deletedDescription: "{{name}} was deleted successfully.",
    deletedTitle: "Client deleted",
    email: "Email",
    linkedProjects: "Linked projects",
    linkedProjectsDescription: "Projects using this client contact",
    linkedProjectsError: "We couldn't load linked projects. Try again.",
    linkedProjectsUnavailable: "Projects unavailable",
    loadMoreProjects: "Load more projects",
    noLinkedProjects: "No linked projects",
    noLinkedProjectsDescription:
      "Select this client when creating or editing a project.",
    notProvided: "Not provided",
    phone: "Phone",
    primary: "PRIMARY",
    profile: "CLIENT PROFILE",
    profileDescription: "Contact record for your project catalog",
    viewProjects: "View projects"
  },
  errors: {
    accountSetup:
      "We could not finish setting up your account. Sign out and back in, then try again.",
    create: "We couldn't create this client. Try again.",
    delete: "We couldn't delete this client. Try again.",
    editForbidden: "You don't have permission to edit this client.",
    editUnavailable: "Client editing unavailable",
    listUnavailable: "Clients unavailable",
    load: "We couldn't load this client. Try again.",
    loadList:
      "We couldn't load your clients. Check your connection and try again.",
    save: "We couldn't save this client. Check your connection and try again.",
    signIn: "You must be signed in to save clients."
  },
  fields: {
    client: "Client",
    email: "Email",
    firstName: "First name",
    lastName: "Last name",
    phone: "Phone number"
  },
  form: {
    createDescription:
      "Add contact details now and link the client to projects when needed.",
    createTitle: "New client",
    editDescription:
      "Update the contact details stored in your client catalog.",
    editTitle: "Edit client"
  },
  list: {
    description: "Keep client contact details connected to the right projects.",
    noEmail: "No email address",
    noPhone: "No phone number",
    searchPlaceholder: "Search clients",
    title: "Clients"
  },
  picker: {
    entities: "clients",
    entity: "client",
    label: "Client",
    quickCreate: "Quick-create client"
  },
  search: {
    emptyDescription:
      "Add your first client to connect their contact details to projects.",
    emptyTitle: "No clients yet",
    noMatchDescription: "Try another name, phone number, or email.",
    noMatchTitle: "No matching clients"
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
    createdTitle: "Client created",
    updatedDescription: "{{name}} was updated successfully.",
    updatedTitle: "Client updated"
  }
} as const;
