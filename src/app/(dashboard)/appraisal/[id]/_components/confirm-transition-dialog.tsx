"use client";

import { useTranslations } from "next-intl";

import LoadingButton from "@/components/common/loading-button";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { TAppraisalTransition } from "@/validations/appraisal-validations";

/** Asks once before a step that cannot be undone from this side (submit, assess). */
export default function ConfirmTransitionDialog({
  transition,
  isPending,
  onConfirm,
  onOpenChange,
}: {
  transition: TAppraisalTransition | null;
  isPending: boolean;
  onConfirm: (transition: TAppraisalTransition) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("appraisal.form");
  const tCommon = useTranslations("common.actions");
  const kind = transition ?? "submit";

  return (
    <Dialog open={!!transition} onOpenChange={isPending ? () => {} : onOpenChange}>
      <DialogContent className="max-w-full sm:max-w-110">
        <DialogHeader>
          <DialogTitle>{t(`confirm.${kind}.title`)}</DialogTitle>
          <DialogDescription>{t(`confirm.${kind}.description`)}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row items-center gap-2">
          <Button size="sm" disabled={isPending} onClick={() => transition && onConfirm(transition)}>
            {isPending ? <LoadingButton /> : t(`actions.${kind}`)}
          </Button>
          <Button size="sm" variant="outline" disabled={isPending} onClick={() => onOpenChange(false)}>
            {tCommon("cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
