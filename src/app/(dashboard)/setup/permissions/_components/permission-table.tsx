"use client";

import { useMemo, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { DataTable } from "@/components/common/data-table";
import DeleteDialog from "@/components/common/delete-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Input } from "@/components/ui/input";
import { DELAY } from "@/constants/params-constant";
import useDebounce from "@/hooks/use-debounce";
import { useListParams } from "@/hooks/use-list-params";
import type { TPermissionItem, TPermissionListParams } from "@/types/setup";
import { Add01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { DeletePermission, GetPermissions } from "../action";
import { permissionColumns } from "./permission-columns";
import PermissionFormDialog from "./permission-form-dialog";

export const PERMISSIONS_QUERY_KEY = ["setup", "permissions"] as const;
export const PERMISSION_GROUPS_QUERY_KEY = ["setup", "permission-groups"] as const;


export default function PermissionTable() {
  const t = useTranslations("setup");
  const debounce = useDebounce();
  const queryClient = useQueryClient();
  const { page, setPage, perPage, onLimitChange, search, onSearchChange, table } = useListParams();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editedItem, setEditedItem] = useState<TPermissionItem | null>(null);
  const [deletedItem, setDeletedItem] = useState<TPermissionItem | null>(null);

  const params: TPermissionListParams = {
    page,
    per_page: perPage,
    search,
    columns: table.params.columns,
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [...PERMISSIONS_QUERY_KEY, params],
    queryFn: () => GetPermissions(params),
    placeholderData: keepPreviousData,
  });

  const pagination = data?.meta?.pagination;

  const columns = useMemo(
    () =>
      permissionColumns({
        t,
        current_page: pagination?.current_page ?? 1,
        per_page: pagination?.per_page ?? perPage,
        onClickEdit: (item) => {
          setEditedItem(item);
          setIsFormOpen(true);
        },
        onClickDelete: (item) => setDeletedItem(item),
      }),
    [t, pagination, perPage],
  );

  // A new or renamed group changes the filter and the role form's checklist too.
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: PERMISSIONS_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: PERMISSION_GROUPS_QUERY_KEY });
  };

  return (
    <Card className="flex flex-col">
      <div className="flex w-full flex-col gap-2 px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full flex-wrap items-center gap-2">
          <div className="relative w-full sm:max-w-72">
            <HugeiconsIcon icon={Search01Icon} className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder={t("permissions.searchPlaceholder")}
              defaultValue={search}
              onChange={(event) => {
                const { value } = event.target;
                debounce(() => onSearchChange(value), DELAY);
              }}
            />
          </div>
        </div>
        <Button
          size="sm"
          className="self-start lg:self-auto"
          onClick={() => {
            setEditedItem(null);
            setIsFormOpen(true);
          }}
        >
          <HugeiconsIcon icon={Add01Icon} className="size-4" />
          {t("permissions.createLabel")}
        </Button>
      </div>

      <CardContent className="flex flex-col gap-4 overflow-auto">
        {isError && <p className="text-sm text-destructive">{(error as Error).message}</p>}
        <DataTable
          columns={columns}
          data={data?.data ?? []}
          isLoading={isLoading}
          noResultMessage={search || params.columns ? t("permissions.emptySearch") : t("permissions.empty")}
          page={page}
          onPageChanged={(nextPage) => setPage(Number(nextPage))}
          limit={perPage}
          onLimitChanged={(nextLimit) => onLimitChange(Number(nextLimit))}
          currentPage={pagination?.current_page ?? 1}
          lastPage={pagination?.last_page ?? 1}
          {...table.tableProps}
          facets={data?.meta?.facets}
        />

        <PermissionFormDialog
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
          name={deletedItem?.title ?? ""}
          action={DeletePermission}
          onSuccess={refresh}
        />
      </CardContent>
    </Card>
  );
}
