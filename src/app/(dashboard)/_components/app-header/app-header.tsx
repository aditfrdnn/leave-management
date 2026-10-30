import GeneralBreadcrumb from "@/components/common/general-breadcrumb";
import { LanguageSwitcher } from "@/components/common/language-switcher";
import { ModeToggle } from "@/components/common/mode-toggle";
import { NavUser } from "@/components/common/nav-user";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function AppHeader() {
  return (
    <header className="flex h-14 justify-between px-4 sticky top-0 z-50 bg-background/80 backdrop-blur-md shrink-0 border-b items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex min-w-0 items-center gap-2 overflow-hidden">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <GeneralBreadcrumb />
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <LanguageSwitcher />
        <ModeToggle />
        <Separator
          orientation="vertical"
          className="data-[orientation=vertical]:h-4"
        />
        <NavUser />
      </div>
    </header>
  );
}
