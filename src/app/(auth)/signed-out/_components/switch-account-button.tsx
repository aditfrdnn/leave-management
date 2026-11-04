"use client";

import { useTranslations } from "next-intl";
import { useTransition } from "react";

import { SignOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

/** Ends the IAM session too, so the next sign-in can use another account. */
export function SwitchAccountButton() {
  const t = useTranslations("auth.signedOut");
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      className="w-full"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const { url } = await SignOut();
          window.location.assign(url);
        })
      }
    >
      {t("switchAccount")}
    </Button>
  );
}
