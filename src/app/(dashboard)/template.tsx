import type { ReactNode } from "react";

import { PageGate } from "@/components/common/page-gate";

/** Remounts on every navigation, so each page gets a fresh gate: one loader, then one reveal. */
export default function DashboardTemplate({ children }: { children: ReactNode }) {
    return <PageGate>{children}</PageGate>;
}
