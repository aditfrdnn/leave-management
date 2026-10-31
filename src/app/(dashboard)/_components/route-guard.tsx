"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { SectionLoader } from "@/components/common/loader";
import { canOpenPath } from "@/constants/app-module-constant";
import { usePermissionTitles } from "@/lib/permission";

/**
 * Keeps people off pages their permissions do not open (a bookmark, the back button, a stale link,
 * a role that just changed): they land on `/` instead of a "not available" page. The API still
 * enforces every permission; this only decides where the browser goes.
 */
export function RouteGuard({ children }: { children: ReactNode }) {
  const t = useTranslations("common.permissionGate");
  const pathname = usePathname();
  const router = useRouter();
  const { data: titles, loading } = usePermissionTitles();
  const allowed = loading || canOpenPath(pathname, titles);

  useEffect(() => {
    if (allowed) return;
    toast.info(t("redirected"), { id: "route-guard" });
    router.replace("/");
  }, [allowed, router, t]);

  return allowed ? children : <SectionLoader className="min-h-60" />;
}
