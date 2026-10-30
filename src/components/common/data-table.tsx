/* eslint-disable react-hooks/incompatible-library */
"use client";

import {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  FilterFn,
  Header,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import ColumnFilter, { BLANK_VALUE } from "@/components/common/column-filter";
import type { TTableColumnFilters, TTableFacet, TTableSort } from "@/types/table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import React, { ReactNode, useEffect, useMemo, Suspense } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { useTranslations } from "next-intl";
import { SectionLoader } from "./loader";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination";
import { cn } from "@/lib/utils/utils";
import { useChangeParams } from "@/hooks";
import { LIMIT_LISTS } from "@/constants/params-constant";
import { ArrowDataTransferVerticalIcon, ArrowDown02Icon, ArrowUp02Icon, FilterRemoveIcon, LayoutThreeColumnIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";

interface DataTableProps<TData, TValue> {
  className?: string;
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading: boolean;
  noResultMessage: string;
  skeletonCount?: number;
  page?: number;
  onPageChanged?: (page: string) => void;
  limit?: number;
  onLimitChanged?: (limit: string) => void;
  currentPage: number;
  lastPage: number;
  rowSelectedComponent?:
  | React.ReactElement
  | ((selectedData: TData[]) => React.ReactElement);
  isResetSelectedRow?: boolean;
  onRowClick?: (row: TData) => void;
  getRowClassName?: (row: TData) => string;
  getCellClassName?: (row: TData, columnId: string) => string;
  /** Renders each body row instead of a plain `<tr>` (e.g. a sortable row); keep it stable. */
  rowComponent?: React.ComponentType<React.ComponentProps<"tr"> & { row: TData }>;
  /*
   * Column sort and filter (`meta.sortKey` / `meta.filterKey` on a column). With these
   * props (spread `useTableQuery().tableProps`) the API sorts and filters and `facets`
   * comes from the response; without them the table sorts and filters its own rows.
   */
  sort?: TTableSort;
  onSortChange?: (key: string) => void;
  columnFilters?: TTableColumnFilters;
  onColumnFilterChange?: (key: string, values: string[] | null) => void;
  onClearColumnFilters?: () => void;
  facets?: Partial<Record<string, TTableFacet[]>>;
}

const cellKey = (value: unknown) => (value === null || value === undefined || value === "" ? BLANK_VALUE : String(value));

/** Client-side column filter: keep rows whose value is one of the selected ones. */
const inValues: FilterFn<unknown> = (row, columnId, selected: string[]) =>
  selected.includes(cellKey(row.getValue(columnId)));

/** Header text for menus and aria labels: `meta.label`, the string header, or the id. */
function headerLabel<TData>(header: Header<TData, unknown>) {
  const { columnDef } = header.column;
  return columnDef.meta?.label ?? (typeof columnDef.header === "string" ? columnDef.header : header.column.id.replaceAll("_", " "));
}

/** One id per data array, so a new page or filter result remounts the rows and replays their entrance. */
const dataKeys = new WeakMap<object, number>();
let lastDataKey = 0;
function keyForData(data: object) {
  let key = dataKeys.get(data);
  if (key === undefined) {
    key = ++lastDataKey;
    dataKeys.set(data, key);
  }
  return key;
}

function DataTableContent<TData, TValue>({
  className,
  columns,
  data,
  isLoading,
  noResultMessage,
  page = 1,
  onPageChanged = () => { },
  limit = LIMIT_LISTS[0] ?? 10,
  onLimitChanged = () => { },
  currentPage,
  lastPage,
  rowSelectedComponent,
  isResetSelectedRow,
  onRowClick,
  getRowClassName,
  getCellClassName,
  rowComponent: RowComponent,
  sort,
  onSortChange,
  columnFilters: serverFilters,
  onColumnFilterChange,
  onClearColumnFilters,
  facets,
}: DataTableProps<TData, TValue>) {
  const serverSide = onSortChange !== undefined || onColumnFilterChange !== undefined;
  const t = useTranslations("common.dataTable");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,

    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    defaultColumn: { filterFn: inValues as FilterFn<TData> },
    // Server-side tables get rows already sorted and filtered by the API.
    manualSorting: serverSide,
    manualFiltering: serverSide,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      rowSelection,
      columnFilters,
      columnVisibility,
    },
  });

  const { queryLimit } = useChangeParams();

  const ShowItemContent = useMemo(() => {
    return (
      <Select
        onValueChange={(value) => onLimitChanged(value)}
        defaultValue={`${queryLimit ?? LIMIT_LISTS[0]}`}
      >
        <SelectTrigger className="w-auto h-8! rounded-lg mr-1 text-sm">
          <SelectValue placeholder={queryLimit} />
        </SelectTrigger>
        <SelectContent className="text-sm">
          <SelectGroup>
            {LIMIT_LISTS.map((item) => (
              <SelectItem key={item} value={item.toString()}>
                {item}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    );
  }, [onLimitChanged, queryLimit]);

  const renderPageNumbers = () => {
    const items: ReactNode[] = [];
    const maxVisiblePages = 5;

    if (lastPage <= maxVisiblePages) {
      for (let i = 1; i <= lastPage; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => onPageChanged(i.toString())}
              isActive={currentPage === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            onClick={() => onPageChanged("1")}
            isActive={currentPage === 1}
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      if (lastPage > 3) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(lastPage - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => onPageChanged(i.toString())}
              isActive={currentPage === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      if (currentPage < lastPage - 2) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      items.push(
        <PaginationItem key={"last-page"}>
          <PaginationLink
            onClick={() => onPageChanged(lastPage.toString())}
            isActive={currentPage === lastPage}
          >
            {lastPage}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  const selectedRows = table.getSelectedRowModel().rows;
  const selectedData = selectedRows.map((row) => row.original);
  const leafColumns = table.getVisibleLeafColumns()

  const shouldShowSelection = selectedData.length > 0;
  const activeFilterCount = serverSide
    ? Object.keys(serverFilters ?? {}).length
    : columnFilters.length;

  useEffect(() => {
    if (isResetSelectedRow) {
      setRowSelection({});
    }
  }, [isResetSelectedRow]);

  return (
    <div className={cn("flex flex-col max-w-full gap-2", className)}>
      <div className="rounded-xl border overflow-auto pb-2">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => {
              return (
                <TableRow key={headerGroup.id + "header-group"}>
                  {headerGroup.headers.map((header, index) => {
                    const isTaskStatus =
                      header.column.id === "taskStatusGroup" ||
                      header.column.parent?.id === "taskStatusGroup"


                    return (
                      <TableHead colSpan={header.colSpan} key={header.id + index} className={cn({
                        "bg-yellow/5 dark:bg-yellow/10": isTaskStatus
                      })}>
                        {header.isPlaceholder ? null : (
                          <ColumnHeader
                            header={header}
                            serverSide={serverSide}
                            sort={sort}
                            onSortChange={onSortChange}
                            facets={facets}
                            columnFilters={serverFilters}
                            onColumnFilterChange={onColumnFilterChange}
                          />
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              )
            })}
          </TableHeader>
          <TableBody key={isLoading ? "loading" : keyForData(data)}>
            {isLoading ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={leafColumns.length}>
                  <SectionLoader className="min-h-56" />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, index) => {
                const data = row.original as TData;
                const rowClassName = getRowClassName?.(data) || "";
                const rowProps = {
                  className: cn("cursor-pointer", rowClassName),
                  onClick: () => onRowClick?.(row.original),
                  "data-state": row.getIsSelected() ? "selected" : undefined,
                };
                const cells = row.getVisibleCells().map((cell, index) => {
                  const cellClassName =
                    getCellClassName?.(data, cell.column.id) || "";
                  const isTaskStatus =
                    cell.column.parent?.id === "taskStatusGroup"

                  return (
                    <TableCell
                      key={cell.id + index}
                      className={cn(
                        cellClassName, {
                        "bg-yellow/5 dark:bg-yellow/10": isTaskStatus
                      }
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  );
                });

                if (RowComponent) {
                  return (
                    <RowComponent key={row.id + index} row={row.original} {...rowProps}>
                      {cells}
                    </RowComponent>
                  );
                }

                return (
                  <TableRow key={row.id + index} {...rowProps}>
                    {cells}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center "
                >
                  {noResultMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex flex-col lg:flex-row items-center justify-between gap-2 px-2 mt-4">
          <div className="flex w-fit items-center gap-3">
            <div className="flex w-fit items-center gap-3">
              <p className="text-sm w-fit" style={{ width: "70px" }}>
                {t("perPage")}{" "}
              </p>
              {ShowItemContent}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-normal text-popover-foreground ml-auto"
                  >
                    <HugeiconsIcon icon={LayoutThreeColumnIcon} />
                    {t("setColumn")}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => {
                      // A header rendered as a component can name itself in `meta.label`.
                      const metaLabel = (column.columnDef.meta as { label?: string } | undefined)?.label;
                      const headerText =
                        metaLabel ??
                        (typeof column.columnDef.header === "string"
                          ? column.columnDef.header
                          : column.id.replaceAll("_", " "));
                      return (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          checked={column.getIsVisible()}
                          className=" capitalize"
                          onCheckedChange={(value) => {
                            column.toggleVisibility(!!value);
                          }}
                        >
                          {headerText}
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="font-normal text-muted-foreground"
                onClick={() => (serverSide ? onClearColumnFilters?.() : table.resetColumnFilters())}
              >
                <HugeiconsIcon icon={FilterRemoveIcon} />
                {t("clearFilters", { count: activeFilterCount })}
              </Button>
            )}
            {
              rowSelectedComponent &&
              shouldShowSelection &&
              (typeof rowSelectedComponent === "function"
                ? rowSelectedComponent(selectedData) // render function
                : React.cloneElement(rowSelectedComponent)) // elemen biasa
            }
          </div>
          {lastPage > 1 && (
            <Pagination className="justify-center lg:justify-end">
              <PaginationContent className="max-sm:gap-0">
                <PaginationItem>
                  <PaginationPrevious
                    // href={buildLink(Math.max(page - 1, 1))}
                    onClick={() => onPageChanged((currentPage - 1).toString())}
                    aria-disabled={currentPage === 1}
                    tabIndex={currentPage === 1 ? -1 : undefined}
                    className={
                      currentPage === 1
                        ? "pointer-events-none opacity-50"
                        : undefined
                    }
                  />
                </PaginationItem>
                {renderPageNumbers()}
                <PaginationItem>
                  <PaginationNext
                    // href={buildLink(Math.min(page + 1, totalPageCount))}
                    onClick={() => onPageChanged((currentPage + 1).toString())}
                    aria-disabled={currentPage === lastPage}
                    tabIndex={currentPage === lastPage ? -1 : undefined}
                    className={
                      currentPage === lastPage
                        ? "pointer-events-none opacity-50"
                        : undefined
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * A header cell: its title, a sort toggle when the column has `meta.sortKey`, and a
 * value filter when it has `meta.filterKey`. Columns without either render as before.
 */
function ColumnHeader<TData>({
  header,
  serverSide,
  sort,
  onSortChange,
  facets,
  columnFilters,
  onColumnFilterChange,
}: {
  header: Header<TData, unknown>;
  serverSide: boolean;
  sort?: TTableSort;
  onSortChange?: (key: string) => void;
  facets?: Partial<Record<string, TTableFacet[]>>;
  columnFilters?: TTableColumnFilters;
  onColumnFilterChange?: (key: string, values: string[] | null) => void;
}) {
  const t = useTranslations("common.dataTable");
  const { column } = header;
  const { sortKey, filterKey, filterLabel, blankLabel = "" } = column.columnDef.meta ?? {};
  const title = flexRender(column.columnDef.header, header.getContext());
  const label = headerLabel(header);

  const sortable = sortKey !== undefined && (serverSide ? onSortChange !== undefined : column.getCanSort());
  const direction = serverSide
    ? sort?.key === sortKey ? sort?.direction : undefined
    : column.getIsSorted() || undefined;

  // Server facets come with the response; client facets are counted from the loaded rows.
  const columnFacets = useMemo<TTableFacet[] | undefined>(() => {
    if (filterKey === undefined) return undefined;
    if (serverSide) {
      // The API labels values in English; a column can translate them like its cells do.
      return filterLabel
        ? facets?.[filterKey]?.map((facet) => ({ ...facet, label: facet.value === BLANK_VALUE ? blankLabel : filterLabel(facet.value) }))
        : facets?.[filterKey]?.map((facet) => (facet.value === BLANK_VALUE ? { ...facet, label: blankLabel } : facet));
    }
    const counts = new Map<string, number>();
    column.getFacetedUniqueValues().forEach((count, value) => {
      const key = cellKey(value);
      counts.set(key, (counts.get(key) ?? 0) + count);
    });
    return [...counts.entries()]
      .map(([value, count]) => ({ value, label: value === BLANK_VALUE ? blankLabel : filterLabel?.(value) ?? value, count }))
      .sort((a, b) => Number(a.value === BLANK_VALUE) - Number(b.value === BLANK_VALUE) || a.label.localeCompare(b.label));
  }, [filterKey, serverSide, facets, column, filterLabel, blankLabel]);

  const filterable = filterKey !== undefined && columnFacets !== undefined && (!serverSide || onColumnFilterChange !== undefined);
  const selected = filterKey === undefined
    ? null
    : serverSide
      ? columnFilters?.[filterKey] ?? null
      : (column.getFilterValue() as string[] | undefined) ?? null;

  if (!sortable && !filterable) return <>{title}</>;

  const SortIcon = direction === "asc" ? ArrowUp02Icon : direction === "desc" ? ArrowDown02Icon : ArrowDataTransferVerticalIcon;

  return (
    <div className="flex items-center gap-0.5">
      {sortable ? (
        <button
          type="button"
          onClick={() => {
            // Ascending, then descending, then the original order, as on server tables.
            if (serverSide) onSortChange?.(sortKey);
            else if (direction === "desc") column.clearSorting();
            else column.toggleSorting(direction === "asc");
          }}
          aria-label={t("sortAria", { title: label })}
          aria-sort={direction === "asc" ? "ascending" : direction === "desc" ? "descending" : undefined}
          className="-ml-2 inline-flex h-8 cursor-pointer items-center gap-1 rounded-md px-2 font-medium transition-colors hover:bg-muted"
        >
          {title}
          <HugeiconsIcon
            icon={SortIcon}
            className={cn("size-3.5", direction ? "text-primary" : "text-muted-foreground/70")}
          />
          {direction && <span className="sr-only">{direction === "asc" ? t("sortAscending") : t("sortDescending")}</span>}
        </button>
      ) : (
        title
      )}
      {filterable && (
        <ColumnFilter
          title={label}
          hideTitle
          facets={columnFacets}
          selected={selected}
          onChange={(values) =>
            serverSide ? onColumnFilterChange?.(filterKey, values) : column.setFilterValue(values ?? undefined)
          }
        />
      )}
    </div>
  );
}

export function DataTable<TData, TValue>(props: DataTableProps<TData, TValue>) {
  return (
    <Suspense
      fallback={<div className="h-64 bg-muted rounded animate-pulse" />}
    >
      <DataTableContent<TData, TValue> {...props} />
    </Suspense>
  );
}
