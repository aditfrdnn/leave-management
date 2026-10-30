import { myProfile } from "@/constants/endpoint-constant";
import instance from "@/lib/axios/instance";
import type { TApiResponse } from "@/types/api";
import type { TMyProfile } from "@/types/profile";

export const profileService = {
  async getMyProfile() {
    const { data } = await instance.get<TApiResponse<TMyProfile>>(myProfile);

    return data;
  },
};
