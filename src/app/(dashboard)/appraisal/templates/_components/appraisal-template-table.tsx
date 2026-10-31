"use client";

import { useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { DataTable } from "@/components/common/data-table";
import DeleteDialog from "@/components/common/delete-dialog";
import LoadingButton from "@/components/common/loading-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Input } from "@/components/ui/input";
import { DELAY } from "@/constants/params-constant";
import useDebounce from "@/hooks/use-debounce";
import { useListParams } from "@/hooks/use-list-params";
import { useTranslateMessage } from "@/hooks/use-translate-message";
import type { TAppraisalTemplateListParams } from "@/services";
import type { ActionState } from "@/types/action-state";
import type { TAppraisalTemplate, TAppraisalTemplateItem } from "@/types/appraisal";
import { Add01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { CreateAppraisalTemplateDraft, DeleteAppraisalTemplate, DuplicateAppraisalTemplate, GetAppraisalTemplates } from "../action";
import { appraisalTemplateColumns } from "./appraisal-template-columns";

export const APPRAISAL_TEMPLATES_QUERY_KEY = ["setup", "appraisal-templates"] as const;

/** Throws the action's error state so `useMutation` lands in `onError`. */
async function unwrap(promise: Promise<ActionState<TAppraisalTemplate>>) {
  const state = await promise;
  if (state.status === "error" || !state.data) throw state;

  return state;
}

export default function AppraisalTemplateTable() {
  const t = useTranslations("setup");
  const locale = useLocale();
  const router = useRouter();
  const debounce = useDebounce();
  const queryClient = useQueryClient();
  const translateMessage = useTranslateMessage();
  const { page, setPage, perPage, onLimitChange, search, onSearchChange, table } = useListParams();

  const [deletedItem, setDeletedItem] = useState<TAppraisalTemplateItem | null>(null);

  const params: TAppraisalTemplateListParams = {
    page,
    per_page: perPage,
    search,
    sort_by: table.params.sort,
    sort_dir: table.params.direction,
    columns: table.params.columns,
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [...APPRAISAL_TEMPLATES_QUERY_KEY, params],
    queryFn: () => GetAppraisalTemplates(params),
    placeholderData: keepPreviousData,
  });

  const pagination = data?.meta?.pagination;

  const onFailed = (fallback: string) => (failure: unknown) => {
    const state = failure as ActionState | undefined;
    toast.error(translateMessage(state?.message) || fallback, { description: translateMessage(state?.errors?._form?.[0]) || undefined });
  };

  const openTemplate = (state: ActionState<TAppraisalTemplate>, fallback: string) => {
    queryClient.invalidateQueries({ queryKey: APPRAISAL_TEMPLATES_QUERY_KEY });
    toast.success(translateMessage(state.message) || fallback);
    if (state.data) router.push(`/appraisal/templates/${state.data.id}`);
  };

  const createDraft = useMutation({
    mutationFn: () => unwrap(CreateAppraisalTemplateDraft()),
    onSuccess: (state) => openTemplate(state, t("appraisalTemplates.toast.created")),
    onError: onFailed(t("appraisalTemplates.toast.createFailed")),
  });

  const duplicate = useMutation({
    mutationFn: (item: TAppraisalTemplateItem) => unwrap(DuplicateAppraisalTemplate(item.id)),
    onSuccess: (state) => openTemplate(state, t("appraisalTemplates.toast.duplicated")),
    onError: onFailed(t("appraisalTemplates.toast.duplicateFailed")),
  });

  const busyId = duplicate.isPending ? (duplicate.variables?.id ?? null) : null;

  const columns = useMemo(
    () =>
      appraisalTemplateColumns({
        t,
        locale,
        current_page: pagination?.current_page ?? 1,
        per_page: pagination?.per_page ?? perPage,
        busyId,
        onClickEdit: (item) => router.push(`/appraisal/templates/${item.id}`),
        onClickDuplicate: (item) => duplicate.mutate(item),
        onClickDelete: (item) => setDeletedItem(item),
      }),
    [t, locale, pagination, perPage, busyId],
  );

  return (
    <Card className="flex flex-col">
      <div className="flex w-full flex-col gap-2 px-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-72">
          <HugeiconsIcon icon={Search01Icon} className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            aria-label={t("appraisalTemplates.searchPlaceholder")}
            placeholder={t("appraisalTemplates.searchPlaceholder")}
            defaultValue={search}
            onChange={(event) => {
              const { value } = event.target;
              debounce(() => onSearchChange(value), DELAY);
            }}
          />
        </div>
        <Button size="sm" className="self-start sm:self-auto" disabled={createDraft.isPending} onClick={() => createDraft.mutate()}>
          {createDraft.isPending ? (
            <LoadingButton />
          ) : (
            <>
              <HugeiconsIcon icon={Add01Icon} className="size-4" />
              {t("appraisalTemplates.createLabel")}
            </>
          )}
        </Button>
      </div>

      <CardContent className="flex flex-col gap-4 overflow-auto">
        {isError && <p className="text-sm text-destructive">{(error as Error).message}</p>}
        <DataTable
          columns={columns}
          data={data?.data ?? []}
          isLoading={isLoading}
          noResultMessage={search ? t("appraisalTemplates.emptySearch") : t("appraisalTemplates.empty")}
          page={page}
          onPageChanged={(nextPage) => setPage(Number(nextPage))}
          limit={perPage}
          onLimitChanged={(nextLimit) => onLimitChange(Number(nextLimit))}
          currentPage={pagination?.current_page ?? 1}
          lastPage={pagination?.last_page ?? 1}
          {...table.tableProps}
          facets={data?.meta?.facets}
        />

        <DeleteDialog
          open={!!deletedItem}
          onOpenChange={(open) => !open && setDeletedItem(null)}
          id={deletedItem?.id ?? ""}
          name={deletedItem ? `${deletedItem.code} ${deletedItem.revision} — ${deletedItem.name}` : ""}
          action={DeleteAppraisalTemplate}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: APPRAISAL_TEMPLATES_QUERY_KEY })}
        />
      </CardContent>
    </Card>
  );
}
