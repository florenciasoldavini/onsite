export default {
  info: {
    avatarAccessibility: "Change profile photo",
    avatarError: "Profile photo unavailable. Try refreshing the page.",
    firstName: "First name",
    lastName: "Last Name",
    personalDetails: "Personal details",
    phone: "Phone",
    photoDenied:
      "Photo access is disabled. Enable it in your device settings, then try again.",
    photoError: "We couldn't open your photo library. Try again.",
    photoPermission:
      "Photo access is required to choose a profile picture. Allow access and try again.",
    profile: "Profile",
    save: "Save Profile",
    signInError: "You must be signed in to update your profile.",
    updated: "Profile updated"
  },
  methods: {
    apple: "Apple",
    appleSupporting: "Apple account",
    checking: "Checking linked methods...",
    connected: "Connected access",
    connecting: "Connecting {{provider}}...",
    email: "Email",
    emailSupporting: "Password access",
    google: "Google",
    googleSupporting: "Google account",
    link: "Link",
    linkAccessibility: "Link {{provider}} sign-in",
    linked: "Linked",
    linkedStatus: "{{provider}} sign-in linked.",
    linkError: "We couldn't confirm the {{provider}} link. Try again.",
    title: "Sign-In Methods"
  },
  security: {
    change: "Change Password",
    confirm: "Confirm Password",
    heading: "Account Security",
    newPassword: "New Password",
    passwordHint: "Use 8+ chars with uppercase, number, and symbol.",
    settings: "Password settings",
    updated: "Password updated."
  },
  workspace: {
    logout: "Log Out",
    methods: "Sign-In",
    profile: "Profile",
    security: "Security",
    title: "Profile"
  }
} as const;
