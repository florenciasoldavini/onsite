export default {
  accessibility: {
    backToDetail: "Back to worker detail",
    backToDirectory: "Back to worker directory",
    cancelDelete: "Cancel deleting worker",
    filterContractor: "Filter workers by contractor",
    new: "New worker",
    open: "Open {{name}}",
    sort: "Sort workers"
  },
  actions: {
    call: "Call",
    clearFilters: "Clear filters",
    create: "Create worker",
    delete: "Delete worker",
    loadMore: "Load more workers",
    new: "New worker",
    open: "Open",
    save: "Save changes"
  },
  breadcrumbs: {
    detail: "Worker Detail",
    edit: "Edit",
    new: "New",
    workers: "Workers"
  },
  delete: {
    description:
      "This removes the worker from your active catalog. This action cannot be undone.",
    title: "Delete {{name}}?"
  },
  detail: {
    contactDetails: "Contact details",
    contractor: "Contractor",
    deletedDescription: "{{name}} was deleted successfully.",
    deletedTitle: "Worker deleted",
    email: "Email",
    emailError:
      "We couldn't open your email app. Copy the address and try it there.",
    independent: "Independent worker",
    notProvided: "Not provided",
    noTrades: "No trade categories selected",
    phone: "Phone",
    phoneError:
      "We couldn't open your phone app. Copy the number and try it there.",
    primary: "PRIMARY",
    profile: "WORKER PROFILE",
    profileDescription: "Contact and work profile for your worker catalog",
    relationships: "Work relationships",
    tradeCategories: "Trade categories"
  },
  errors: {
    accountSetup:
      "We could not finish setting up your account. Sign out and back in, then try again.",
    delete: "We couldn't delete this worker. Try again.",
    listUnavailable: "Workers unavailable",
    load: "We couldn't load this worker. Try again.",
    loadList:
      "We couldn't load your workers. Check your connection and try again.",
    save: "We couldn't save this worker. Check your connection and try again.",
    signIn: "You must be signed in to save workers."
  },
  fields: {
    contractor: "Contractor",
    email: "Email",
    firstName: "First name",
    lastName: "Last name",
    loadingTrades: "Loading trade categories…",
    loadMoreTrades: "Load more trade categories",
    phone: "Phone number",
    tradeCategories: "Trade categories",
    tradeHelper: "Select the types of work this worker usually performs.",
    tradeLoadError: "We couldn't load trade categories.",
    worker: "Worker"
  },
  filters: {
    all: "All",
    contractor: "Contractor",
    loadMoreContractors: "Load more contractor filters",
    loadMoreTrades: "Load more trade filters",
    trade: "Filter by trade",
    tradeHelper: "Workers matching any selected trade will be shown."
  },
  form: {
    createDescription:
      "Add a worker and record their contractor and usual trades.",
    createTitle: "New worker",
    editDescription:
      "Update this worker's contact details and catalog relationships.",
    editTitle: "Edit worker"
  },
  list: {
    description: "Manage worker contacts, contractors, and usual trades.",
    independent: "Independent worker",
    noTrades: "No trade categories selected",
    searchPlaceholder: "Search workers",
    title: "Workers"
  },
  search: {
    emptyDescription: "Add your first worker to start building your directory.",
    emptyTitle: "No workers yet",
    noMatchDescription: "Try another name, contractor, or trade category.",
    noMatchTitle: "No matching workers"
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
    createdTitle: "Worker created",
    updatedDescription: "{{name}} was updated successfully.",
    updatedTitle: "Worker updated"
  }
} as const;
