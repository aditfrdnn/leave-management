"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { RotateLeft01Icon } from "@hugeicons/core-free-icons";

/** Rendered by a route's `error.tsx`: names the page, toasts the message, offers a retry. */
export default function ErrorState({ title, error, reset }: { title: string; error: Error; reset: () => void }) {
  const t = useTranslations("common.pageState");

  useEffect(() => {
    toast.error(title, { description: error.message });
  }, [title, error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
      <h1 className="type-page-title">{title}</h1>
      <p className="max-w-md text-sm text-muted-foreground">{t("errorDescription")}</p>
      <Button size="sm" variant="outlinePrimary" onClick={reset}>
        <HugeiconsIcon icon={RotateLeft01Icon} />
        {t("retry")}
      </Button>
    </div>
  );
}
