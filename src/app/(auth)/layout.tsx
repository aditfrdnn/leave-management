import { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { BrandLogo } from "@/components/common/brand-logo";
import LeaveFlowPreview from "./_components/leave-flow-preview";

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

      {/* Brand panel: the product's own flow on the brand blue, no stock photo or glow. */}
      <div className="relative hidden max-h-screen overflow-hidden p-4 lg:flex">
        <div className="relative flex h-full w-full flex-col justify-between gap-10 overflow-hidden rounded-2xl bg-primary p-10 text-primary-foreground xl:p-12">
          {/* Short screens keep the headline; the illustration steps aside first. */}
          <div className="flex min-h-0 flex-1 items-center [@media(max-height:600px)]:hidden">
            <LeaveFlowPreview />
          </div>
          <div className="relative flex flex-col gap-3">
            <h1 className="type-display max-w-xl">{t.rich("headline", { br: () => <br /> })}</h1>
            <p className="max-w-lg text-sm text-primary-foreground/80">{t("tagline")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
