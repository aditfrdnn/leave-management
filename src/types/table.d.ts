import "@tanstack/react-table";

/** One distinct value of a filterable column, with how many rows have it. */
export type TTableFacet = {
    value: string;
    label: string;
    count: number;
};

/** `meta.facets` of a list response: filter key → its values. */
export type TTableFacets = Partial<Record<string, TTableFacet[]>>;

export type TTableSortDirection = "asc" | "desc";

export type TTableSort = { key: string; direction: TTableSortDirection } | null;

/** Column key => selected values; a column without a filter is absent. */
export type TTableColumnFilters = Record<string, string[]>;

/** Query string for list endpoints: `?sort=&direction=&columns[key][]=`. */
export type TTableQueryParams = {
    sort?: string;
    direction?: TTableSortDirection;
    columns?: TTableColumnFilters;
};

declare module "@tanstack/react-table" {
    interface ColumnMeta<TData, TValue> {
        /** Plain-text column name, for headers that render a component (e.g. Set Column). */
        label?: string;
        /** Sort key sent to the API (or used client-side); the header becomes a sort toggle. */
        sortKey?: string;
        /** Filter key sent to the API as `columns[key][]`; the header gets a value filter. */
        filterKey?: string;
        /** Label for a raw value in the filter list: client facets, or translating API facets. */
        /** Name for empty cells in the filter list, when the cell shows one (default "(Blanks)"). */
        blankLabel?: string;
        filterLabel?: (value: string) => string;
    }
}
