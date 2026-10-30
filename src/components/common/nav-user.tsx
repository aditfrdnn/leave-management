"use client";


import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader } from "@/components/common/loader";
import { useTransition, Suspense } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SignOut } from "@/app/(auth)/actions";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks";
import Link from "next/link";
import { useAuthStore } from "@/stores";
import AvatarUser from "@/components/common/avatar-user";
import { Login01Icon, Logout01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";

function NavUserContent() {
  const t = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [_, startTransition] = useTransition();
  const currentUrl = `${pathname}${params.toString() ? `?${params}` : ""}`;

  const { user, isAuthenticated, isInitialized } = useAuth();
  const clear = useAuthStore((state) => state.clear);
  const queryClient = useQueryClient();

  const { theme, systemTheme } = useTheme();

  const handleLogout = () => {
    const id = toast.loading(t("navUser.loggingOut"));
    startTransition(async () => {
      try {
        const { url } = await SignOut(currentUrl);

        if (url) {
          toast.success(t("navUser.logoutSuccess"), { id });
          router.replace(url); // navigasi manual, tidak melempar NEXT_REDIRECT
          clear();
          // Cached lists belong to the account that just left; the next one must not see them.
          queryClient.clear();
        }
      } catch (e) {
        console.error(e);
        toast.error(t("navUser.logoutFailed"), { id });
      }
    });
  };

  if (isAuthenticated && user) {
    return (
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="animate-reveal px-0">
            <AvatarUser user={user} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
          side="bottom"
          align="end"
          sideOffset={4}
        >
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar className="h-8 w-8 rounded-full">
                <AvatarFallback className="rounded-full bg-primary/10 dark:bg-primary text-primary dark:text-white">
                  {user?.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left gap-1 text-sm leading-tight">
                <span className="truncate font-medium">{user?.name}</span>
                <span className="truncate text-xs">{user?.email}</span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <HugeiconsIcon icon={Logout01Icon} />
            {t("actions.logout")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (!isInitialized) {
    return (
      <div className="flex min-w-48 items-center p-1">
        <Loader size="sm" />
      </div>
    );
  }

  return (
    <Link href="/sign-in">
      <Button
        className="hidden sm:inline-flex"
        size="sm"
        variant={
          theme === "dark" || (systemTheme === "dark" && theme === "system")
            ? "default"
            : "outlinePrimary"
        }
      >
        <HugeiconsIcon icon={Login01Icon} />
        {t("navUser.signIn")}
      </Button>
    </Link>
  );
}

export function NavUser() {
  return (
    <Suspense fallback={<div className="flex size-8 items-center justify-center"><Loader size="sm" /></div>}>
      <NavUserContent />
    </Suspense>
  );
}
