import { USER_ROLES } from "@/features/auth/constants/user.constants";
import type { User } from "@/features/auth/types/auth.types";
import { z } from "zod";

export const UserSchema: z.ZodType<User> = z.object({
  id: z.string(),
  first_name: z.string(),
  last_name: z.string().nullable(),
  avatar: z.string().nullable(),
  email: z.string().email(),
  phone_number: z.string().nullable(),
  role: z.enum(USER_ROLES),
  welcome_email_sent_at: z.date().nullable(),
  created_at: z.date(),
  updated_at: z.date().nullable(),
  deleted_at: z.date().nullable()
});
