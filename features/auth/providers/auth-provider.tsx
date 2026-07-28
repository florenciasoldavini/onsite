import {
  createAuthUser,
  deliverWelcomeEmailIfNeeded,
  hasAuthSessionSupport,
  hydrateAuthUser,
  loadCurrentAuthSession,
  logOutCurrentSession,
  subscribeToAuthSession,
  updateAuthenticatedUserProfile,
  type EditableUserProfile
} from "@/features/auth/services/auth-session.service";
import { AuthContext } from "@/features/auth/providers/auth-context";
import type { ProfileAvatarAsset } from "@/features/profile/services/profile.service";
import { Sentry } from "@/infrastructure/monitoring/sentry";
import { getUserFacingErrorMessage } from "@/shared/utils/user-facing-errors";
import type { User } from "@/features/auth/types/auth.types";
import type { Session } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";

const defaultAuthError = hasAuthSessionSupport()
  ? null
  : "The app is not connected to its data service. Try again later.";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authError, setAuthError] = useState<string | null>(defaultAuthError);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const authTransitionRef = useRef(0);

  const setAuthenticatedUser = useCallback((nextUser: User) => {
    setUser(nextUser);
    setAuthError(null);

    void deliverWelcomeEmailIfNeeded(nextUser).then((welcomedUser) => {
      setUser((currentUser) =>
        currentUser?.id === welcomedUser.id &&
        welcomedUser.welcome_email_sent_at
          ? {
              ...currentUser,
              welcome_email_sent_at: welcomedUser.welcome_email_sent_at
            }
          : currentUser
      );
    });
  }, []);

  const createUser = async (
    nextSession: Session,
    profile?: Partial<User>
  ): Promise<User | null> => {
    try {
      const nextUser = await createAuthUser(nextSession, profile);
      setAuthenticatedUser(nextUser);
      return nextUser;
    } catch (error) {
      setAuthError(
        getUserFacingErrorMessage(
          error,
          "We couldn't finish setting up your account. Sign out and back in, then try again."
        )
      );
      return null;
    }
  };

  const updateUserProfile = async (
    profile: Partial<EditableUserProfile>,
    avatarAsset?: ProfileAvatarAsset | null
  ): Promise<User | null> => {
    if (!session || !user) {
      return null;
    }

    try {
      const nextUser = await updateAuthenticatedUserProfile({
        avatarAsset,
        currentUser: user,
        profile,
        session
      });
      setUser(nextUser);
      setAuthError(null);
      return nextUser;
    } catch (error) {
      setAuthError(
        getUserFacingErrorMessage(
          error,
          "We couldn't update your profile. Check your connection and try again."
        )
      );
      throw error;
    }
  };

  const hydrateUser = useCallback(
    async (nextSession: Session | null) => {
      const transition = ++authTransitionRef.current;
      setSession(nextSession);

      if (!nextSession) {
        setUser(null);
        setAuthError(null);
        return;
      }

      try {
        const nextUser = await hydrateAuthUser(nextSession);

        if (transition === authTransitionRef.current) {
          setAuthenticatedUser(nextUser);
        }
      } catch (error) {
        if (transition === authTransitionRef.current) {
          setAuthError(
            getUserFacingErrorMessage(
              error,
              "We couldn't load your account. Check your connection and try again."
            )
          );
          setUser(null);
        }
      }
    },
    [setAuthenticatedUser]
  );

  const logOut = async () => {
    try {
      await logOutCurrentSession();
      authTransitionRef.current += 1;
      setSession(null);
      setUser(null);
      setAuthError(null);
    } catch (error) {
      setAuthError(
        getUserFacingErrorMessage(
          error,
          "We couldn't sign you out. Check your connection and try again."
        )
      );
    }
  };

  useEffect(() => {
    if (!session && !user) {
      Sentry.setUser(null);
      return;
    }

    Sentry.setUser({
      email: user?.email ?? session?.user.email,
      id: user?.id ?? session?.user.id,
      username:
        [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
        undefined
    });
    Sentry.setTag("auth_state", session ? "authenticated" : "anonymous");
    Sentry.setTag("user_role", user?.role ?? "unknown");
  }, [session, user]);

  useEffect(() => {
    if (!hasAuthSessionSupport()) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const finishHydration = async (nextSession: Session | null) => {
      await hydrateUser(nextSession);

      if (isMounted) {
        setIsLoading(false);
      }
    };

    void loadCurrentAuthSession()
      .then((nextSession) => finishHydration(nextSession))
      .catch((error) => {
        if (isMounted) {
          setAuthError(
            getUserFacingErrorMessage(
              error,
              "We couldn't restore your session. Sign in and try again."
            )
          );
          setSession(null);
          setUser(null);
          setIsLoading(false);
        }
      });

    const unsubscribe = subscribeToAuthSession((nextSession) => {
      void finishHydration(nextSession);
    });

    return () => {
      isMounted = false;
      authTransitionRef.current += 1;
      unsubscribe();
    };
  }, [hydrateUser]);

  return (
    <AuthContext.Provider
      value={{
        authError,
        createUser,
        isLoading,
        logOut,
        session,
        updateUserProfile,
        user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
