"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import ErrorState from "@/components/common/error-state";
import LoadingButton from "@/components/common/loading-button";
import { SectionLoader } from "@/components/common/loader";
import PageHeader from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { appraisalPdf } from "@/constants/endpoint-constant";
import { useTranslateMessage } from "@/hooks/use-translate-message";
import type { ActionState } from "@/types/action-state";
import type { TAppraisalDetail, TKpiReviewRow, TKpiTargetRow, TRatingAnswer, TTextField } from "@/types/appraisal";
import type { TAppraisalTransition } from "@/validations/appraisal-validations";
import {
  ArrowLeft01Icon,
  ArrowTurnBackwardIcon,
  CheckmarkBadge01Icon,
  CheckmarkCircle02Icon,
  Download04Icon,
  FloppyDiskIcon,
  InformationCircleIcon,
  SentIcon,
} from "@hugeicons/core-free-icons";
import { GetAppraisal, SaveAppraisalAnswers, TransitionAppraisal } from "../../action";
import { fillPeriodPlaceholders, periodRanges } from "../../_components/appraisal-format";
import { APPRAISAL_DETAIL_QUERY_KEY, APPRAISAL_LIST_QUERY_KEY, APPRAISAL_PERIODS_QUERY_KEY } from "../../_components/query-keys";
import { hasReached, kpiMinRows, normalizeAnswers, scrollToFirstError, toAnswerErrors, type TAnswerErrors, type TKpiRow } from "./answers";
import AppraisalHeader from "./appraisal-header";
import ConfirmTransitionDialog from "./confirm-transition-dialog";
import KpiSection from "./kpi-section";
import RatingSection from "./rating-section";
import ReturnDialog from "./return-dialog";
import TextSection from "./text-section";

type TPending = "save" | TAppraisalTransition | null;

/** Loads the appraisal; the API decides access, so a 403 lands in the error state. */
export default function AppraisalForm({ id }: { id: number }) {
  const t = useTranslations("appraisal");
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: APPRAISAL_DETAIL_QUERY_KEY(id),
    queryFn: () => GetAppraisal(id),
  });

  if (isLoading) return <SectionLoader className="min-h-60" />;

  if (isError || !data) {
    return <ErrorState title={t("page.form.title")} error={(error as Error) ?? new Error(t("errors.loadDetail"))} reset={() => refetch()} />;
  }

  return <AppraisalEditor key={data.id} detail={data} />;
}

