"use server";

import { cookies } from "next/headers";

export default async function useCookies() {
  let token;

  const cookiesStore = await cookies();
  const authUser = JSON.parse(cookiesStore.get("auth-user")?.value ?? "{}");

  if (authUser !== undefined || authUser !== null) {
    token = authUser?.token;
  }

  return {
    token,
    authUser,
  };
}
