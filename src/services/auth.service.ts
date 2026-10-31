import axios from "axios";

import { environment } from "@/configs/environment";
import { me, meBackend, signIn, signOut } from "@/constants/endpoint-constant";
import instance from "@/lib/axios/instance";
import type { TApiResponse } from "@/types/api";
import type { TLoginData, TUser } from "@/types/auth";

export const authService = {
  /**
   * Same-origin call to `src/app/api/me/route.ts`, which reads the httpOnly cookies on the
   * server. The bare `axios` here is deliberate (RULES §6).
   */
  async me() {
    const { data } = await axios.get<TApiResponse<TUser>>(me);

    return data;
  },

  /**
   * `GET /api/me` for a token that is not in the cookie yet (the sign-in action, before it decides
   * where to go). Server-side only.
   */
  async meWithToken(token: string) {
    const { data } = await axios.get<TApiResponse<TUser>>(`${environment.DEV_URL || environment.PROD_URL}${meBackend}`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      timeout: 15 * 1000,
    });

    return data;
  },

  async signIn(payload: { email: string; password: string }) {
    const { data } = await instance.post<TApiResponse<TLoginData>>(signIn, payload);

    return data;
  },

  /** Revokes every token of the signed-in user (`DELETE /api/auth/logout`). */
  async signOut() {
    const { data } = await instance.delete<TApiResponse<never[]>>(signOut);

    return data;
  },
};
