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
import { useAuth } from "@/hooks/use-auth";
import useDebounce from "@/hooks/use-debounce";
import { useListParams } from "@/hooks/use-list-params";
import type { TUserItem, TUserListParams, TUserSortKey } from "@/types/setup";
import { Add01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { DeleteUser, GetUsers } from "../action";
import { userColumns } from "./user-columns";
import UserFormDialog from "./user-form-dialog";

export const USERS_QUERY_KEY = ["setup", "users"] as const;


export default function UserTable() {
  const t = useTranslations("setup");
  const locale = useLocale();
  const debounce = useDebounce();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { page, setPage, perPage, onLimitChange, search, onSearchChange, table } = useListParams();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editedItem, setEditedItem] = useState<TUserItem | null>(null);
  const [deletedItem, setDeletedItem] = useState<TUserItem | null>(null);

  const params: TUserListParams = {
    page,
    per_page: perPage,
    search,
    columns: table.params.columns,
    sort_by: table.params.sort as TUserSortKey | undefined,
    sort_dir: table.params.direction,
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [...USERS_QUERY_KEY, params],
    queryFn: () => GetUsers(params),
    placeholderData: keepPreviousData,
  });

  const pagination = data?.meta?.pagination;
  const isFiltered = !!(search || params.columns);

  const columns = useMemo(
    () =>
      userColumns({
        t,
        locale,
        current_page: pagination?.current_page ?? 1,
        per_page: pagination?.per_page ?? perPage,
        currentUserId: user?.id,
        onClickEdit: (item) => {
          setEditedItem(item);
          setIsFormOpen(true);
        },
        onClickDelete: (item) => setDeletedItem(item),
      }),
    [t, locale, pagination, perPage, user?.id],
  );

  // Linking or unlinking an employee changes who the account picker and the employee list show.
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ["setup", "options", "employees"] });
    queryClient.invalidateQueries({ queryKey: ["setup", "employees"] });
  };

  return (
    <Card className="flex flex-col">
      <div className="flex w-full flex-col gap-2 px-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex w-full flex-wrap items-center gap-2">
          <div className="relative w-full sm:max-w-72">
            <HugeiconsIcon icon={Search01Icon} className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder={t("users.searchPlaceholder")}
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
          className="self-start"
          onClick={() => {
            setEditedItem(null);
            setIsFormOpen(true);
          }}
        >
          <HugeiconsIcon icon={Add01Icon} className="size-4" />
          {t("users.createLabel")}
        </Button>
      </div>

      <CardContent className="flex flex-col gap-4 overflow-auto">
        {isError && <p className="text-sm text-destructive">{(error as Error).message}</p>}
        <DataTable
          columns={columns}
          data={data?.data ?? []}
          isLoading={isLoading}
          noResultMessage={isFiltered ? t("users.emptySearch") : t("users.empty")}
          page={page}
          onPageChanged={(nextPage) => setPage(Number(nextPage))}
          limit={perPage}
          onLimitChanged={(nextLimit) => onLimitChange(Number(nextLimit))}
          currentPage={pagination?.current_page ?? 1}
          lastPage={pagination?.last_page ?? 1}
          {...table.tableProps}
          facets={data?.meta?.facets}
        />

        <UserFormDialog
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
          action={DeleteUser}
          description={<p className="text-xs text-muted-foreground">{t("users.deleteHint")}</p>}
          onSuccess={refresh}
        />
      </CardContent>
    </Card>
  );
}
