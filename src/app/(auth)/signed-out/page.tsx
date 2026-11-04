import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { SwitchAccountButton } from "./_components/switch-account-button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");

  return { title: t("metaTitle") };
}

const ERRORS = ["access_denied", "login_failed"] as const;

/** Where IAM sends the browser after signing out, or after a sign-in that did not finish. */
export default async function SignedOutPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const t = await getTranslations("auth.signedOut");
  const errorKey = error ? (ERRORS.find((known) => known === error) ?? "default") : null;

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="type-heading">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{errorKey ? t(`errors.${errorKey}`) : t("subtitle")}</p>
      </div>
      <Button asChild className="w-full">
        {/* A plain link: /auth/login hands over to IAM, which the client router cannot fetch. */}
        <a href="/auth/login">{t("signIn")}</a>
      </Button>
      {errorKey === "access_denied" && <SwitchAccountButton />}
    </div>
  );
}
