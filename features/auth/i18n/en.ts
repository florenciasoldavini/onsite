export default {
  callback: {
    backProfile: "Back to Profile",
    backSignIn: "Back to Sign In",
    descriptionLink:
      "Return securely to your profile while the new sign-in method is confirmed.",
    descriptionSignIn:
      "The redirect handoff should still feel deliberate and structured while the session finalizes.",
    eyebrow: "Auth Callback / Redirect",
    failureLink: "We couldn't finish linking your account.",
    failureLinkAction:
      "We couldn't finish linking this sign-in method. Return to your profile and try again.",
    failureSignIn: "We couldn't finish the sign-in redirect.",
    failureSignInAction:
      "We couldn't finish signing you in. Return to sign in and try again.",
    linking: "Linking {{provider}}",
    loading: "Finishing secure access…",
    panelTag: "Auth / Callback",
    resolution: "Redirect / Session Resolution",
    signingIn: "Signing You In",
    status: "STATUS / HANDOFF IN PROGRESS / WAITING FOR SESSION CONFIRMATION",
    title: "Completing Your Access"
  },
  common: {
    apple: "Continue with Apple",
    email: "Email",
    google: "Continue with Google",
    password: "Password",
    passwordHint: "Use 8+ chars with uppercase, number, and symbol."
  },
  errors: {
    accountLoad:
      "We couldn't load your account. Check your connection and try again.",
    accountSetup:
      "We couldn't finish setting up your account. Sign out and back in, then try again.",
    dataService:
      "The app is not connected to its data service. Try again later.",
    oauthStart: "We couldn't start that sign-in method. Try again.",
    oauthStartSignUp: "We couldn't start that sign-up method. Try again.",
    profileUpdate:
      "We couldn't update your profile. Check your connection and try again.",
    sessionRestore: "We couldn't restore your session. Sign in and try again.",
    signIn: "We couldn't sign you in. Check your details and try again.",
    signOut: "We couldn't sign you out. Check your connection and try again.",
    signUp: "We couldn't create your account. Check your details and try again."
  },
  reset: {
    confirmPassword: "Confirm Password",
    descriptionRequest: "Request a secure reset link.",
    descriptionUpdate: "Set a new password for your account.",
    emailHint: "Enter the email tied to your account.",
    invalidLink:
      "We couldn't open this password recovery link. Request a new link and try again.",
    newPassword: "New Password",
    panelRequest: "Recovery / Request",
    panelUpdate: "Recovery / Update",
    prompt: "Remembered your password?",
    requestAction: "Send Reset Link",
    requestError: "We couldn't send the password reset email. Try again.",
    returnSignIn: "Return to Sign In",
    titleRequest: "Reset Your Password",
    titleUpdate: "Update Your Password",
    updateAction: "Update Password",
    updateError: "We couldn't update your password. Try again."
  },
  shell: {
    defaultPanelTag: "Access / Crew Portal"
  },
  signIn: {
    action: "Sign In",
    createAccount: "Create an Account",
    description: "Access your workspace.",
    divider: "OR CONTINUE WITH EMAIL",
    email: "Email Address",
    forgot: "Forgot?",
    panelTag: "Access / Sign In",
    password: "Secure Password",
    prompt: "New to the platform?",
    title: "Welcome Back"
  },
  signUp: {
    description: "Create your workspace access.",
    divider: "OR CREATE WITH EMAIL",
    panelTag: "Access / New Session",
    prompt: "Already have an account?",
    signIn: "Sign In",
    title: "Create Account"
  },
  validation: {
    confirmPassword: "Please confirm your password",
    emailInvalid: "Invalid email address",
    emailRequired: "Email is required",
    passwordLength: "Password must be at least 8 characters",
    passwordNumber: "Password must contain at least one number",
    passwordRequired: "Password is required",
    passwordsMatch: "Passwords do not match",
    passwordSpecial: "Password must contain at least one special character",
    passwordUppercase: "Password must contain at least one uppercase letter"
  },
  verify: {
    alreadyVerified: "Already verified it?",
    description: "Confirm your email address before entering the workspace.",
    emailLabel: "Email address",
    invalidEmail: "Go back to sign up and enter a valid email address.",
    missingEmail: "No email address was provided.",
    panelTag: "Access / Verify Email",
    resend: "Resend Verification Link",
    resendCountdown_one: "Resend in {{count}}s",
    resendCountdown_many: "Resend in {{count}}s",
    resendCountdown_other: "Resend in {{count}}s",
    resendError: "We couldn't resend the verification email. Try again.",
    sent: "Verification link sent. Check your inbox and spam folder.",
    signIn: "Sign In",
    title: "Check Your Email"
  }
} as const;
