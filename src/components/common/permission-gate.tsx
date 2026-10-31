"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { SectionLoader } from "@/components/common/loader";
import { usePermission } from "@/lib/permission";
import { useAuthStore } from "@/stores";

/**
 * Renders `children` only when the signed-in user holds `permission`. Without it the browser goes
 * to `/`: nobody is left on a page they may not use (see `RouteGuard` for the route-level check).
 */
export default function PermissionGate({ permission, children }: { permission: string; title?: string; children: ReactNode }) {
  const t = useTranslations("common.permissionGate");
  const router = useRouter();
  const { loading, allowed } = usePermission(permission);
  // After logout the store is empty while the sign-in page loads; that is not a denial.
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const denied = !loading && isAuthenticated && !allowed;

  useEffect(() => {
    if (!denied) return;
    toast.info(t("redirected"), { id: "route-guard" });
    router.replace("/");
  }, [denied, router, t]);

  if (!allowed) return <SectionLoader className="min-h-60" />;

  return <>{children}</>;
}
