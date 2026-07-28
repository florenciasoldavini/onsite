import type { EditableUserProfile } from "@/features/auth/services/auth-session.service";
import type { User } from "@/features/auth/types/auth.types";
import type { ProfileAvatarAsset } from "@/features/profile/services/profile.service";
import type { Session } from "@supabase/supabase-js";
import { createContext } from "react";

export interface AuthContextValue {
  authError: string | null;
  createUser: (
    session: Session,
    profile?: Partial<User>
  ) => Promise<User | null>;
  isLoading: boolean;
  logOut: () => Promise<void>;
  session: Session | null;
  updateUserProfile: (
    profile: Partial<EditableUserProfile>,
    avatarAsset?: ProfileAvatarAsset | null
  ) => Promise<User | null>;
  user: User | null;
}

export const AuthContext = createContext<AuthContextValue>({
  authError: null,
  createUser: async () => null,
  isLoading: true,
  logOut: async () => {},
  session: null,
  updateUserProfile: async () => null,
  user: null
});
