import type { ComponentProps } from "react";
import { HugeiconsIcon as BaseHugeiconsIcon } from "@hugeicons/react";

/**
 * The app's icon component: Hugeicons drawn with a 2px stroke (the library default is 1.5).
 * Import it from here instead of `@hugeicons/react`; pass `strokeWidth` to override per icon.
 */
export function HugeiconsIcon({ strokeWidth = 2, ...props }: ComponentProps<typeof BaseHugeiconsIcon>) {
  return <BaseHugeiconsIcon strokeWidth={strokeWidth} {...props} />;
}
