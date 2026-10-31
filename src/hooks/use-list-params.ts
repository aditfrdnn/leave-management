"use client";

import { useCallback, useState } from "react";

import { LIMIT_DEFAULT, PAGE_DEFAULT } from "@/constants/params-constant";
import { useTableQuery } from "@/hooks/use-table-query";
import type { TTableColumnFilters } from "@/types/table";

/**
 * The paging/search state every paginated list shares, plus the column sort and
 * filters (`useTableQuery`) — spread `table.params` into the request and
 * `table.tableProps` into `<DataTable>`.
 *
 * Changing the search, page size, sort or a filter resets to page 1 — otherwise
 * a narrower result set leaves the table stranded on a page that no longer exists.
 */
export function useListParams({ defaultFilters }: { defaultFilters?: TTableColumnFilters } = {}) {
  const [page, setPage] = useState(Number(PAGE_DEFAULT));
  const [perPage, setPerPage] = useState(LIMIT_DEFAULT);
  const [search, setSearch] = useState("");

  const resetPage = useCallback(() => setPage(Number(PAGE_DEFAULT)), []);
  const table = useTableQuery({ defaultFilters, onChange: resetPage });

  const onSearchChange = useCallback(
    (value: string) => {
      resetPage();
      setSearch(value);
    },
    [resetPage],
  );

  const onLimitChange = useCallback(
    (value: number) => {
      resetPage();
      setPerPage(value);
    },
    [resetPage],
  );

  return { page, setPage, perPage, onLimitChange, search, onSearchChange, table, resetPage };
}
