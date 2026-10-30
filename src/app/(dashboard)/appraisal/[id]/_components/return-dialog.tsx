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
import { appraisalReturnSchema, type AppraisalReturnSchemaType } from "@/validations/appraisal-validations";
import { ReturnAppraisal } from "../../action";

/** The assessor sends the appraisal back to draft; the note is required and shown to the employee. */
export default function ReturnDialog({
  appraisalId,
  open,
  onOpenChange,
  onSuccess,
}: {
  appraisalId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const t = useTranslations("appraisal.form");
  const tCommon = useTranslations("common.actions");
  const translateMessage = useTranslateMessage();

  const form = useForm<AppraisalReturnSchemaType>({
    resolver: zodResolver(appraisalReturnSchema),
    defaultValues: { id: appraisalId, note: "" },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: AppraisalReturnSchemaType) => {
      const state = await ReturnAppraisal({ status: "idle" }, values);

      if (state.status === "error") throw state;

      return state;
    },
    onSuccess: (state) => {
      toast.success(translateMessage(state.message) || t("toast.returned"));
      form.reset({ id: appraisalId, note: "" });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: unknown) => {
      if (!isActionState(error)) {
        toast.error(t("toast.returnFailed"), { description: error instanceof Error ? error.message : undefined });
        return;
      }

      toast.error(t("toast.returnFailed"), { description: translateMessage(error.errors?._form?.[0] ?? error.message) || undefined });
      Object.entries(error.errors ?? {}).forEach(([field, messages]) => {
        if (field === "_form" || messages.length === 0) return;
        form.setError(field as FieldPath<AppraisalReturnSchemaType>, { type: "server", message: messages[0] });
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={isPending ? () => {} : onOpenChange}>
      <DialogContent className="max-w-full sm:max-w-120">
        <DialogHeader>
          <DialogTitle>{t("returnDialog.title")}</DialogTitle>
          <DialogDescription>{t("returnDialog.description")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((values) => mutate(values))} className="flex flex-col gap-4">
            <fieldset disabled={isPending} className="flex min-w-0 flex-col gap-4">
              <FormInput form={form} name="note" type="textarea" label={t("returnDialog.note")} placeholder={t("returnDialog.notePlaceholder")} isRequired />
            </fieldset>
            <DialogFooter className="flex-row items-center gap-2">
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending ? <LoadingButton /> : t("actions.return")}
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
