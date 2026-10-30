/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useTheme } from "next-themes";
import * as React from "react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils/utils";
import { Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";

export function ModeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <div className="relative inline-flex items-center">
      <HugeiconsIcon icon={Sun03Icon}
        size={12}
        className={cn(
          "pointer-events-none absolute left-0.75 top-0.75 z-10 transition-all duration-200",
          isDark ? "opacity-0" : "opacity-100"
        )}
      />
      <Switch
        className="peer"
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
      />
      <HugeiconsIcon icon={Moon02Icon}
        size={12}
        className={cn(
          "pointer-events-none absolute right-0.75 top-0.75 z-10 text-primary transition-all duration-200",
          isDark ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  );
}
