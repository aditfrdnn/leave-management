"use server";

import { getTranslations } from "next-intl/server";

import { toApiErrorMessage, toApiErrorState, toFormErrorState } from "@/lib/api-error";
import { profileService } from "@/services";
import type { ActionState } from "@/types/action-state";
import type { TMyProfile, TMySignature } from "@/types/profile";

/** Matches the API rule (`mimes:png,jpg,jpeg`, `max:2048`). */
const SIGNATURE_TYPES = ["image/png", "image/jpeg"];
const SIGNATURE_MAX_BYTES = 2 * 1024 * 1024;

export async function GetMyProfile(): Promise<TMyProfile> {
  try {
    const response = await profileService.getMyProfile();

    return response.data;
  } catch (error) {
    throw new Error(toApiErrorMessage(error, (await getTranslations("home"))("errors.load")));
  }
}

export async function GetMySignature(): Promise<TMySignature> {
  try {
    const response = await profileService.getMySignature();

    return response.data;
  } catch (error) {
    throw new Error(toApiErrorMessage(error, (await getTranslations("home"))("signature.errors.load")));
  }
}

export async function SaveMySignature(formData: FormData): Promise<ActionState<TMySignature>> {
  const t = await getTranslations("home.signature");
  const file = formData.get("signature");

  if (!(file instanceof File) || file.size === 0) return toFormErrorState(t("errors.required"));
  if (!SIGNATURE_TYPES.includes(file.type)) return toFormErrorState(t("errors.type"));
  if (file.size > SIGNATURE_MAX_BYTES) return toFormErrorState(t("errors.size"));

  try {
    const result = await profileService.uploadMySignature(file);

    return { status: "success", message: result.message, data: result.data };
  } catch (error) {
    return toApiErrorState(error, t("errors.save"));
  }
}

export async function DeleteMySignature(): Promise<ActionState<TMySignature>> {
  const t = await getTranslations("home.signature");

  try {
    const result = await profileService.deleteMySignature();

    return { status: "success", message: result.message, data: result.data };
  } catch (error) {
    return toApiErrorState(error, t("errors.delete"));
  }
}