/** The form itself, rendered from `detail.template.schema` only. */
function AppraisalEditor({ detail }: { detail: TAppraisalDetail }) {
  const t = useTranslations("appraisal");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const translateMessage = useTranslateMessage();

  const [answers, setAnswers] = useState(() => normalizeAnswers(detail));
  const [isDirty, setIsDirty] = useState(false);
  const [errors, setErrors] = useState<TAnswerErrors>({});
  const [pending, setPending] = useState<TPending>(null);
  const [confirm, setConfirm] = useState<TAppraisalTransition | null>(null);
  const [isReturnOpen, setIsReturnOpen] = useState(false);

  const role = detail.my_role;
  const canEdit = detail.can_edit;
  const selfEditable = canEdit && role === "employee";
  const finalEditable = canEdit && role === "assessor";
  const showFinal = role !== "employee" || hasReached(detail.status, "assessed");
  const ranges = periodRanges(detail.period, locale, (values) => t("format.range", values));
  const fill = (text: string) => fillPeriodPlaceholders(text, ranges);

  // Closing the tab or reloading with unsaved answers asks first.
  useEffect(() => {
    if (!isDirty) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);

    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  /* --------------------------------- Edits --------------------------------- */

  const clearErrors = (prefix: string) =>
    setErrors((current) => {
      const keys = Object.keys(current).filter((key) => key === prefix || key.startsWith(`${prefix}.`));
      if (keys.length === 0) return current;

      const next = { ...current };
      keys.forEach((key) => delete next[key]);

      return next;
    });

  const setSection = (sectionKey: string, value: TAppraisalDetail["answers"][string], errorPrefix = sectionKey) => {
    setAnswers((current) => ({ ...current, [sectionKey]: value }));
    setIsDirty(true);
    clearErrors(errorPrefix);
  };

  /* ------------------------------- Server I/O ------------------------------ */

  const detailKey = APPRAISAL_DETAIL_QUERY_KEY(detail.id);

  const showFailure = (state: ActionState<TAppraisalDetail>, fallback: string) => {
    const fieldErrors = toAnswerErrors(state.errors);
    setErrors(fieldErrors);

    const formMessage = translateMessage(state.errors?._form?.[0]);
    const message = translateMessage(state.message) || formMessage || fallback;
    const count = Object.keys(fieldErrors).length;

    toast.error(message, {
      description: count > 0 ? t("form.toast.fixErrors", { count }) : formMessage && formMessage !== message ? formMessage : undefined,
    });

    if (count > 0) scrollToFirstError();
  };

  /** Takes the server's copy as the new baseline. */
  const applyDetail = (fresh: TAppraisalDetail) => {
    queryClient.setQueryData(detailKey, fresh);
    setAnswers(normalizeAnswers(fresh));
    setIsDirty(false);
  };

  const reloadDetail = async () => {
    const fresh = await queryClient.fetchQuery({ queryKey: detailKey, queryFn: () => GetAppraisal(detail.id), staleTime: 0 });
    applyDetail(fresh);
  };

  /** PUT the answers; resolves to false when it failed (errors already shown). */
  const persist = async () => {
    const state = await SaveAppraisalAnswers(detail.id, answers);

    if (state.status === "error") {
      showFailure(state, t("form.toast.saveFailed"));
      return false;
    }

    setErrors({});
    if (state.data?.template) applyDetail(state.data);
    else await reloadDetail();

    return true;
  };

  const onSave = async () => {
    setPending("save");
    try {
      if (await persist()) toast.success(t("form.toast.saved"));
    } catch (failure) {
      toast.error(t("form.toast.saveFailed"), { description: failure instanceof Error ? failure.message : undefined });
    } finally {
      setPending(null);
    }
  };

  const refreshLists = () => {
    queryClient.invalidateQueries({ queryKey: APPRAISAL_LIST_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: APPRAISAL_PERIODS_QUERY_KEY });
  };

  const runTransition = async (transition: TAppraisalTransition) => {
    setPending(transition);
    try {
      // The server checks completeness against what it has, so unsaved answers go first.
      if (canEdit && transition !== "acknowledge" && !(await persist())) return;

      const state = await TransitionAppraisal(detail.id, transition);

      if (state.status === "error") {
        showFailure(state, t(`form.toast.${transition}Failed`));
        return;
      }

      toast.success(translateMessage(state.message) || t(`form.toast.${transition}Done`));
      setErrors({});
      refreshLists();
      await reloadDetail();
    } catch (failure) {
      toast.error(t(`form.toast.${transition}Failed`), { description: failure instanceof Error ? failure.message : undefined });
    } finally {
      setPending(null);
      setConfirm(null);
    }
  };

  const afterReturn = async () => {
    refreshLists();
    await reloadDetail();
  };

  /* -------------------------------- Render --------------------------------- */

  const isTextEditable = (field: TTextField) => canEdit && role !== "viewer" && (field.filled_by === "both" || field.filled_by === role);
  const isTextHidden = (field: TTextField) => role === "employee" && field.filled_by === "assessor" && !hasReached(detail.status, "assessed");

  const readOnlyReason =
    detail.period.status === "closed" && detail.status !== "acknowledged"
      ? "periodClosed"
      : role === "viewer"
        ? "viewer"
        : detail.status === "acknowledged"
          ? "completed"
          : detail.status === "assessed"
            ? role === "employee"
              ? "awaitingAcknowledge"
              : "assessed"
            : detail.status === "submitted"
              ? "awaitingAssessment"
              : "awaitingSubmission";

  const backHref = role === "employee" ? "/appraisal/my" : role === "assessor" ? "/appraisal/team" : "/appraisal/reports";
  const isBusy = pending !== null;

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div>
        <Button asChild variant="outline" size="sm">
          <Link
            href={backHref}
            onClick={(event) => {
              if (isDirty && !window.confirm(t("form.leaveConfirm"))) event.preventDefault();
            }}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
            {t("form.back")}
          </Link>
        </Button>
      </div>

      <PageHeader title={t("page.form.title")} description={t("form.subtitle", { name: detail.snapshot?.employee?.name ?? detail.employee.name, period: detail.period.name })} />

      <AppraisalHeader detail={detail} ranges={ranges} />

      {detail.status === "draft" && detail.return_note && (
        <div className="flex gap-3 rounded-xl border border-yellow/30 bg-yellow/12 p-4 text-sm" role="note">
          <HugeiconsIcon icon={ArrowTurnBackwardIcon} className="mt-0.5 size-4 shrink-0 text-yellow-strong" />
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="font-semibold text-yellow-strong">{t("form.returnedTitle")}</p>
            <p className="whitespace-pre-wrap">{detail.return_note}</p>
          </div>
        </div>
      )}

      {!canEdit && (
        <div className="flex items-start gap-2 rounded-xl border bg-muted/40 p-3 text-sm text-muted-foreground" role="note">
          <HugeiconsIcon icon={InformationCircleIcon} className="mt-0.5 size-4 shrink-0" />
          <p>{t(`form.readOnly.${readOnlyReason}`)}</p>
        </div>
      )}

      {detail.template.schema.sections.map((section) => {
        const title = fill(section.title);
        const instructions = fill(section.instructions ?? "");

        switch (section.kind) {
          case "rating":
            return (
              <RatingSection
                key={section.key}
                section={section}
                title={title}
                instructions={instructions}
                value={(answers[section.key] ?? {}) as Record<string, TRatingAnswer>}
                isLeader={detail.is_leader}
                selfEditable={selfEditable}
                finalEditable={finalEditable}
                showFinal={showFinal}
                errors={errors}
                onChange={(itemKey, side, rating) => {
                  const current = (answers[section.key] ?? {}) as Record<string, TRatingAnswer>;
                  const item = current[itemKey] ?? { self: null, final: null };
                  setSection(section.key, { ...current, [itemKey]: { ...item, [side]: rating } }, `${section.key}.${itemKey}.${side}`);
                }}
              />
            );
          case "kpi_review":
          case "kpi_target":
            return (
              <KpiSection
                key={section.key}
                sectionKey={section.key}
                title={title}
                instructions={instructions}
                scale={section.kind === "kpi_review" ? section.scale : undefined}
                minRows={kpiMinRows(section, role)}
                maxRows={section.max_rows}
                rows={(answers[section.key] ?? []) as TKpiRow[]}
                rowsEditable={canEdit && role !== "viewer"}
                selfEditable={selfEditable}
                finalEditable={finalEditable}
                showFinal={showFinal}
                errors={errors}
                onChange={(rows) => setSection(section.key, rows as TKpiReviewRow[] | TKpiTargetRow[])}
              />
            );
          case "text":
            return (
              <TextSection
                key={section.key}
                section={section}
                title={title}
                instructions={instructions}
                value={(answers[section.key] ?? {}) as Record<string, string>}
                isEditable={isTextEditable}
                isHidden={isTextHidden}
                errors={errors}
                onChange={(fieldKey, text) => {
                  const current = (answers[section.key] ?? {}) as Record<string, string>;
                  setSection(section.key, { ...current, [fieldKey]: text }, `${section.key}.${fieldKey}`);
                }}
              />
            );
          default:
            return null;
        }
      })}

      <div className="sticky bottom-0 z-20 flex flex-col gap-2 rounded-xl border bg-background/95 p-3 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {canEdit ? (isDirty ? t("form.unsaved") : t("form.saved")) : t(`status.${detail.status}`)}
        </p>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <Button asChild variant="outline" size="sm">
            <a href={appraisalPdf(detail.id)} target="_blank" rel="noopener noreferrer">
              <HugeiconsIcon icon={Download04Icon} className="size-4" />
              {t("form.actions.pdf")}
            </a>
          </Button>
          {canEdit && (
            <Button type="button" variant="outline" size="sm" disabled={isBusy} onClick={onSave}>
              {pending === "save" ? (
                <LoadingButton />
              ) : (
                <>
                  <HugeiconsIcon icon={FloppyDiskIcon} className="size-4" />
                  {t("form.actions.save")}
                </>
              )}
            </Button>
          )}
          {detail.can_return && (
            <Button type="button" variant="outlineYellow" size="sm" disabled={isBusy} onClick={() => setIsReturnOpen(true)}>
              <HugeiconsIcon icon={ArrowTurnBackwardIcon} className="size-4" />
              {t("form.actions.return")}
            </Button>
          )}
          {detail.can_submit && (
            <Button type="button" size="sm" disabled={isBusy} onClick={() => setConfirm("submit")}>
              <HugeiconsIcon icon={SentIcon} className="size-4" />
              {t("form.actions.submit")}
            </Button>
          )}
          {detail.can_assess && (
            <Button type="button" size="sm" disabled={isBusy} onClick={() => setConfirm("assess")}>
              <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4" />
              {t("form.actions.assess")}
            </Button>
          )}
          {detail.can_acknowledge && (
            <Button type="button" size="sm" disabled={isBusy} onClick={() => setConfirm("acknowledge")}>
              <HugeiconsIcon icon={CheckmarkBadge01Icon} className="size-4" />
              {t("form.actions.acknowledge")}
            </Button>
          )}
        </div>
      </div>

      <ConfirmTransitionDialog
        transition={confirm}
        isPending={pending !== null && pending !== "save"}
        onConfirm={runTransition}
        onOpenChange={(open) => !open && setConfirm(null)}
      />

      {detail.can_return && <ReturnDialog appraisalId={detail.id} open={isReturnOpen} onOpenChange={setIsReturnOpen} onSuccess={afterReturn} />}
    </div>
  );
}
