"use client";

import { useCallback, useMemo, useState } from "react";

import type { TTableColumnFilters, TTableQueryParams, TTableSort } from "@/types/table";

/**
 * Sort and column-filter state for a server-paginated table.
 *
 * Spread `params` into the list request (and its query key) and `tableProps` into
 * `<DataTable>`. Changing either resets to page one through `onChange`.
 */
export function useTableQuery({
    defaultSort = null,
    defaultFilters = {},
    onChange,
}: {
    defaultSort?: TTableSort;
    /** Filters the table opens with, e.g. the current year; the user can clear them. */
    defaultFilters?: TTableColumnFilters;
    /** Called after the sort or a filter changes, e.g. to go back to page 1. */
    onChange?: () => void;
} = {}) {
    const [sort, setSort] = useState<TTableSort>(defaultSort);
    const [columnFilters, setColumnFilters] = useState<TTableColumnFilters>(defaultFilters);

    // Ascending, then descending, then back to the default order.
    const toggleSort = useCallback(
        (key: string) => {
            setSort((current) => {
                if (!current || current.key !== key) return { key, direction: "asc" };
                if (current.direction === "asc") return { key, direction: "desc" };
                return defaultSort;
            });
            onChange?.();
        },
        [defaultSort, onChange],
    );

    const setColumnFilter = useCallback(
        (key: string, values: string[] | null) => {
            setColumnFilters((current) => {
                const next = { ...current };
                if (values === null) delete next[key];
                else next[key] = values;
                return next;
            });
            onChange?.();
        },
        [onChange],
    );

    const clearColumnFilters = useCallback(() => {
        setColumnFilters({});
        onChange?.();
    }, [onChange]);

    const params = useMemo<TTableQueryParams>(
        () => ({
            sort: sort?.key,
            direction: sort?.direction,
            columns: Object.keys(columnFilters).length > 0 ? columnFilters : undefined,
        }),
        [sort, columnFilters],
    );

    return {
        sort,
        columnFilters,
        params,
        toggleSort,
        setColumnFilter,
        clearColumnFilters,
        /** Spread into `<DataTable>`; add `facets` from the response. */
        tableProps: {
            sort,
            onSortChange: toggleSort,
            columnFilters,
            onColumnFilterChange: setColumnFilter,
            onClearColumnFilters: clearColumnFilters,
        },
    };
}
