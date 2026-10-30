/**
 * Every translation namespace, one JSON file per module in `src/messages/<locale>/`.
 * English is the source: its shape types `useTranslations` keys app-wide.
 */
import enCommon from "@/messages/en/common.json";
import enNav from "@/messages/en/nav.json";
import enAuth from "@/messages/en/auth.json";
import enLeave from "@/messages/en/leave.json";
import enSetup from "@/messages/en/setup.json";
import enDashboard from "@/messages/en/dashboard.json";
import enHome from "@/messages/en/home.json";
import enAppraisal from "@/messages/en/appraisal.json";
import idCommon from "@/messages/id/common.json";
import idNav from "@/messages/id/nav.json";
import idAuth from "@/messages/id/auth.json";
import idLeave from "@/messages/id/leave.json";
import idSetup from "@/messages/id/setup.json";
import idDashboard from "@/messages/id/dashboard.json";
import idHome from "@/messages/id/home.json";
import idAppraisal from "@/messages/id/appraisal.json";

import type { Locale } from "./config";

const en = {
  common: enCommon,
  nav: enNav,
  auth: enAuth,
  leave: enLeave,
  setup: enSetup,
  dashboard: enDashboard,
  home: enHome,
  appraisal: enAppraisal,
};

export type Messages = typeof en;

/** Indonesian may lag behind English; missing keys fall back to English at runtime. */
const id: DeepPartial<Messages> = {
  common: idCommon,
  nav: idNav,
  auth: idAuth,
  leave: idLeave,
  setup: idSetup,
  dashboard: idDashboard,
  home: idHome,
  appraisal: idAppraisal,
};

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

export const messages: Record<Locale, DeepPartial<Messages>> & { en: Messages } = { en, id };
