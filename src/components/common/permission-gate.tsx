"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { SectionLoader } from "@/components/common/loader";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { usePermission } from "@/lib/permission";
import { SquareLock02Icon } from "@hugeicons/core-free-icons";

/** Renders `children` only when the signed-in user holds `permission`; otherwise a quiet notice. */
export default function PermissionGate({ permission, title, children }: { permission: string; title: string; children: ReactNode }) {
  const t = useTranslations("common.permissionGate");
  const { loading, allowed } = usePermission(permission);

  if (loading) return <SectionLoader className="min-h-60" />;

  if (!allowed) {
    return (
      <div className="flex min-h-60 flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <HugeiconsIcon icon={SquareLock02Icon} className="size-6" />
        </div>
        <div className="flex max-w-md flex-col gap-1">
          <p className="text-base font-semibold">{t("unavailableTitle", { title })}</p>
          <p className="text-sm text-muted-foreground">{t("unavailableDescription", { permission })}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
