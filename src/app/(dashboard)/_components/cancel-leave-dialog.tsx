"use client";

import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import LoadingButton from "@/components/common/loading-button";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslateMessage } from "@/hooks/use-translate-message";
import { isActionState } from "@/lib/action-state";
import { CancelLeaveRequest } from "../action";

/** Asks the requester to confirm, then withdraws a pending request. */
export default function CancelLeaveDialog({
  leaveId,
  subject,
  open,
  onOpenChange,
  onSuccess,
}: {
  leaveId: number;
  subject: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const t = useTranslations("leave.detail");
  const tCommon = useTranslations("common.actions");
  const translateMessage = useTranslateMessage();

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("id", String(leaveId));

      const state = await CancelLeaveRequest({ status: "idle" }, formData);

      if (state.status === "error") throw state;

      return state;
    },
    onSuccess: (state) => {
      toast.success(translateMessage(state.message) || t("cancelled"));
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: unknown) => {
      const message = isActionState(error) ? translateMessage(error.message) || translateMessage(error.errors?._form?.[0]) : undefined;

      toast.error(t("cancelFailed"), { description: message || (error instanceof Error ? error.message : undefined) });
    },
  });

  return (
    <Dialog open={open} onOpenChange={isPending ? () => {} : onOpenChange}>
      <DialogContent className="max-w-full sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>{t("cancel")}</DialogTitle>
          <DialogDescription>
            {t.rich("cancelQuestion", { subject, b: (chunks) => <span className="font-semibold text-foreground">{chunks}</span> })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row items-center gap-2">
          <Button size="sm" variant="destructive" disabled={isPending} onClick={() => mutate()}>
            {isPending ? <LoadingButton /> : t("cancel")}
          </Button>
          <Button size="sm" variant="outline" disabled={isPending} onClick={() => onOpenChange(false)}>
            {tCommon("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
