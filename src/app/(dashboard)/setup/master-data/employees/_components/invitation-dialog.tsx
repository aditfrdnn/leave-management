"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Textarea } from "@/components/ui/textarea";
import type { TEmployeeAccount, TEmployeeInvitation } from "@/types/setup";
import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons";

export type TInvitationTarget = { name: string; invitation: TEmployeeInvitation };

/**
 * An activation link that did not go out on WhatsApp (the employee has no phone number), as the
 * ready-to-send message the API wrote. HR copies it and sends it themselves. Like the IAM Portal's
 * invitation dialog it closes only on a deliberate click, since the link is not shown again.
 */
export default function InvitationDialog({ target, onClose }: { target: TInvitationTarget | null; onClose: () => void }) {
  const t = useTranslations("setup.employees.account.invitation");
  const [copied, setCopied] = useState(false);
  const message = target?.invitation.message ?? "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      toast.success(t("copied"));
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  return (
    <Dialog open={target !== null}>
      <DialogContent
        className="sm:max-w-lg"
        showCloseButton={false}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description", { name: target?.name ?? "" })}</DialogDescription>
        </DialogHeader>
        <Textarea
          readOnly
          value={message}
          rows={8}
          aria-label={t("messageLabel")}
          className="resize-none rounded-lg bg-muted/50 text-sm"
          onFocus={(event) => event.currentTarget.select()}
        />
        <DialogFooter className="flex-row items-center gap-2">
          <Button type="button" size="sm" onClick={copy}>
            <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} className="size-4" />
            {t("copy")}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={onClose}>
            {t("done")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Tells HR what happened to the employee's IAM account after a save or a resend: a toast, or the
 * copy dialog when a new link could not go out on WhatsApp. Render `<InvitationDialog target={target} onClose={close} />`.
 */
export function useAccountFeedback() {
  const t = useTranslations("setup.employees.account");
  // Links to copy, one dialog after another (inviting several employees can leave a few).
  const [queue, setQueue] = useState<TInvitationTarget[]>([]);
  const target = queue[0] ?? null;
  const setTarget = useCallback((next: TInvitationTarget) => setQueue((current) => [...current, next]), []);
  const enqueue = useCallback((targets: TInvitationTarget[]) => setQueue((current) => [...current, ...targets]), []);

  /**
   * `saved`: the save toast's text. After a save it stays the toast title and the account outcome
   * becomes its description; without it (a resend) the account outcome is the toast itself.
   */
  const notify = useCallback(
    (account: TEmployeeAccount | null | undefined, name: string, saved?: string) => {
      const show = (kind: "success" | "info" | "warning", text?: string) => {
        if (saved) toast[kind](saved, { description: text });
        else if (text) toast[kind](text);
      };

      if (account?.status === "invited" && account.invitation) {
        if (account.invitation.sent_on_whatsapp) {
          show("success", t("sentOnWhatsapp", { name }));
        } else {
          show("success");
          setTarget({ name, invitation: account.invitation });
        }
        return;
      }

      switch (account?.status) {
        case "no_email":
          show("info", t("noEmail"));
          return;
        case "failed":
          show("warning", t("failed"));
          return;
        case "linked":
          // A save that only touched an active account needs no note; a resend does.
          show(saved ? "success" : "info", saved ? undefined : t("alreadyActive", { name }));
          return;
        default:
          // invited_earlier / skipped / no change: the save toast alone, or for a resend that made no link, say so.
          show(saved ? "success" : "info", saved ? undefined : t("noNewLink"));
      }
    },
    [t, setTarget],
  );

  const close = useCallback(() => setQueue((current) => current.slice(1)), []);

  return { target, notify, enqueue, close };
}
