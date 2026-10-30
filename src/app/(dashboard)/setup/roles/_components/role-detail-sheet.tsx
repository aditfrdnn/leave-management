"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { Reveal, SectionLoader } from "@/components/common/loader";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { LockIcon } from "@hugeicons/core-free-icons";
import { GetRole } from "../action";

export const ROLE_DETAIL_PREFIX = ["setup", "role"] as const;
export const ROLE_DETAIL_QUERY_KEY = (id: number) => [...ROLE_DETAIL_PREFIX, id] as const;

/** One role: what it grants and who holds it. */
export default function RoleDetailSheet({ roleId, onOpenChange }: { roleId: number | null; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("setup");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ROLE_DETAIL_QUERY_KEY(roleId ?? 0),
    queryFn: () => GetRole(roleId as number),
    enabled: roleId !== null,
  });

  return (
    <Sheet open={roleId !== null} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-4 overflow-y-auto sm:max-w-125">
        <SheetHeader>
          <SheetTitle className="flex flex-wrap items-center gap-2">
            {data?.title ?? t("roles.detail.fallbackTitle")}
            {data?.is_system && (
              <Badge variant="outline" className="gap-1">
                <HugeiconsIcon icon={LockIcon} className="size-3" />
                {t("shared.system")}
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription>{data?.description || t("roles.detail.description")}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-4 pb-6">
          {isLoading && <SectionLoader className="min-h-60" />}
          {isError && <p className="text-sm text-destructive">{(error as Error).message}</p>}

          {data && (
            <Reveal className="flex flex-col gap-6">
              <section className="flex flex-col gap-2">
                <h3 className="type-section-title">{t("roles.detail.permissions", { count: data.permissions?.length ?? 0 })}</h3>
                {data.permissions?.length ? (
                  <ul className="flex flex-col divide-y rounded-lg border">
                    {data.permissions.map((permission) => (
                      <li key={permission.id} className="flex flex-col gap-0.5 px-3 py-2">
                        <span className="text-sm">{permission.label || permission.title}</span>
                        <span className="font-mono text-2xs text-muted-foreground">{permission.title}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">{t("roles.detail.noPermissions")}</p>
                )}
              </section>

              <section className="flex flex-col gap-2">
                <h3 className="type-section-title">{t("roles.detail.users", { count: data.users?.length ?? data.users_count ?? 0 })}</h3>
                {data.users?.length ? (
                  <ul className="flex flex-col divide-y rounded-lg border">
                    {data.users.map((user) => (
                      <li key={user.id} className="flex flex-col gap-0.5 px-3 py-2">
                        <span className="text-sm font-medium">{user.name}</span>
                        <span className="text-xs break-all text-muted-foreground">{user.email}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">{t("roles.detail.noUsers")}</p>
                )}
              </section>
            </Reveal>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
