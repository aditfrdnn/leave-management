"use server";

import { getTranslations } from "next-intl/server";

import { toApiErrorMessage } from "@/lib/api-error";
import { profileService } from "@/services";
import type { TMyProfile } from "@/types/profile";

export async function GetMyProfile(): Promise<TMyProfile> {
  try {
    const response = await profileService.getMyProfile();

    return response.data;
  } catch (error) {
    throw new Error(toApiErrorMessage(error, (await getTranslations("home"))("errors.load")));
  }
}
