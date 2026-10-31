import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import LoadingButton from "./loading-button";
import { startTransition, useActionState, useEffect, type ReactNode } from "react";
import { ActionFn, ActionState } from "@/types/action-state";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useTranslateMessage } from "@/hooks/use-translate-message";
import { Delete02Icon } from "@hugeicons/core-free-icons";
import { useRefreshAfterChange } from "@/lib/refresh-after-change";

type DeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  id: number | string
  name: string
  action: ActionFn
  onSuccess?: () => void
  /** Shown under the question, e.g. what else the delete removes. */
  description?: ReactNode
  /** Sent alongside `id`. */
  fields?: Record<string, string>
}

export default function DeleteDialog({
  open,
  onOpenChange,
  id,
  name,
  action,
  onSuccess,
  description,
  fields,
}: DeleteDialogProps) {
  const t = useTranslations("common");
  const translateMessage = useTranslateMessage();
  const refreshAfterChange = useRefreshAfterChange();

  // Delete Handling
  const [deleteState, deleteAction, isPendingDelete] = useActionState<ActionState, FormData>(action, { status: "idle" });

  const handleDelete = () => {
    const formData = new FormData()
    formData.append("id", String(id))
    Object.entries(fields ?? {}).forEach(([key, value]) => formData.append(key, value))

    startTransition(() => {
      deleteAction(formData)
    })
  }

  useEffect(() => {
    if (deleteState.status === "error") {
      toast.error(t("deleteDialog.failed"), {
        description: translateMessage(deleteState.errors?._form?.[0]),
      })
    }

    if (deleteState.status === "success") {
      toast.success(translateMessage(deleteState.message) || t("deleteDialog.success"))
      onOpenChange(false)
      refreshAfterChange()
      onSuccess?.()
    }
  }, [deleteState])

  return (
    <Dialog open={open} onOpenChange={isPendingDelete ? () => { } : onOpenChange}>
      <DialogContent className="max-w-full sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>{t("actions.confirm")}</DialogTitle>
          <DialogDescription>
            {t.rich("deleteDialog.question", {
              name: name || "",
              b: (chunks) => <span className="font-semibold">{chunks}</span>,
            })}
          </DialogDescription>
          {description}
        </DialogHeader>
        <DialogFooter className="flex-row items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={isPendingDelete}
            onClick={() => handleDelete()}
          >
            {isPendingDelete ? <LoadingButton /> : t("actions.delete")}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={isPendingDelete}
            onClick={() => onOpenChange(false)}
          >
            {t("actions.cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
