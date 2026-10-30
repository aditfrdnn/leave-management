import { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { BrandLogo, BrandMark } from "@/components/common/brand-logo";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const t = await getTranslations("auth.layout");

  return (
    <div className="mx-auto grid h-full min-h-svh max-w-7xl lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <div className="flex justify-center gap-2 md:justify-start">
          <BrandLogo aria-label={t("brand")} />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">{children}</div>
        </div>
        <p className="text-xs text-muted-foreground">{t("copyright")}</p>
      </div>

      {/* Brand panel: the primary color as a soft gradient, no stock photo. */}
      <div className="relative hidden max-h-screen overflow-hidden p-4 lg:flex">
        <div className="relative flex h-full w-full flex-col justify-end overflow-hidden rounded-2xl bg-primary p-12 text-primary-foreground">
          <div className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-16 size-96 rounded-full bg-black/15 blur-3xl" />
          <div className="relative flex flex-col gap-4">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
              <BrandMark className="size-9 text-white" />
            </div>
            <h1 className="type-display max-w-xl">{t.rich("headline", { br: () => <br /> })}</h1>
            <p className="max-w-lg text-sm text-primary-foreground/80">{t("tagline")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
