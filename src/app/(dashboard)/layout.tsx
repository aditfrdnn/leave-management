import { ReactNode } from "react";

import { LiveRefresh } from "@/components/common/live-refresh";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "./_components/app-header/app-header";
import { AppSidebar } from "./_components/app-sidebar/app-sidebar";
import { RouteGuard } from "./_components/route-guard";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <LiveRefresh />
      <AppSidebar />
      <SidebarInset className="w-1/2">
        <AppHeader />
        <div className="mb-4 flex w-full flex-1 flex-col gap-6 overflow-auto p-4">
          <RouteGuard>{children}</RouteGuard>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
