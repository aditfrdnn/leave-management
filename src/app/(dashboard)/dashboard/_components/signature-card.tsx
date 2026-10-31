"use client";

import { useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import LoadingButton from "@/components/common/loading-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslateMessage } from "@/hooks/use-translate-message";
import { isActionState } from "@/lib/action-state";
import { Delete02Icon, Upload04Icon } from "@hugeicons/core-free-icons";
import { DeleteMySignature, GetMySignature, SaveMySignature } from "../action";

export const MY_SIGNATURE_QUERY_KEY = ["home", "signature"] as const;

const MAX_BYTES = 2 * 1024 * 1024;
const MAX_WIDTH = 900;

/**
 * Scales the picked image down to MAX_WIDTH and re-encodes it as PNG, so phone photos stay
 * small enough for the upload. Transparency is kept.
 */
async function toSignaturePng(file: File): Promise<File> {
  const url = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = reject;
      element.src = url;
    });

    const scale = Math.min(1, MAX_WIDTH / image.naturalWidth);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);
    canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("encode");

    return new File([blob], "signature.png", { type: "image/png" });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Home card: upload, replace or remove the image signature used on appraisal reports. */
export default function SignatureCard() {
  const t = useTranslations("home.signature");
  const translateMessage = useTranslateMessage();
  const input = useRef<HTMLInputElement | null>(null);

  const { data, isLoading } = useQuery({ queryKey: MY_SIGNATURE_QUERY_KEY, queryFn: () => GetMySignature() });
  const signature = data?.signature ?? null;

  const failure = (title: string) => (error: unknown) => {
    const message = isActionState(error) ? translateMessage(error.errors?._form?.[0]) || translateMessage(error.errors?.signature?.[0]) || translateMessage(error.message) : undefined;

    toast.error(title, { description: message || (error instanceof Error ? error.message : undefined) });
  };

  const upload = useMutation({
    mutationFn: async (file: File) => {
      if (!["image/png", "image/jpeg"].includes(file.type)) throw new Error(t("errors.type"));
      if (file.size > MAX_BYTES) throw new Error(t("errors.size"));

      let png: File;
      try {
        png = await toSignaturePng(file);
      } catch {
        throw new Error(t("errors.read"));
      }

      const formData = new FormData();
      formData.append("signature", png);
      const state = await SaveMySignature(formData);
      if (state.status === "error") throw state;

      return state;
    },
    onSuccess: (state) => toast.success(translateMessage(state.message) || t("saved")),
    onError: failure(t("saveFailed")),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const state = await DeleteMySignature();
      if (state.status === "error") throw state;

      return state;
    },
    onSuccess: (state) => toast.success(translateMessage(state.message) || t("removed")),
    onError: failure(t("removeFailed")),
  });

  const isBusy = upload.isPending || remove.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {isLoading ? (
          <Skeleton className="h-28 w-full rounded-lg" />
        ) : signature ? (
          // White in both themes: the report is printed on white paper.
          <div className="flex h-28 items-center justify-center rounded-lg border bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- a data URI, nothing to optimise */}
            <img src={signature} alt={t("preview")} className="max-h-full max-w-full object-contain" />
          </div>
        ) : (
          <p className="flex h-28 items-center justify-center rounded-lg border border-dashed px-4 text-center text-sm text-muted-foreground">{t("empty")}</p>
        )}

        <input
          ref={input}
          type="file"
          accept="image/png,image/jpeg"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) upload.mutate(file);
          }}
        />

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" variant="outline" disabled={isBusy || isLoading} onClick={() => input.current?.click()}>
            {upload.isPending ? (
              <LoadingButton />
            ) : (
              <>
                <HugeiconsIcon icon={Upload04Icon} className="size-4" />
                {signature ? t("replace") : t("upload")}
              </>
            )}
          </Button>
          {signature && (
            <Button type="button" size="sm" variant="ghost" className="text-destructive" disabled={isBusy} onClick={() => remove.mutate()}>
              {remove.isPending ? (
                <LoadingButton />
              ) : (
                <>
                  <HugeiconsIcon icon={Delete02Icon} className="size-4" />
                  {t("remove")}
                </>
              )}
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{t("hint")}</p>
      </CardContent>
    </Card>
  );
}
