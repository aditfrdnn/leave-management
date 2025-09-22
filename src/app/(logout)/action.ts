"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function logout(callbackUrl?: string) {
  const cookiesStore = await cookies();

  cookiesStore.delete("auth-user");

  return { ok: true };
}
