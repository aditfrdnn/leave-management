/** The one place that reads `process.env`. Everything else imports from here. */
export const environment = {
  DEV_URL: process.env.NEXT_PUBLIC_DEV_SERVER_URL,
  PROD_URL: process.env.NEXT_PUBLIC_PROD_SERVER_URL,
  TOKEN_KEY: process.env.TOKEN_KEY ?? "auth_token",
  /** The signed-in user, kept beside the token until the API has a `GET /api/me` (docs/backend-task.md §1). */
  USER_KEY: process.env.USER_KEY ?? "auth_user",
};
