import "server-only";

import { z } from "zod";

const schema = z.object({
  IAM_ISSUER: z.url(),
  IAM_BACKEND_URL: z.url(),
  HRLITE_URL: z.url(),
  IAM_CLIENT_ID: z.string().min(1),
  IAM_CLIENT_SECRET: z.string().min(32),
  SESSION_SECRET: z.string().min(32),
});

let cached: z.infer<typeof schema> | null = null;

/**
 * Server-only settings for signing in through IAM (OpenID Connect). HR Lite is an ordinary
 * OAuth client of IAM: it sends browsers to the public issuer and talks to IAM server to server
 * through IAM_BACKEND_URL. Kept apart from `environment.ts` because these are secrets.
 */
export function iamConfig() {
  if (cached === null) {
    const parsed = schema.safeParse(process.env);

    if (!parsed.success) {
      throw new Error(
        `Sign-in through IAM is not configured: ${parsed.error.issues.map((issue) => issue.path.join(".")).join(", ")}. See .env.example.`,
      );
    }

    const strip = (url: string) => url.replace(/\/$/, "");
    cached = {
      ...parsed.data,
      IAM_ISSUER: strip(parsed.data.IAM_ISSUER),
      IAM_BACKEND_URL: strip(parsed.data.IAM_BACKEND_URL),
      HRLITE_URL: strip(parsed.data.HRLITE_URL),
    };
  }

  return cached;
}
