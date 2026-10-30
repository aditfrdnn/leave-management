import { z } from "zod";

export const signInSchema = z.object({
  email: z.email("auth.validation.emailInvalid"),
  password: z.string().min(1, "auth.validation.passwordRequired"),
});

export type SignInSchemaType = z.infer<typeof signInSchema>;
