"use client";

import { useEffect, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useForm, useWatch, type FieldPath } from "react-hook-form";
import { toast } from "sonner";

import LoadingButton from "@/components/common/loading-button";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTranslateMessage } from "@/hooks/use-translate-message";
import { isActionState } from "@/lib/action-state";
import { cn } from "@/lib/utils/utils";
import type { TLeaveBalanceItem } from "@/types/setup";
import { leaveBalanceSchema, type LeaveBalanceSchemaType } from "@/validations/setup-validations";
import { SetLeaveBalance } from "../action";
import { formatDays } from "./format";

/**
 * Sets one employee's real remaining annual leave. HR usually goes through the list in one
 * sitting, so "Save & next" opens the next employee on the page whose balance is not set yet.
 */
export default function SetBalanceDialog({
  item,
  nextItem,
  onOpenChange,
  onSaved,
  onNext,
}: {
  item: TLeaveBalanceItem | null;
  nextItem: TLeaveBalanceItem | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  onNext: (item: TLeaveBalanceItem) => void;
}) {
  const t = useTranslations("setup.leaveBalances");
  const tCommon = useTranslations("common.actions");
  const locale = useLocale();
  const translateMessage = useTranslateMessage();
  const balanceInput = useRef<HTMLInputElement | null>(null);

  const form = useForm<LeaveBalanceSchemaType>({
    resolver: zodResolver(leaveBalanceSchema),
    defaultValues: { employee_id: "", balance: 0, note: "" },
  });

  // A fresh form per employee; the note is kept so a batch can reuse one reason.
  useEffect(() => {
    if (!item) return;
    form.reset({ employee_id: item.employee.id, balance: item.balance, note: form.getValues("note") });
    requestAnimationFrame(() => balanceInput.current?.select());
  }, [item, form]);

  const next = useWatch({ control: form.control, name: "balance" });
  const delta = item && Number.isFinite(next) ? next - item.balance : 0;

  const { mutate, isPending, variables } = useMutation({
    mutationFn: async ({ values }: { values: LeaveBalanceSchemaType; andNext: boolean }) => {
      const state = await SetLeaveBalance({ status: "idle" }, values);

      if (state.status === "error") throw state;

      return state;
    },
    onSuccess: (state, { andNext }) => {
      toast.success(translateMessage(state.message) || t("toast.saved"));
      onSaved();
      if (andNext && nextItem) onNext(nextItem);
      else onOpenChange(false);
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
        form.setError(field as FieldPath<LeaveBalanceSchemaType>, { type: "server", message: messages[0] });
      });
    },
  });

  const submit = (andNext: boolean) => {
    void form.handleSubmit((values) => mutate({ values, andNext }))();
  };
  const savingNext = isPending && variables?.andNext === true;

  return (
    <Dialog open={item !== null} onOpenChange={isPending ? () => {} : onOpenChange}>
      <DialogContent className="max-w-full sm:max-w-110">
        <DialogHeader>
          <DialogTitle>{t("dialog.title")}</DialogTitle>
          <DialogDescription>
            {item?.employee.name} · {item?.employee.employee_number}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submit(false);
            }}
            className="flex flex-col gap-4"
          >
            <fieldset disabled={isPending} className="flex flex-col gap-4">
              <div className="flex items-baseline justify-between rounded-lg bg-muted/60 px-3 py-2 text-sm">
                <span className="text-muted-foreground">{t("dialog.current")}</span>
                <span className="font-semibold tabular-nums">
                  {item ? `${formatDays(item.balance, locale)} ${t("daysUnit")}` : "-"}
                </span>
              </div>

              <FormField
                control={form.control}
                name="balance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("dialog.newBalance")}
                      <span className="-ml-1 text-destructive">*</span>
                    </FormLabel>
                    <div className="flex items-center gap-3">
                      <FormControl>
                        <Input
                          ref={(element) => {
                            field.ref(element);
                            balanceInput.current = element;
                          }}
                          type="number"
                          inputMode="decimal"
                          step={0.5}
                          min={-365}
                          max={365}
                          className="w-32 text-right text-base tabular-nums"
                          value={Number.isNaN(field.value) ? "" : field.value}
                          onChange={(event) => field.onChange(event.target.value === "" ? Number.NaN : event.target.valueAsNumber)}
                          onBlur={field.onBlur}
                          name={field.name}
                        />
                      </FormControl>
                      <span className="text-sm text-muted-foreground">{t("daysUnit")}</span>
                      {delta !== 0 && Number.isFinite(delta) && (
                        <span className={cn("ml-auto text-sm tabular-nums", delta > 0 ? "text-green-strong" : "text-destructive")}>
                          {t("dialog.delta", { value: formatDays(delta, locale, true) })}
                        </span>
                      )}
                    </div>
                    <FormMessage className="text-xs italic" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("dialog.note")}
                      <span className="-ml-1 text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea rows={2} placeholder={t("dialog.notePlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage className="text-xs italic" />
                  </FormItem>
                )}
              />

              <p className="text-xs text-muted-foreground">{t("dialog.hint")}</p>
            </fieldset>

            <DialogFooter className="flex-row flex-wrap items-center gap-2">
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending && !savingNext ? <LoadingButton /> : tCommon("save")}
              </Button>
              {nextItem && (
                <Button type="button" size="sm" variant="secondary" disabled={isPending} onClick={() => submit(true)}>
                  {savingNext ? <LoadingButton /> : t("dialog.saveNext", { name: nextItem.employee.name })}
                </Button>
              )}
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
