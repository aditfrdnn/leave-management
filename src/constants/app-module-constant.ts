import type { TAppModule } from "@/types/menu";

export const HOME_MODULE_ID = "leave";

/** The module rail and each module's sidebar menu. One module today; approvals and settings join here later. */
export const appModules: TAppModule[] = [
  {
    id: HOME_MODULE_ID,
    titleKey: "leave",
    icon: "calendar-icon",
    href: "/leave-requests",
    basePaths: ["/leave-requests"],
    menus: [{ titleKey: "myLeaveRequests", href: "/leave-requests", disabled: false }],
  },
];

export function isHrefActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** The active sidebar menu: the longest matching href. */
export function getActiveMenuHref(pathname: string, hrefs: string[]) {
  return hrefs.filter((href) => isHrefActive(pathname, href)).sort((a, b) => b.length - a.length)[0];
}

/** Pages outside every module fall back to the first one. */
export function getActiveModule(pathname: string): TAppModule {
  return (
    appModules.find((module) => module.basePaths.some((path) => isHrefActive(pathname, path))) ??
    appModules[0]
  );
}
