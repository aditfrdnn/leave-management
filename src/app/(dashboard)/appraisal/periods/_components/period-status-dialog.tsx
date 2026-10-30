"use client";

import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import LoadingButton from "@/components/common/loading-button";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslateMessage } from "@/hooks/use-translate-message";
import { isActionState } from "@/lib/action-state";
import type { TAppraisalPeriod } from "@/types/appraisal";
import { SetAppraisalPeriodStatus } from "../action";

/** Confirms closing (stops new appraisals and editing) or reopening a period. */
export default function PeriodStatusDialog({
  item,
  onOpenChange,
  onSuccess,
}: {
  item: TAppraisalPeriod | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const t = useTranslations("appraisal.periods");
  const tCommon = useTranslations("common.actions");
  const translateMessage = useTranslateMessage();
  const isClosing = item?.status === "open";

  const { mutate, isPending } = useMutation({
    mutationFn: async (period: TAppraisalPeriod) => {
      const state = await SetAppraisalPeriodStatus(period.id, period.status === "open" ? "close" : "reopen");

      if (state.status === "error") throw state;

      return state;
    },
    onSuccess: (state, period) => {
      toast.success(translateMessage(state.message) || t(period.status === "open" ? "toast.closed" : "toast.reopened"));
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: unknown) => {
      const description = isActionState(error) ? translateMessage(error.errors?._form?.[0] ?? error.message) : error instanceof Error ? error.message : undefined;

      toast.error(t("toast.statusFailed"), { description });
    },
  });

  return (
    <Dialog open={!!item} onOpenChange={isPending ? () => {} : onOpenChange}>
      <DialogContent className="max-w-full sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>{t(isClosing ? "statusDialog.closeTitle" : "statusDialog.reopenTitle")}</DialogTitle>
          <DialogDescription>
            {t.rich(isClosing ? "statusDialog.closeQuestion" : "statusDialog.reopenQuestion", {
              name: item?.name ?? "",
              b: (chunks) => <span className="font-semibold text-foreground">{chunks}</span>,
            })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row items-center gap-2">
          <Button size="sm" disabled={isPending || !item} onClick={() => item && mutate(item)}>
            {isPending ? <LoadingButton /> : t(isClosing ? "actions.close" : "actions.reopen")}
          </Button>
          <Button size="sm" variant="outline" disabled={isPending} onClick={() => onOpenChange(false)}>
            {tCommon("cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
