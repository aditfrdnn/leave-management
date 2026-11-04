import axios from "axios";

import { me } from "@/constants/endpoint-constant";
import type { TApiResponse } from "@/types/api";
import type { TUser } from "@/types/auth";

export const authService = {
  /**
   * Same-origin call to `src/app/api/me/route.ts`, which reads the httpOnly cookies on the
   * server. The bare `axios` here is deliberate (RULES §6).
   */
  async me() {
    const { data } = await axios.get<TApiResponse<TUser>>(me);

    return data;
  },
};
