import { redirect } from "next/navigation";

/** Old bookmarks: signing in happens at IAM now. */
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const callback = (params.callbackUrl as string) || (params.callback as string) || "/";

  redirect(`/auth/login?returnTo=${encodeURIComponent(callback)}`);
}
