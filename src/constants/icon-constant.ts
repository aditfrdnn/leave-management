import { Calendar03Icon, DashboardSquare02Icon, UserSettings01Icon } from "@hugeicons/core-free-icons";
import { type IconSvgElement } from "@hugeicons/react";

/** Icons the module registry refers to by key, so `app-module-constant.ts` stays data-only. */
export const iconMap = {
  "dashboard-layout-icon": DashboardSquare02Icon,
  "calendar-icon": Calendar03Icon,
  "user-cog-icon": UserSettings01Icon,
} satisfies Record<string, IconSvgElement>;

export type IconKey = keyof typeof iconMap;
