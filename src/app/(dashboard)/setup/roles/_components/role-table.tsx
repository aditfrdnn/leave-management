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
import type { TRoleItem, TRoleListParams } from "@/types/setup";
import { Add01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { DeleteRole, GetRoles } from "../action";
import { roleColumns } from "./role-columns";
import RoleDetailSheet, { ROLE_DETAIL_PREFIX } from "./role-detail-sheet";
import RoleFormDialog from "./role-form-dialog";

export const ROLES_QUERY_KEY = ["setup", "roles"] as const;

export default function RoleTable() {
  const t = useTranslations("setup");
  const debounce = useDebounce();
  const queryClient = useQueryClient();
  const { page, setPage, perPage, onLimitChange, search, onSearchChange } = useListParams();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editedItem, setEditedItem] = useState<TRoleItem | null>(null);
  const [deletedItem, setDeletedItem] = useState<TRoleItem | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const params: TRoleListParams = { page, per_page: perPage, search };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [...ROLES_QUERY_KEY, params],
    queryFn: () => GetRoles(params),
    placeholderData: keepPreviousData,
  });

  const pagination = data?.meta?.pagination;

  const columns = useMemo(
    () =>
      roleColumns({
        t,
        current_page: pagination?.current_page ?? 1,
        per_page: pagination?.per_page ?? perPage,
        onClickDetail: (item) => setDetailId(item.id),
        onClickEdit: (item) => {
          setEditedItem(item);
          setIsFormOpen(true);
        },
        onClickDelete: (item) => setDeletedItem(item),
      }),
    [t, pagination, perPage],
  );

  const afterSave = () => {
    queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ROLE_DETAIL_PREFIX });
  };

  return (
    <Card className="flex flex-col">
      <div className="flex w-full flex-col gap-2 px-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-72">
          <HugeiconsIcon icon={Search01Icon} className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={t("roles.searchPlaceholder")}
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
          {t("roles.createLabel")}
        </Button>
      </div>

      <CardContent className="flex flex-col gap-4 overflow-auto">
        {isError && <p className="text-sm text-destructive">{(error as Error).message}</p>}
        <DataTable
          columns={columns}
          data={data?.data ?? []}
          isLoading={isLoading}
          noResultMessage={search ? t("roles.emptySearch") : t("roles.empty")}
          page={page}
          onPageChanged={(nextPage) => setPage(Number(nextPage))}
          limit={perPage}
          onLimitChanged={(nextLimit) => onLimitChange(Number(nextLimit))}
          currentPage={pagination?.current_page ?? 1}
          lastPage={pagination?.last_page ?? 1}
        />

        <RoleFormDialog
          open={isFormOpen}
          onOpenChange={(open) => {
            setIsFormOpen(open);
            if (!open) setEditedItem(null);
          }}
          item={editedItem}
          onSuccess={afterSave}
        />

        <RoleDetailSheet roleId={detailId} onOpenChange={(open) => !open && setDetailId(null)} />

        <DeleteDialog
          open={!!deletedItem}
          onOpenChange={(open) => !open && setDeletedItem(null)}
          id={deletedItem?.id ?? ""}
          name={deletedItem?.title ?? ""}
          action={DeleteRole}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEY })}
        />
      </CardContent>
    </Card>
  );
}
