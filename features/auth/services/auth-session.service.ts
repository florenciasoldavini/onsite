import {
  AuthProfileRepositoryError,
  findAuthProfileById,
  insertAuthProfile,
  updateAuthProfileBackfill,
  type AuthProfileBackfill,
  type AuthProfileInsert
} from "@/features/auth/repositories/auth-profile.repository";
import {
  getCurrentAuthSession,
  isAuthSessionAvailable,
  observeAuthSession,
  signOutAuthSession
} from "@/features/auth/repositories/auth.repository";
import type { ProfileAvatarAsset } from "@/features/profile/repositories/profile-avatar.repository";
import { saveProfile } from "@/features/profile/services/profile.service";
import { Sentry } from "@/infrastructure/monitoring/sentry";
import { UserFacingError } from "@/shared/utils/user-facing-errors";
import { sendWelcomeToOnzaitEmail } from "@/features/auth/services/welcome-email.service";
import type { User } from "@/features/auth/types/auth.types";
import type { SupportedLanguage } from "@/features/localization/types/language";
import { defaultLanguage } from "@/features/localization/types/language";
import type { Session } from "@supabase/supabase-js";

export type EditableUserProfile = Pick<
  User,
  "avatar" | "first_name" | "last_name" | "phone_number"
>;

type AuthProfileMetadata = Record<string, unknown>;

const welcomeEmailAttempts = new Set<string>();

function getCleanString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getMetadataValue(
  metadataSources: AuthProfileMetadata[],
  keys: string[]
) {
  for (const metadata of metadataSources) {
    for (const key of keys) {
      const value = getCleanString(metadata[key]);

      if (value) {
        return value;
      }
    }
  }

  return null;
}

function getNameParts(fullName: string | null) {
  if (!fullName) {
    return { firstName: null, lastName: null };
  }

  const parts = fullName.split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0] ?? null,
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : null
  };
}

function getEmailName(email: string) {
  return email.split("@")[0] || "User";
}

function getAuthMetadataSources(session: Session) {
  return [
    session.user.user_metadata,
    ...(session.user.identities ?? []).map(
      (identity) => identity.identity_data ?? {}
    )
  ] satisfies AuthProfileMetadata[];
}

export function buildAuthProfile(
  session: Session,
  profile?: Partial<User>
): AuthProfileInsert {
  const email = (session.user.email ?? profile?.email ?? "")
    .trim()
    .toLowerCase();
  const emailName = getEmailName(email);
  const metadataSources = getAuthMetadataSources(session);
  const fullName =
    getMetadataValue(metadataSources, ["full_name", "name", "display_name"]) ??
    getMetadataValue(metadataSources, ["fullName", "displayName"]);
  const { firstName: fullNameFirstName, lastName: fullNameLastName } =
    getNameParts(fullName);

  return {
    avatar:
      getCleanString(profile?.avatar) ??
      getMetadataValue(metadataSources, ["avatar_url", "picture", "avatar"]) ??
      getMetadataValue(metadataSources, ["photo_url", "photoURL"]) ??
      null,
    email,
    first_name:
      getCleanString(profile?.first_name) ??
      getMetadataValue(metadataSources, ["first_name", "given_name"]) ??
      getMetadataValue(metadataSources, ["firstName", "givenName"]) ??
      fullNameFirstName ??
      emailName,
    id: session.user.id,
    last_name:
      getCleanString(profile?.last_name) ??
      getMetadataValue(metadataSources, ["last_name", "family_name"]) ??
      getMetadataValue(metadataSources, ["lastName", "familyName"]) ??
      fullNameLastName ??
      null,
    phone_number:
      getCleanString(profile?.phone_number) ??
      getMetadataValue(metadataSources, ["phone_number", "phone"]) ??
      getMetadataValue(metadataSources, ["phoneNumber"]) ??
      null,
    role: "user"
  };
}

export function getAuthProfileBackfill(
  existingUser: User,
  session: Session
): AuthProfileBackfill | null {
  const authProfile = buildAuthProfile(session);
  const emailName = getEmailName(authProfile.email).toLowerCase();
  const patch: AuthProfileBackfill = {};
  const existingFirstName = existingUser.first_name.trim().toLowerCase();
  const authFirstName = authProfile.first_name.trim();

  if (
    authFirstName &&
    authFirstName.toLowerCase() !== emailName &&
    (!existingFirstName || existingFirstName === emailName)
  ) {
    patch.first_name = authFirstName;
  }

  if (!existingUser.last_name && authProfile.last_name) {
    patch.last_name = authProfile.last_name;
  }

  if (!existingUser.avatar && authProfile.avatar) {
    patch.avatar = authProfile.avatar;
  }

  if (!existingUser.phone_number && authProfile.phone_number) {
    patch.phone_number = authProfile.phone_number;
  }

  return Object.keys(patch).length > 0 ? patch : null;
}

export function hasAuthSessionSupport() {
  return isAuthSessionAvailable();
}

export function loadCurrentAuthSession() {
  return getCurrentAuthSession();
}

export function subscribeToAuthSession(
  listener: (session: Session | null) => void
) {
  return observeAuthSession(listener);
}

export function logOutCurrentSession() {
  return signOutAuthSession();
}

export async function createAuthUser(
  session: Session,
  profile?: Partial<User>
) {
  const payload = buildAuthProfile(session, profile);

  try {
    return await insertAuthProfile(payload);
  } catch (error) {
    if (
      error instanceof AuthProfileRepositoryError &&
      error.code === "duplicate"
    ) {
      const existingUser = await findAuthProfileById(session.user.id);

      if (existingUser) {
        return existingUser;
      }

      throw new UserFacingError(
        "This email is already linked to another account. Sign in using the method you used previously.",
        error
      );
    }

    throw error;
  }
}

export async function hydrateAuthUser(session: Session) {
  const existingUser = await findAuthProfileById(session.user.id);

  if (!existingUser) {
    return createAuthUser(session);
  }

  const backfill = getAuthProfileBackfill(existingUser, session);

  if (!backfill) {
    return existingUser;
  }

  try {
    return await updateAuthProfileBackfill({
      profile: backfill,
      userId: session.user.id
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { auth_profile: "metadata-backfill" }
    });
    return existingUser;
  }
}

export function updateAuthenticatedUserProfile({
  avatarAsset,
  currentUser,
  profile,
  session
}: {
  avatarAsset?: ProfileAvatarAsset | null;
  currentUser: User;
  profile: Partial<EditableUserProfile>;
  session: Session;
}) {
  return saveProfile({
    avatarAsset,
    currentAvatarReference: currentUser.avatar,
    profile: {
      avatar: profile.avatar?.trim() || null,
      first_name: profile.first_name?.trim() ?? currentUser.first_name,
      last_name: profile.last_name?.trim() || null,
      phone_number: profile.phone_number?.trim() || null
    },
    userId: session.user.id
  });
}

export async function deliverWelcomeEmailIfNeeded(
  user: User,
  language: SupportedLanguage = defaultLanguage
) {
  if (user.welcome_email_sent_at || welcomeEmailAttempts.has(user.id)) {
    return user;
  }

  welcomeEmailAttempts.add(user.id);

  try {
    const result = await sendWelcomeToOnzaitEmail({
      language,
      name: user.first_name
    });
    const sentAt = result?.welcome_email_sent_at;

    return sentAt ? { ...user, welcome_email_sent_at: new Date(sentAt) } : user;
  } catch (error) {
    Sentry.captureException(error, {
      tags: { auth_profile: "welcome-email" }
    });
    return user;
  }
}
