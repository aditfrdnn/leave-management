"use server";

import { cookies } from "next/headers";

export default async function useCookies() {
  let token;

  const cookiesStore = await cookies();
  try {
    const authUser = JSON.parse(cookiesStore.get("auth-user")?.value ?? "{}");

    if (authUser && Object.keys(authUser).length > 0) {
      token = authUser?.token;
    }

    return {
      token,
      authUser,
    };
  } catch (error) {
    console.error("Failed to parse auth-user cookie:", error);
    return {
      token: undefined,
      authUser: {},
    };
  }
}
