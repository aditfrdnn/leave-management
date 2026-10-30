"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useForm, type FieldPath } from "react-hook-form";
import { toast } from "sonner";

import FormInput from "@/components/common/form-input";
import LoadingButton from "@/components/common/loading-button";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { useTranslateMessage } from "@/hooks/use-translate-message";
import { isActionState } from "@/lib/action-state";
import type { TApprovalItem } from "@/types/leave";
import { approvalDecisionSchema, type ApprovalDecisionSchemaType } from "@/validations/leave-validations";
import { DecideLeaveRequest } from "../action";

export type TDecision = "approve" | "reject";

/** One dialog for both decisions: a note is optional on approve, required on reject. */
export default function ApprovalDecisionDialog({
  item,
  decision,
  onOpenChange,
  onSuccess,
}: {
  item: TApprovalItem | null;
  decision: TDecision;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const t = useTranslations("leave.approvals");
  const tCommon = useTranslations("common.actions");
  const translateMessage = useTranslateMessage();

  const form = useForm<ApprovalDecisionSchemaType>({
    resolver: zodResolver(approvalDecisionSchema),
    defaultValues: { id: 0, decision, notes: "" },
    values: { id: item?.id ?? 0, decision, notes: "" },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: ApprovalDecisionSchemaType) => {
      const formData = new FormData();
      formData.append("id", String(values.id));
      formData.append("decision", values.decision);
      formData.append("notes", values.notes);

      const state = await DecideLeaveRequest({ status: "idle" }, formData);

      if (state.status === "error") throw state;

      return state;
    },
    onSuccess: (state) => {
      toast.success(translateMessage(state.message) || t(decision === "approve" ? "toast.approved" : "toast.rejected"));
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: unknown) => {
      if (!isActionState(error)) {
        toast.error(t("toast.failed"), { description: error instanceof Error ? error.message : undefined });
        return;
      }

      toast.error(translateMessage(error.message) || t("toast.failed"), {
        description: translateMessage(error.errors?._form?.[0]) || undefined,
      });

      Object.entries(error.errors ?? {}).forEach(([field, messages]) => {
        if (field === "_form" || messages.length === 0) return;

        form.setError(field as FieldPath<ApprovalDecisionSchemaType>, { type: "server", message: messages[0] });
      });
    },
  });

  const onSubmit = form.handleSubmit((values) => mutate(values));
  const isReject = decision === "reject";

  return (
    <Dialog open={item !== null} onOpenChange={isPending ? () => {} : onOpenChange}>
      <DialogContent className="max-w-full sm:max-w-120">
        <DialogHeader>
          <DialogTitle>{isReject ? t("dialog.rejectTitle") : t("dialog.approveTitle")}</DialogTitle>
          <DialogDescription>
            {t.rich(isReject ? "dialog.rejectDescription" : "dialog.approveDescription", {
              name: item?.user?.name ?? "-",
              subject: item?.subject ?? "-",
              b: (chunks) => <span className="font-semibold text-foreground">{chunks}</span>,
            })}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <fieldset disabled={isPending} className="flex flex-col gap-4">
              <FormInput
                form={form}
                name="notes"
                label={t("dialog.notes")}
                placeholder={isReject ? t("dialog.notesRejectPlaceholder") : t("dialog.notesApprovePlaceholder")}
                type="textarea"
                isRequired={isReject}
              />
            </fieldset>

            <DialogFooter className="flex-row items-center gap-2">
              <Button type="submit" size="sm" variant={isReject ? "destructive" : "default"} disabled={isPending}>
                {isPending ? <LoadingButton /> : isReject ? t("actions.reject") : t("actions.approve")}
              </Button>
              <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={() => onOpenChange(false)}>
                {tCommon("cancel")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
