import { Calendar03Icon } from "@hugeicons/core-free-icons";
import { type IconSvgElement } from "@hugeicons/react";

/** Icons the module registry refers to by key, so `app-module-constant.ts` stays data-only. */
export const iconMap = {
  "calendar-icon": Calendar03Icon,
} satisfies Record<string, IconSvgElement>;

export type IconKey = keyof typeof iconMap;
