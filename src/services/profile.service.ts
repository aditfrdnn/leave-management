import { myProfile, mySignature } from "@/constants/endpoint-constant";
import instance from "@/lib/axios/instance";
import type { TApiResponse } from "@/types/api";
import type { TMyProfile, TMySignature } from "@/types/profile";

export const profileService = {
  async getMyProfile() {
    const { data } = await instance.get<TApiResponse<TMyProfile>>(myProfile);

    return data;
  },

  async getMySignature() {
    const { data } = await instance.get<TApiResponse<TMySignature>>(mySignature);

    return data;
  },

  /** `file` is a PNG or JPG; the API re-encodes it and stores it privately. */
  async uploadMySignature(file: File) {
    const formData = new FormData();
    formData.append("signature", file);

    const { data } = await instance.post<TApiResponse<TMySignature>>(mySignature, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return data;
  },

  async deleteMySignature() {
    const { data } = await instance.delete<TApiResponse<TMySignature>>(mySignature);

    return data;
  },
};
