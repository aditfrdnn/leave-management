"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BrandMark } from "@/components/common/brand-logo";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { appModules, getActiveMenuHref, getActiveModule } from "@/constants/app-module-constant";
import { iconMap } from "@/constants/icon-constant";
import { useModuleLastPaths } from "@/hooks/use-module-last-paths";
import { cn } from "@/lib/utils/utils";
import { Tick02Icon, UnfoldMoreIcon } from "@hugeicons/core-free-icons";

/** Active item as a soft primary tint, lighter than the solid default. */
const activeClass =
  "data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-semibold";

function AppSidebarContent({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");

  const activeModule = getActiveModule(pathname);
  const query = searchParams.toString();
  const lastPaths = useModuleLastPaths(activeModule.id, query ? `${pathname}?${query}` : pathname);

  // No permission layer yet (docs/backend-task.md §3); every module and menu is visible.
  const visibleModules = appModules;

  const ActiveIcon = iconMap[activeModule.icon];
  const activeMenus = visibleModules.find((module) => module.id === activeModule.id)?.menus ?? [];
  const activeMenuHref = getActiveMenuHref(
    pathname,
    activeMenus.filter((menu) => !menu.disabled).map((menu) => menu.href),
  );

  return (
    <Sidebar collapsible="icon" className="overflow-hidden" {...props}>
      <div className="flex h-full w-full">
        {/* Module rail: always visible, even when the sidebar is collapsed. */}
        <Sidebar collapsible="none" className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r">
          <SidebarHeader className="items-center px-0 py-3">
            <Link href="/leave-requests" aria-label={t("brand")} className="flex size-8 items-center justify-center rounded-lg">
              <BrandMark className="size-7 text-primary" />
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup className="px-1.5">
              <SidebarMenu className="gap-1.5">
                {visibleModules.map((module) => {
                  const Icon = iconMap[module.icon];

                  return (
                    <SidebarMenuItem key={module.id}>
                      <SidebarMenuButton
                        asChild
                        tooltip={{ children: t(`modules.${module.titleKey}`), hidden: false }}
                        isActive={module.id === activeModule.id}
                        className={cn("size-9 justify-center p-0", activeClass)}
                      >
                        <Link href={lastPaths[module.id] ?? module.href}>
                          <HugeiconsIcon icon={Icon} className="size-5!" />
                          <span className="sr-only">{t(`modules.${module.titleKey}`)}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        {/* Module sidebar: only the pages of the module being worked in. */}
        <Sidebar collapsible="none" className="min-w-0 flex-1">
          <SidebarHeader className="border-b px-2 py-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={t("switchModule")}
                  className="flex h-10 w-full items-center gap-2.5 rounded-md px-1 text-left outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring data-[state=open]:bg-sidebar-accent"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <HugeiconsIcon icon={ActiveIcon} className="size-4" />
                  </div>
                  <span className="flex-1 truncate text-sm font-semibold text-foreground">
                    {t(`modules.${activeModule.titleKey}`)}
                  </span>
                  <HugeiconsIcon icon={UnfoldMoreIcon} className="size-4 shrink-0 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-(--radix-dropdown-menu-trigger-width) min-w-56">
                <DropdownMenuLabel className="text-xs text-muted-foreground">{t("switchModule")}</DropdownMenuLabel>
                {visibleModules.map((module) => {
                  const Icon = iconMap[module.icon];
                  const isActive = module.id === activeModule.id;

                  return (
                    <DropdownMenuItem key={module.id} asChild className={cn(isActive && "font-semibold text-primary")}>
                      <Link href={lastPaths[module.id] ?? module.href}>
                        <HugeiconsIcon icon={Icon} className={cn("size-4", isActive && "text-primary")} />
                        <span className="flex-1 truncate">{t(`modules.${module.titleKey}`)}</span>
                        {isActive && <HugeiconsIcon icon={Tick02Icon} className="size-4 text-primary" />}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>{t("menuLabel")}</SidebarGroupLabel>
              <SidebarMenu>
                {activeMenus.map((menu) => (
                  <SidebarMenuItem key={menu.href}>
                    {menu.disabled ? (
                      <>
                        <SidebarMenuButton className="text-muted-foreground" aria-disabled={true}>
                          <span>{t(`menus.${menu.titleKey}`)}</span>
                        </SidebarMenuButton>
                        <SidebarMenuBadge className="text-2xs font-normal text-muted-foreground">
                          {tCommon("states.comingSoon")}
                        </SidebarMenuBadge>
                      </>
                    ) : (
                      <SidebarMenuButton asChild isActive={menu.href === activeMenuHref} className={activeClass}>
                        <Link href={menu.href}>
                          <span>{t(`menus.${menu.titleKey}`)}</span>
                        </Link>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </div>
      <SidebarRail />
    </Sidebar>
  );
}

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  return (
    <Suspense fallback={<Sidebar collapsible="icon" />}>
      <AppSidebarContent {...props} />
    </Suspense>
  );
}
