import { AuthContext } from "@/features/auth/providers/auth-context";
import { useContext } from "react";

export const useAuth = () => useContext(AuthContext);
