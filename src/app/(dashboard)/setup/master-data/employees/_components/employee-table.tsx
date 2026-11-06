"use client";

import { useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { DataTable } from "@/components/common/data-table";
import DeleteDialog from "@/components/common/delete-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DELAY } from "@/constants/params-constant";
import useDebounce from "@/hooks/use-debounce";
import { useTranslateMessage } from "@/hooks/use-translate-message";
import { useListParams } from "@/hooks/use-list-params";
import type { TEmployeeBulkInvitation, TEmployeeCareer, TEmployeeItem, TEmployeeListParams, TEmployeeSortKey } from "@/types/setup";
import { Add01Icon, Loading03Icon, MailSend01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { DeleteEmployee, GetEmployees, RestoreEmployee, SendEmployeeInvitation, SendEmployeeInvitations } from "../action";
import CareerFormDialog, { type TCareerFormTarget } from "./career-form-dialog";
import CareerHistorySheet from "./career-history-sheet";
import { canInvite, employeeColumns } from "./employee-columns";
import EmployeeFormDialog from "./employee-form-dialog";
import InvitationDialog, { useAccountFeedback } from "./invitation-dialog";

export const EMPLOYEES_QUERY_KEY = ["setup", "employees"] as const;

export default function EmployeeTable() {
  const t = useTranslations("setup");
  const locale = useLocale();
  const debounce = useDebounce();
  const queryClient = useQueryClient();
  const translateMessage = useTranslateMessage();
  const accountFeedback = useAccountFeedback();
  const { page, setPage, perPage, onLimitChange, search, onSearchChange, table } = useListParams();

  const [archived, setArchived] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editedItem, setEditedItem] = useState<TEmployeeItem | null>(null);
  const [deletedItem, setDeletedItem] = useState<TEmployeeItem | null>(null);
  const [careerEmployee, setCareerEmployee] = useState<TEmployeeItem | null>(null);
  const [careerTarget, setCareerTarget] = useState<TCareerFormTarget | null>(null);
  // Bumped after an invitation run, which clears the ticked rows.
  const [invitationRuns, setInvitationRuns] = useState(0);

  const params: TEmployeeListParams = {
    page,
    per_page: perPage,
    search,
    columns: table.params.columns,
    sort_by: table.params.sort as TEmployeeSortKey | undefined,
    sort_dir: table.params.direction,
    archived: archived ? 1 : undefined,
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [...EMPLOYEES_QUERY_KEY, params],
    queryFn: () => GetEmployees(params),
    placeholderData: keepPreviousData,
  });

  // Saving an employee changes the supervisor and account pickers too.
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ["setup", "options", "employees"] });
    queryClient.invalidateQueries({ queryKey: ["setup", "users"] });
    queryClient.invalidateQueries({ queryKey: ["setup", "leave-balances"] });
    queryClient.invalidateQueries({ queryKey: ["home", "profile"] });
  };

  // Resending replaces the employee's activation link; the API sends it on WhatsApp when it can.
  const { mutate: sendInvitation, variables: invitingItem, isPending: isInviting } = useMutation({
    mutationFn: async (item: TEmployeeItem) => {
      const state = await SendEmployeeInvitation(item.id);

      if (state.status === "error") throw new Error(translateMessage(state.message) || t("employees.account.errors.invite"));

      return state.data;
    },
    onSuccess: (account, item) => {
      accountFeedback.notify(account, item.name);
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY });
    },
    onError: (error) => toast.error(error.message || t("employees.account.errors.invite")),
  });
  const invitingId = isInviting && invitingItem ? invitingItem.id : null;

  // Several at once: one summary toast, then the links WhatsApp could not take, one dialog each.
  const { mutate: sendInvitations, isPending: isInvitingMany } = useMutation({
    mutationFn: async (items: TEmployeeItem[]) => {
      const state = await SendEmployeeInvitations(items.map((item) => item.id));

      if (state.status === "error") throw new Error(translateMessage(state.message) || t("employees.account.errors.invite"));

      return state.data ?? [];
    },
    onSuccess: (results: TEmployeeBulkInvitation[]) => {
      const count = (match: (row: TEmployeeBulkInvitation) => boolean) => results.filter(match).length;
      const sent = count((row) => row.status === "invited" && !row.invitation);
      const manual = results.filter((row) => row.status === "invited" && row.invitation);
      const skipped = count((row) => ["active", "inactive", "archived", "linked"].includes(row.status));
      const earlier = count((row) => row.status === "invited_earlier");
      const failed = count((row) => row.status === "failed" || row.status === "no_email");

      const lines = [
        sent > 0 && t("employees.account.bulk.sent", { count: sent }),
        manual.length > 0 && t("employees.account.bulk.manual", { count: manual.length }),
        earlier > 0 && t("employees.account.bulk.earlier", { count: earlier }),
        skipped > 0 && t("employees.account.bulk.skipped", { count: skipped }),
        failed > 0 && t("employees.account.bulk.failed", { count: failed }),
      ].filter(Boolean);

      (failed > 0 ? toast.warning : toast.success)(lines[0] as string, { description: lines.slice(1).join(" ") || undefined });
      accountFeedback.enqueue(manual.map((row) => ({ name: row.name, invitation: row.invitation! })));
      setInvitationRuns((runs) => runs + 1);
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY });
    },
    onError: (error) => toast.error(error.message || t("employees.account.errors.invite")),
  });

  const { mutate: restore, variables: restoringItem, isPending: isRestoring } = useMutation({
    mutationFn: async (item: TEmployeeItem) => {
      const state = await RestoreEmployee(item.id);

      if (state.status === "error") throw new Error(translateMessage(state.message) || t("employees.errors.restore"));

      return state.data;
    },
    onSuccess: (_, item) => {
      toast.success(t("employees.archive.restored", { name: item.name }));
      refresh();
    },
    onError: (error) => toast.error(error.message || t("employees.errors.restore")),
  });
  const restoringId = isRestoring && restoringItem ? restoringItem.id : null;

  const pagination = data?.meta?.pagination;
  const isFiltered = !!(search || params.columns);

  const columns = useMemo(
    () =>
      employeeColumns({
        t,
        locale,
        current_page: pagination?.current_page ?? 1,
        per_page: pagination?.per_page ?? perPage,
        archived,
        onClickEdit: (item) => {
          setEditedItem(item);
          setIsFormOpen(true);
        },
        onClickCareers: (item) => setCareerEmployee(item),
        onClickDelete: (item) => setDeletedItem(item),
        onClickInvite: (item) => sendInvitation(item),
        onClickRestore: (item) => restore(item),
        invitingId,
        restoringId,
      }),
    [t, locale, pagination, perPage, archived, sendInvitation, restore, invitingId, restoringId],
  );

  // A career change rewrites the employee's current position, type, grade and department; the
  // invalidation above also refetches the open history (its key sits under the employees key).
  const onCareerSaved = (employee?: TEmployeeItem) => {
    refresh();
    if (!employee) return;
    setEditedItem((current) => (current?.id === employee.id ? employee : current));
    setCareerEmployee((current) => (current?.id === employee.id ? employee : current));
  };

  const archiving = deletedItem?.user != null;

  return (
    <Card className="flex flex-col">
      <div className="flex w-full flex-col gap-2 px-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex w-full flex-wrap items-center gap-2">
          <Tabs
            value={archived ? "archived" : "current"}
            onValueChange={(value) => {
              setArchived(value === "archived");
              setPage(1);
            }}
          >
            <TabsList>
              <TabsTrigger value="current">{t("employees.archive.current")}</TabsTrigger>
              <TabsTrigger value="archived">{t("employees.archive.archived")}</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative w-full sm:max-w-72">
            <HugeiconsIcon icon={Search01Icon} className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder={t("employees.searchPlaceholder")}
              defaultValue={search}
              onChange={(event) => {
                const { value } = event.target;
                debounce(() => onSearchChange(value), DELAY);
              }}
            />
          </div>
        </div>

        {!archived && (
          <Button
            size="sm"
            className="self-start"
            onClick={() => {
              setEditedItem(null);
              setIsFormOpen(true);
            }}
          >
            <HugeiconsIcon icon={Add01Icon} className="size-4" />
            {t("employees.createLabel")}
          </Button>
        )}
      </div>

      <CardContent className="flex flex-col gap-4 overflow-auto">
        {isError && <p className="text-sm text-destructive">{(error as Error).message}</p>}
        <DataTable
          columns={columns}
          data={data?.data ?? []}
          isLoading={isLoading}
          noResultMessage={archived ? t("employees.archive.empty") : isFiltered ? t("employees.emptySearch") : t("employees.empty")}
          page={page}
          onPageChanged={(nextPage) => setPage(Number(nextPage))}
          limit={perPage}
          onLimitChanged={(nextLimit) => onLimitChange(Number(nextLimit))}
          currentPage={pagination?.current_page ?? 1}
          lastPage={pagination?.last_page ?? 1}
          {...table.tableProps}
          facets={data?.meta?.facets}
          getRowId={(row) => row.id}
          selectionResetKey={`${archived}:${invitationRuns}`}
          rowSelectedComponent={(selected) => {
            const invitable = selected.filter(canInvite);

            return (
              <Button size="sm" disabled={invitable.length === 0 || isInvitingMany} onClick={() => sendInvitations(invitable)}>
                <HugeiconsIcon icon={isInvitingMany ? Loading03Icon : MailSend01Icon} className={isInvitingMany ? "size-4 animate-spin" : "size-4"} />
                {t("employees.account.inviteSelected", { count: invitable.length })}
              </Button>
            );
          }}
        />

        <EmployeeFormDialog
          open={isFormOpen}
          onOpenChange={(open) => {
            setIsFormOpen(open);
            if (!open) setEditedItem(null);
          }}
          item={editedItem}
          onSuccess={refresh}
          onChangeCareer={(employee) => setCareerTarget({ employee, career: null })}
          onShowCareers={(employee) => setCareerEmployee(employee)}
        />

        <CareerHistorySheet
          employee={careerEmployee}
          onOpenChange={(open) => !open && setCareerEmployee(null)}
          onAdd={(employee) => setCareerTarget({ employee, career: null })}
          onEdit={(employee: TEmployeeItem, career: TEmployeeCareer) => setCareerTarget({ employee, career })}
          onChanged={() => onCareerSaved()}
        />

        <CareerFormDialog target={careerTarget} onOpenChange={(open) => !open && setCareerTarget(null)} onSaved={onCareerSaved} />

        <InvitationDialog target={accountFeedback.target} onClose={accountFeedback.close} />

        <DeleteDialog
          open={!!deletedItem}
          onOpenChange={(open) => !open && setDeletedItem(null)}
          id={deletedItem?.id ?? ""}
          name={deletedItem?.name ?? ""}
          action={DeleteEmployee}
          onSuccess={refresh}
          question={
            archiving
              ? t.rich("employees.archive.question", {
                  name: deletedItem?.name ?? "",
                  b: (chunks) => <span className="font-semibold">{chunks}</span>,
                })
              : undefined
          }
          description={archiving ? <p className="text-sm text-muted-foreground">{t("employees.archive.description")}</p> : undefined}
          confirmLabel={archiving ? t("employees.archive.confirm") : undefined}
        />
      </CardContent>
    </Card>
  );
}
