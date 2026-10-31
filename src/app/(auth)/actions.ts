"use server";

import axios from "axios";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

import { canOpenPath } from "@/constants/app-module-constant";
import { getLastUserCookie, removeTokenCookie, setLastUserCookie, setTokenCookie } from "@/lib/cookies";
import { authService } from "@/services";
import type { AuthFormState } from "@/types/auth";
import { signInSchema } from "@/validations/auth-validations";

/** Only relative paths, never back to the sign-in page. */
function isValidCallbackUrl(url: string): boolean {
  return url.startsWith("/") && !url.startsWith("//") && !url.startsWith("/sign-in");
}

export async function SignIn(prevState: AuthFormState, formData: FormData | null): Promise<AuthFormState> {
  const parsed = signInSchema.safeParse({
    email: formData?.get("email") as string,
    password: formData?.get("password") as string,
  });

  if (parsed.error) {
    return { status: "error", errors: parsed.error.flatten().fieldErrors };
  }

  const t = await getTranslations("auth.signIn");

  try {
    const result = await authService.signIn(parsed.data);
    const { token, ...user } = result.data ?? ({} as typeof result.data);

    if (!token || !user?.id) {
      return { status: "error", errors: { _form: [result.message ?? t("missingAuthData")] } };
    }

    const callbackUrl = formData?.get("callbackUrl") as string;
    const lastUserId = await getLastUserCookie();
    // The full identity (with permissions) decides whether the callback page is open to this user.
    const identity = await authService
      .meWithToken(token)
      .then((response) => response.data)
      .catch(() => undefined);

    await setTokenCookie(token);
    await setLastUserCookie(String(user.id));

    // `callback` is the page the previous session was on. Another account, or one that may not
    // open that page (any more), starts at `/` instead.
    const isSameUser = !lastUserId || lastUserId === String(user.id);
    const redirect =
      callbackUrl && isValidCallbackUrl(callbackUrl) && isSameUser && canOpenPath(callbackUrl, identity?.permissions ?? [])
        ? callbackUrl
        : "/";

    revalidatePath("/", "layout");

    return { status: "success", redirect, user: identity ?? user };
  } catch (error: unknown) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;

    if (status === 401 || status === 422) {
      return { status: "error", errors: { _form: [t("invalidCredentials")] } };
    }

    if (status === 429) {
      return { status: "error", errors: { _form: [t("tooManyRequests")] } };
    }

    const message =
      (axios.isAxiosError(error) && error.response?.data?.message) ||
      (error instanceof Error ? error.message : undefined) ||
      t("invalidCredentials");

    return { status: "error", errors: { _form: [message] } };
  }
}

/** Revokes the current token on the API, then clears the cookie. A dead token (401) still signs out locally. */
export async function SignOut(currentUrl?: string) {
  try {
    await authService.signOut();
  } catch (error) {
    if (!(axios.isAxiosError(error) && error.response?.status === 401)) {
      return { success: false, message: (await getTranslations("auth"))("signOutFailed") };
    }
  }

  await removeTokenCookie();

  const url = `/sign-in${currentUrl && isValidCallbackUrl(currentUrl) ? `?callback=${encodeURIComponent(currentUrl)}` : ""}`;

  return { success: true, url };
}
