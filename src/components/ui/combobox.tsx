"use client";

import { cn } from "@/lib/utils/utils";
import { Popover, PopoverTrigger } from "@radix-ui/react-popover";

import { Button } from "./button";
import { PopoverContent } from "./popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command";
import { ReactNode } from "react";
import { Tick02Icon, UnfoldMoreIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";

type TComboBox = {
  value: string;
  label: string | ReactNode;
};

interface PropTypes {
  isError?: boolean;
  disabled: boolean;
  emptyLabel: string;
  hint: string | any;
  items: TComboBox[];
  onSelect: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  searchLabel: string;
  value?: string;
}

export default function ComboBox(props: PropTypes) {
  const {
    isError = false,
    disabled,
    emptyLabel,
    hint,
    items,
    onSelect,
    onOpenChange,
    open,
    searchLabel,
    value,
  } = props;

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <div className="flex items-start justify-start min-w-40 flex-col gap-2">
          <Button
            variant="outline"
            role="combobox"
            type="button"
            size="sm"
            aria-expanded={open}
            disabled={disabled}
            className={cn("justify-between text-left h-9 min-w-40 font-normal w-full rounded-lg", {
              "border-destructive/50": isError,
            })}
          >
            <span className={cn("truncate text-sm", { "text-muted-foreground": !value })}>
              {value ? items.find((item) => item.value === value)?.label : hint}
            </span>
            <HugeiconsIcon icon={UnfoldMoreIcon} className="opacity-50" />
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 max-h-[--radix-popover-content-available-height] mb-2"
        align="start"
        side="bottom"
        style={{ width: "var(--radix-popover-trigger-width)" }}
        onWheel={(e) => e.stopPropagation()}
      >
        <Command>
          <CommandInput placeholder={searchLabel} className="h-12" />
          <CommandList>
            <CommandEmpty className="text-muted-foreground flex flex-col gap-2 text-sm p-2 text-center">
              {emptyLabel}
            </CommandEmpty>
            <CommandGroup>
              {items.map((item, index) => (
                <CommandItem
                  key={`combobox-item-${item.value}-${index}`}
                  value={item.label as string}
                  onSelect={() => onSelect(item.value)}
                >
                  {item.label}
                  <HugeiconsIcon icon={Tick02Icon}
                    className={cn(
                      "ml-auto",
                      value === item.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
