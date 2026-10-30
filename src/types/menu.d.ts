import type { IconKey } from "@/constants/icon-constant";
import type { Messages } from "@/i18n/messages";

export type TDashboardSubmenu = {
  /** Key in the `nav.menus` messages. */
  titleKey: keyof Messages["nav"]["menus"];
  href: string;
  disabled: boolean;
  /** Permission title from the user's role; without it the menu is hidden. */
  permission?: string;
};

export type TAppModule = {
  id: string;
  /** Key in the `nav.modules` messages. */
  titleKey: keyof Messages["nav"]["modules"];
  icon: IconKey;
  /** Where the module opens when there is no remembered page yet. */
  href: string;
  /** Route prefixes owned by the module, used to find the active module. */
  basePaths: string[];
  menus: TDashboardSubmenu[];
};
