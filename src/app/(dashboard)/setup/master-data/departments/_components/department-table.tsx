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
import { DELAY } from "@/constants/params-constant";
import useDebounce from "@/hooks/use-debounce";
import { useListParams } from "@/hooks/use-list-params";
import type { TDepartmentItem, TDepartmentListParams, TDepartmentSortKey } from "@/types/setup";
import { Add01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { DeleteDepartment, GetDepartments } from "../action";
import { departmentColumns } from "./department-columns";
import DepartmentFormDialog from "./department-form-dialog";

export const DEPARTMENTS_QUERY_KEY = ["setup", "departments"] as const;

export default function DepartmentTable() {
  const t = useTranslations("setup");
  const locale = useLocale();
  const debounce = useDebounce();
  const queryClient = useQueryClient();
  const { page, setPage, perPage, onLimitChange, search, onSearchChange, table } = useListParams();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editedItem, setEditedItem] = useState<TDepartmentItem | null>(null);
  const [deletedItem, setDeletedItem] = useState<TDepartmentItem | null>(null);

  const params: TDepartmentListParams = {
    page,
    per_page: perPage,
    search,
    sort_by: table.params.sort as TDepartmentSortKey | undefined,
    sort_dir: table.params.direction,
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [...DEPARTMENTS_QUERY_KEY, params],
    queryFn: () => GetDepartments(params),
    placeholderData: keepPreviousData,
  });

  const pagination = data?.meta?.pagination;

  const columns = useMemo(
    () =>
      departmentColumns({
        t,
        locale,
        current_page: pagination?.current_page ?? 1,
        per_page: pagination?.per_page ?? perPage,
        onClickEdit: (item) => {
          setEditedItem(item);
          setIsFormOpen(true);
        },
        onClickDelete: (item) => setDeletedItem(item),
      }),
    [t, locale, pagination, perPage],
  );

  const refresh = () => queryClient.invalidateQueries({ queryKey: DEPARTMENTS_QUERY_KEY });

  return (
    <Card className="flex flex-col">
      <div className="flex w-full flex-col gap-2 px-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-72">
          <HugeiconsIcon icon={Search01Icon} className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={t("departments.searchPlaceholder")}
            defaultValue={search}
            onChange={(event) => {
              const { value } = event.target;
              debounce(() => onSearchChange(value), DELAY);
            }}
          />
        </div>
        <Button
          size="sm"
          className="self-start sm:self-auto"
          onClick={() => {
            setEditedItem(null);
            setIsFormOpen(true);
          }}
        >
          <HugeiconsIcon icon={Add01Icon} className="size-4" />
          {t("departments.createLabel")}
        </Button>
      </div>

      <CardContent className="flex flex-col gap-4 overflow-auto">
        {isError && <p className="text-sm text-destructive">{(error as Error).message}</p>}
        <DataTable
          columns={columns}
          data={data?.data ?? []}
          isLoading={isLoading}
          noResultMessage={search ? t("departments.emptySearch") : t("departments.empty")}
          page={page}
          onPageChanged={(nextPage) => setPage(Number(nextPage))}
          limit={perPage}
          onLimitChanged={(nextLimit) => onLimitChange(Number(nextLimit))}
          currentPage={pagination?.current_page ?? 1}
          lastPage={pagination?.last_page ?? 1}
          {...table.tableProps}
        />

        <DepartmentFormDialog
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
          action={DeleteDepartment}
          onSuccess={refresh}
        />
      </CardContent>
    </Card>
  );
}
