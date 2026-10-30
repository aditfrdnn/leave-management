"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils/utils";
import type { TTableFacet } from "@/types/table";
import { FilterIcon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";

/** The backend's value for an empty cell — "(Blanks)" in a spreadsheet. */
export const BLANK_VALUE = "__blank__";

/**
 * A column header with a spreadsheet-style filter: the column's distinct values
 * (with how many rows have each), a search box, select all / clear, then OK.
 * `selected` null means the column is not filtered. `hideTitle` renders only the
 * filter button, for headers that draw their own title (a sort toggle).
 */
export default function ColumnFilter({
    title,
    facets,
    selected,
    onChange,
    hideTitle = false,
}: {
    title: string;
    hideTitle?: boolean;
    facets: TTableFacet[];
    selected: string[] | null;
    onChange: (values: string[] | null) => void;
}) {
    const t = useTranslations("common.columnFilter");
    const tc = useTranslations("common.actions");
    const blanksLabel = t("blanks");
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [draft, setDraft] = useState<string[]>([]);

    const isActive = selected !== null;
    const visible = useMemo(() => {
        const query = search.trim().toLowerCase();

        return query === ""
            ? facets
            : facets.filter((facet) => (facet.label || blanksLabel).toLowerCase().includes(query));
    }, [facets, search, blanksLabel]);

    const openChange = (next: boolean) => {
        if (next) {
            // Unfiltered: everything is checked, as in a spreadsheet.
            setDraft(selected ?? facets.map((facet) => facet.value));
            setSearch("");
        }
        setOpen(next);
    };

    const toggle = (value: string, checked: boolean) =>
        setDraft((current) => (checked ? [...current, value] : current.filter((item) => item !== value)));

    const apply = () => {
        const all = facets.every((facet) => draft.includes(facet.value));
        onChange(all ? null : draft);
        setOpen(false);
    };

    return (
        <div className="flex items-center gap-1 whitespace-nowrap">
            {!hideTitle && <span>{title}</span>}
            <Popover open={open} onOpenChange={openChange}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        aria-label={t("filterAria", { title })}
                        aria-pressed={isActive}
                        className={cn("size-6 shrink-0", isActive && "bg-primary/10 text-primary")}
                    >
                        <HugeiconsIcon icon={FilterIcon} className={cn("size-3.5", isActive && "fill-current")} />
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="flex w-64 flex-col gap-2 p-3">
                    <div className="relative">
                        <HugeiconsIcon icon={Search01Icon} className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder={t("searchPlaceholder")}
                            aria-label={t("searchAria", { title })}
                            className="h-8 pl-7 text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                        <button
                            type="button"
                            className="font-medium text-primary hover:underline"
                            onClick={() => setDraft((current) => [...new Set([...current, ...visible.map((facet) => facet.value)])])}
                        >
                            {t("selectAll")}
                        </button>
                        <button
                            type="button"
                            className="font-medium text-primary hover:underline"
                            onClick={() => {
                                const shown = new Set(visible.map((facet) => facet.value));
                                setDraft((current) => current.filter((value) => !shown.has(value)));
                            }}
                        >
                            {tc("clear")}
                        </button>
                        <span className="ml-auto text-muted-foreground">
                            {t("count", { selected: draft.length, total: facets.length })}
                        </span>
                    </div>
                    <ul className="flex max-h-64 flex-col overflow-y-auto rounded-md border py-1">
                        {visible.length === 0 ? (
                            <li className="px-2 py-3 text-center text-xs text-muted-foreground">{t("noMatch")}</li>
                        ) : (
                            visible.map((facet) => (
                                <li key={facet.value}>
                                    <label className="flex cursor-pointer items-center gap-2 px-2 py-1.5 text-sm hover:bg-muted/60">
                                        <Checkbox
                                            checked={draft.includes(facet.value)}
                                            onCheckedChange={(checked) => toggle(facet.value, checked === true)}
                                        />
                                        <span className={cn("min-w-0 flex-1 truncate", facet.value === BLANK_VALUE && !facet.label && "italic text-muted-foreground")}>
                                            {facet.value === BLANK_VALUE ? facet.label || blanksLabel : facet.label}
                                        </span>
                                        <span className="text-xs tabular-nums text-muted-foreground">{facet.count}</span>
                                    </label>
                                </li>
                            ))
                        )}
                    </ul>
                    <div className="flex justify-end gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)}>
                            {tc("cancel")}
                        </Button>
                        <Button type="button" size="sm" disabled={draft.length === 0} onClick={apply}>
                            {t("ok")}
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
