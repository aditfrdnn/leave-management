"use client";

import { useMemo, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";

import { DataTable } from "@/components/common/data-table";
import DeleteDialog from "@/components/common/delete-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DELAY } from "@/constants/params-constant";
import useDebounce from "@/hooks/use-debounce";
import { useListParams } from "@/hooks/use-list-params";
import type { THolidayItem, THolidayListParams, THolidayType } from "@/types/setup";
import { Add01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { DeleteHoliday, GetHolidays } from "../action";
import { holidayColumns } from "./holiday-columns";
import HolidayFormDialog from "./holiday-form-dialog";

export const HOLIDAYS_QUERY_KEY = ["setup", "holidays"] as const;

const ALL = "all";
const THIS_YEAR = new Date().getFullYear();
const YEARS = [THIS_YEAR + 1, THIS_YEAR, THIS_YEAR - 1];

export default function HolidayTable() {
  const t = useTranslations("setup");
  const locale = useLocale();
  const debounce = useDebounce();
  const queryClient = useQueryClient();
  const { page, setPage, perPage, onLimitChange, search, onSearchChange, table, resetPage } = useListParams();

  const [year, setYear] = useState(THIS_YEAR);
  const [type, setType] = useState<THolidayType | typeof ALL>(ALL);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editedItem, setEditedItem] = useState<THolidayItem | null>(null);
  const [deletedItem, setDeletedItem] = useState<THolidayItem | null>(null);

  const params: THolidayListParams = {
    page,
    per_page: perPage,
    year,
    search,
    type: type === ALL ? undefined : type,
    sort_by: table.params.sort as THolidayListParams["sort_by"],
    sort_dir: table.params.direction,
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [...HOLIDAYS_QUERY_KEY, params],
    queryFn: () => GetHolidays(params),
    placeholderData: keepPreviousData,
  });

  const pagination = data?.meta?.pagination;

  const columns = useMemo(
    () =>
      holidayColumns({
        t,
        locale,
        onClickEdit: (item) => {
          setEditedItem(item);
          setIsFormOpen(true);
        },
        onClickDelete: (item) => setDeletedItem(item),
      }),
    [t, locale],
  );

  // The leave calendar caches holidays too; a change here must show there.
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: HOLIDAYS_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ["leave", "holiday-calendar"] });
  };

  return (
    <Card className="flex flex-col">
      <div className="flex w-full flex-col gap-2 px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full flex-wrap items-center gap-2">
          <div className="relative w-full sm:max-w-64">
            <HugeiconsIcon icon={Search01Icon} className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder={t("holidays.searchPlaceholder")}
              defaultValue={search}
              onChange={(event) => {
                const { value } = event.target;
                debounce(() => onSearchChange(value), DELAY);
              }}
            />
          </div>
          <Select
            value={String(year)}
            onValueChange={(value) => {
              setYear(Number(value));
              resetPage();
            }}
          >
            <SelectTrigger className="w-full rounded-lg sm:w-28" aria-label={t("holidays.filters.year")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={type}
            onValueChange={(value) => {
              setType(value as THolidayType | typeof ALL);
              resetPage();
            }}
          >
            <SelectTrigger className="w-full rounded-lg sm:w-44" aria-label={t("holidays.fields.type")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t("holidays.filters.allTypes")}</SelectItem>
              <SelectItem value="public">{t("holidays.types.public")}</SelectItem>
              <SelectItem value="mass_leave">{t("holidays.types.mass_leave")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          size="sm"
          className="shrink-0 self-start lg:self-auto"
          onClick={() => {
            setEditedItem(null);
            setIsFormOpen(true);
          }}
        >
          <HugeiconsIcon icon={Add01Icon} className="size-4" />
          {t("holidays.createLabel")}
        </Button>
      </div>

      <CardContent className="flex flex-col gap-4 overflow-auto">
        {isError && <p className="text-sm text-destructive">{(error as Error).message}</p>}
        <DataTable
          columns={columns}
          data={data?.data ?? []}
          isLoading={isLoading}
          noResultMessage={search || type !== ALL ? t("holidays.emptySearch") : t("holidays.empty", { year })}
          page={page}
          onPageChanged={(nextPage) => setPage(Number(nextPage))}
          limit={perPage}
          onLimitChanged={(nextLimit) => onLimitChange(Number(nextLimit))}
          currentPage={pagination?.current_page ?? 1}
          lastPage={pagination?.last_page ?? 1}
          {...table.tableProps}
        />

        <HolidayFormDialog
          open={isFormOpen}
          onOpenChange={(open) => {
            setIsFormOpen(open);
            if (!open) setEditedItem(null);
          }}
          item={editedItem}
          onSuccess={refresh}
        />

        <DeleteDialog
          open={!!deletedItem}
          onOpenChange={(open) => !open && setDeletedItem(null)}
          id={deletedItem?.id ?? ""}
          name={deletedItem?.name ?? ""}
          action={DeleteHoliday}
          onSuccess={refresh}
        />
      </CardContent>
    </Card>
  );
}
