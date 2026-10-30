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
import { useAuth } from "@/hooks/use-auth";
import useDebounce from "@/hooks/use-debounce";
import { useListParams } from "@/hooks/use-list-params";
import type { TActiveStatus, TUserItem, TUserListParams, TUserSortKey } from "@/types/setup";
import { ACTIVE_STATUSES } from "@/validations/setup-validations";
import { Add01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { DeleteUser, GetRoleOptions, GetUsers } from "../action";
import { userColumns } from "./user-columns";
import UserFormDialog, { ROLE_OPTIONS_QUERY_KEY } from "./user-form-dialog";

export const USERS_QUERY_KEY = ["setup", "users"] as const;

const ALL = "all";

export default function UserTable() {
  const t = useTranslations("setup");
  const locale = useLocale();
  const debounce = useDebounce();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { page, setPage, perPage, onLimitChange, search, onSearchChange, resetPage, table } = useListParams();

  const [status, setStatus] = useState(ALL);
  const [roleId, setRoleId] = useState(ALL);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editedItem, setEditedItem] = useState<TUserItem | null>(null);
  const [deletedItem, setDeletedItem] = useState<TUserItem | null>(null);

  const params: TUserListParams = {
    page,
    per_page: perPage,
    search,
    status: status === ALL ? undefined : (status as TActiveStatus),
    role_id: roleId === ALL ? undefined : roleId,
    sort_by: table.params.sort as TUserSortKey | undefined,
    sort_dir: table.params.direction,
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [...USERS_QUERY_KEY, params],
    queryFn: () => GetUsers(params),
    placeholderData: keepPreviousData,
  });

  const { data: roles } = useQuery({
    queryKey: ROLE_OPTIONS_QUERY_KEY,
    queryFn: () => GetRoleOptions(),
  });

  const pagination = data?.meta?.pagination;
  const isFiltered = !!(search || params.status || params.role_id);

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

  const filterChange = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    resetPage();
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

          <Select value={status} onValueChange={filterChange(setStatus)}>
            <SelectTrigger className="w-full rounded-lg sm:w-40" aria-label={t("shared.columns.status")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t("shared.filters.allStatuses")}</SelectItem>
              {ACTIVE_STATUSES.map((value) => (
                <SelectItem key={value} value={value}>
                  {t(`shared.status.${value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={roleId} onValueChange={filterChange(setRoleId)}>
            <SelectTrigger className="w-full rounded-lg sm:w-44" aria-label={t("users.fields.role")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t("users.filters.allRoles")}</SelectItem>
              {(roles ?? []).map((role) => (
                <SelectItem key={role.id} value={String(role.id)}>
                  {role.text}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
