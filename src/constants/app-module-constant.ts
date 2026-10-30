import type { TAppModule } from "@/types/menu";
import { PERMISSIONS_CONSTANT } from "./permission-constant";

export const HOME_MODULE_ID = "home";

/**
 * The module rail and each module's sidebar menu. A menu with `permission` is hidden unless the
 * signed-in user holds that title; a module whose menus are all hidden disappears from the rail.
 */
export const appModules: TAppModule[] = [
  {
    id: HOME_MODULE_ID,
    titleKey: "home",
    icon: "dashboard-layout-icon",
    href: "/dashboard",
    basePaths: ["/dashboard"],
    menus: [{ titleKey: "mainDashboard", href: "/dashboard", disabled: false }],
  },
  {
    id: "leave",
    titleKey: "leave",
    icon: "calendar-icon",
    href: "/leave-requests",
    basePaths: ["/leave-requests", "/approvals"],
    menus: [
      { titleKey: "myLeaveRequests", href: "/leave-requests", disabled: false },
      { titleKey: "approvals", href: "/approvals", disabled: false, permission: PERMISSIONS_CONSTANT.LEAVE_APPROVE },
    ],
  },
  {
    id: "setup",
    titleKey: "setup",
    icon: "user-cog-icon",
    href: "/setup/master-data/employees",
    basePaths: ["/setup"],
    menus: [
      { titleKey: "employees", href: "/setup/master-data/employees", disabled: false, permission: PERMISSIONS_CONSTANT.EMPLOYEES_MANAGE },
      { titleKey: "departments", href: "/setup/master-data/departments", disabled: false, permission: PERMISSIONS_CONSTANT.DEPARTMENTS_MANAGE },
      { titleKey: "users", href: "/setup/users", disabled: false, permission: PERMISSIONS_CONSTANT.USERS_MANAGE },
      { titleKey: "roles", href: "/setup/roles", disabled: false, permission: PERMISSIONS_CONSTANT.ROLES_MANAGE },
      { titleKey: "permissions", href: "/setup/permissions", disabled: false, permission: PERMISSIONS_CONSTANT.ROLES_MANAGE },
    ],
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
