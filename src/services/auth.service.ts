import axios from "axios";

import { me, signIn, signOut } from "@/constants/endpoint-constant";
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
