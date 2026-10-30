"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, format, parse } from "date-fns";
import { useTranslations } from "next-intl";
import { useForm, useWatch, type FieldPath } from "react-hook-form";
import { toast } from "sonner";

import FormInput from "@/components/common/form-input";
import FormSelect from "@/components/common/form-select";
import LoadingButton from "@/components/common/loading-button";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { INITIAL_LEAVE_REQUEST_FORM, LEAVE_DATE_FORMAT } from "@/constants/leave-constant";
import { useDateLocale } from "@/hooks/use-date-locale";
import { useTranslateMessage } from "@/hooks/use-translate-message";
import { isActionState } from "@/lib/action-state";
import { cn } from "@/lib/utils/utils";
import { leaveRequestSchema, type LeaveRequestSchemaType } from "@/validations/leave-validations";
import { SentIcon } from "@hugeicons/core-free-icons";
import { CreateLeaveRequest, GetApprovers, GetHolidayCalendar, GetLeaveTypes, GetMyLeaveBalance } from "../action";
import { LEAVE_REQUESTS_QUERY_KEY } from "./leave-request-table";

const dayKey = (date: Date) => format(date, "yyyy-MM-dd");
const isWeekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6;

/** The first working day after the last leave date: weekends and holidays skipped. */
function getNextWorkday(date: Date, holidayKeys: Set<string>): Date {
  let next = addDays(date, 1);
  while (isWeekend(next) || holidayKeys.has(dayKey(next))) next = addDays(next, 1);
  return next;
}

/** The calendar looks a year ahead; holidays outside that window are not offered anyway. */
const HOLIDAY_WINDOW_DAYS = 400;

const toApi = (date: Date) => format(date, LEAVE_DATE_FORMAT);
const fromApi = (value: string) => parse(value, LEAVE_DATE_FORMAT, new Date());

function buildFormData(values: LeaveRequestSchemaType) {
  const formData = new FormData();

  Object.entries(values).forEach(([key, value]) => {
    if (Array.isArray(value)) value.forEach((item) => formData.append(key, item));
    else formData.append(key, value);
  });

  return formData;
}

/** Shared with the dashboard and history so a decision refreshes the number everywhere. */
export const MY_LEAVE_BALANCE_QUERY_KEY = ["leave", "my-balance"] as const;

/** The leave request form in a dialog, opened from "My Leave". A closed dialog keeps the draft. */
export default function LeaveRequestFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("leave");
  const translateMessage = useTranslateMessage();
  const dateLocale = useDateLocale();
  const queryClient = useQueryClient();
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [month, setMonth] = useState(() => new Date());

  const form = useForm<LeaveRequestSchemaType>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: INITIAL_LEAVE_REQUEST_FORM,
  });

  const leaveDates = useWatch({ control: form.control, name: "leave_date" }) ?? [];
  const returnToOffice = useWatch({ control: form.control, name: "return_to_office" });

  const { data: leaveTypes, isLoading: isLeaveTypesLoading } = useQuery({
    queryKey: ["leave", "leave-types"],
    queryFn: GetLeaveTypes,
  });

  const today = useMemo(() => {
    const value = new Date();
    value.setHours(0, 0, 0, 0);
    return value;
  }, []);

  const { data: holidays } = useQuery({
    queryKey: ["leave", "holiday-calendar", dayKey(today)],
    queryFn: () => GetHolidayCalendar(dayKey(today), dayKey(addDays(today, HOLIDAY_WINDOW_DAYS))),
    enabled: open,
    staleTime: 10 * 60 * 1000,
  });

  const holidayKeys = useMemo(() => new Set((holidays ?? []).map((day) => day.date)), [holidays]);
  const holidayDates = useMemo(() => (holidays ?? []).map((day) => parse(day.date, "yyyy-MM-dd", new Date())), [holidays]);
  const monthHolidays = useMemo(
    () => (holidays ?? []).filter((day) => day.date.startsWith(format(month, "yyyy-MM"))),
    [holidays, month],
  );

  const { data: myBalance } = useQuery({
    queryKey: MY_LEAVE_BALANCE_QUERY_KEY,
    queryFn: GetMyLeaveBalance,
  });

  const selectedLeaveType = useWatch({ control: form.control, name: "leave_type" });
  // The balance only applies to the annual leave type; the API names it, the dropdown lists names.
  const isAnnualSelected =
    !!myBalance && (leaveTypes ?? []).some((item) => String(item.id) === selectedLeaveType && item.text === myBalance.leave_type);
  const availableDays = myBalance ? myBalance.balance - myBalance.pending_days : 0;
  const exceedsBalance = isAnnualSelected && leaveDates.length > availableDays;

  const { data: approvers, isLoading: isApproversLoading } = useQuery({
    queryKey: ["leave", "approvers"],
    queryFn: GetApprovers,
  });

  const leaveTypeItems = useMemo(
    () => (leaveTypes ?? []).map((item) => ({ value: String(item.id), label: item.text })),
    [leaveTypes],
  );
  const approverItems = useMemo(
    () => (approvers ?? []).map((item) => ({ value: String(item.id), label: item.name })),
    [approvers],
  );

  const sortedLeaveDates = useMemo(
    () => [...leaveDates].sort((a, b) => fromApi(a).getTime() - fromApi(b).getTime()),
    [leaveDates],
  );

  const onDatesChange = (dates: Date[] | undefined) => {
    const next = [...(dates ?? [])].sort((a, b) => a.getTime() - b.getTime());

    setSelectedDates(next);
    form.setValue("leave_date", next.map(toApi), { shouldDirty: true, shouldValidate: form.formState.isSubmitted });
    form.setValue("return_to_office", next.length ? toApi(getNextWorkday(next[next.length - 1], holidayKeys)) : "", {
      shouldValidate: form.formState.isSubmitted,
    });
  };

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: LeaveRequestSchemaType) => {
      const state = await CreateLeaveRequest({ status: "idle" }, buildFormData(values));

      if (state.status === "error") throw state;

      return state;
    },
    onSuccess: (state) => {
      toast.success(translateMessage(state.message) || t("form.toast.created"));
      form.reset(INITIAL_LEAVE_REQUEST_FORM);
      setSelectedDates([]);
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: LEAVE_REQUESTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: MY_LEAVE_BALANCE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: unknown) => {
      if (!isActionState(error)) {
        toast.error(t("form.toast.failed"), { description: error instanceof Error ? error.message : undefined });
        return;
      }

      toast.error(translateMessage(error.message) || t("form.toast.failed"), {
        description: translateMessage(error.errors?._form?.[0]) || undefined,
      });

      Object.entries(error.errors ?? {}).forEach(([field, messages]) => {
        if (field === "_form" || messages.length === 0) return;

        form.setError(field as FieldPath<LeaveRequestSchemaType>, { type: "server", message: messages[0] });
      });
    },
  });

  const onSubmit = form.handleSubmit((values) => mutate(values));

  return (
    <Dialog open={open} onOpenChange={isPending ? () => {} : onOpenChange}>
      <DialogContent className="max-h-[92svh] max-w-full overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("form.title")}</DialogTitle>
          <DialogDescription>{t("form.description")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <fieldset disabled={isPending} className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormInput form={form} name="subject" label={t("form.fields.subject")} placeholder={t("form.fields.subjectPlaceholder")} isRequired />
                <FormSelect
                  form={form}
                  name="leave_type"
                  label={t("form.fields.leaveType")}
                  placeholder={isLeaveTypesLoading ? "…" : t("form.fields.leaveTypePlaceholder")}
                  items={leaveTypeItems}
                  disabled={isPending || isLeaveTypesLoading}
                  isRequired
                />
              </div>

              <FormField
                control={form.control}
                name="leave_date"
                render={() => (
                  <FormItem className="gap-1.5">
                    <FormLabel>
                      {t("form.fields.leaveDate")}
                      <span className="-ml-1 text-destructive">*</span>
                      <span className="ml-1 text-xs font-normal text-muted-foreground">{t("form.fields.leaveDateHint")}</span>
                    </FormLabel>
                    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start">
                      <Calendar
                        mode="multiple"
                        locale={dateLocale}
                        className={cn("w-fit rounded-lg border", form.formState.errors.leave_date && "border-destructive")}
                        selected={selectedDates}
                        onSelect={onDatesChange}
                        month={month}
                        onMonthChange={setMonth}
                        disabled={(date) => date < today || isWeekend(date) || holidayKeys.has(dayKey(date))}
                        modifiers={{ holiday: holidayDates }}
                        modifiersClassNames={{ holiday: "[&_button]:text-destructive [&_button]:line-through" }}
                      />
                      <dl className="flex min-w-40 flex-1 flex-col gap-3 text-sm">
                        <div>
                          <dt className="font-medium">{t("form.fields.selectedDates")}</dt>
                          <dd className="text-muted-foreground">
                            {sortedLeaveDates.length ? sortedLeaveDates.join(", ") : t("form.fields.noDates")}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-medium">{t("form.fields.returnToOffice")}</dt>
                          <dd className="text-muted-foreground">{returnToOffice || "-"}</dd>
                        </div>
                        <div>
                          <dt className="font-medium">{t("form.fields.daysTotal")}</dt>
                          <dd className="type-metric">{t("form.fields.days", { count: leaveDates.length })}</dd>
                        </div>
                        {monthHolidays.length > 0 && (
                          <div>
                            <dt className="font-medium">{t("form.holidays.title")}</dt>
                            <dd>
                              <ul className="flex flex-col gap-0.5 text-muted-foreground">
                                {monthHolidays.map((day) => (
                                  <li key={day.date}>
                                    <span className="text-destructive tabular-nums">{format(parse(day.date, "yyyy-MM-dd", new Date()), "d MMM", { locale: dateLocale })}</span>{" "}
                                    {day.name}
                                    {day.is_mass_leave && <span className="text-xs"> · {t("form.holidays.massLeave")}</span>}
                                  </li>
                                ))}
                              </ul>
                            </dd>
                          </div>
                        )}
                        {myBalance && (
                          <div>
                            <dt className="font-medium">{t("form.balance.label")}</dt>
                            <dd className="text-muted-foreground">
                              <span className={cn("font-semibold text-foreground tabular-nums", availableDays < 0 && "text-destructive")}>
                                {t("form.fields.days", { count: myBalance.balance })}
                              </span>
                              {myBalance.pending_days > 0 && (
                                <span className="block text-xs">{t("form.balance.pending", { count: myBalance.pending_days })}</span>
                              )}
                            </dd>
                          </div>
                        )}
                      </dl>
                      {exceedsBalance && (
                        <p role="status" className="rounded-md bg-yellow/12 px-2.5 py-1.5 text-xs text-yellow-strong">
                          {t("form.balance.exceeds", { count: Math.max(availableDays, 0) })}
                        </p>
                      )}
                    </div>
                    <FormMessage className="-mt-1 text-xs italic" />
                  </FormItem>
                )}
              />

              <FormSelect
                form={form}
                name="approval_user"
                label={t("form.fields.approver")}
                placeholder={isApproversLoading ? "…" : t("form.fields.approverPlaceholder")}
                items={approverItems}
                disabled={isPending || isApproversLoading}
                isRequired
              />
              <FormInput form={form} name="reason" label={t("form.fields.reason")} placeholder={t("form.fields.reasonPlaceholder")} type="textarea" isRequired />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormInput form={form} name="location_during_leave" label={t("form.fields.location")} placeholder={t("form.fields.locationPlaceholder")} isRequired />
                <FormInput form={form} name="ongoing_task" label={t("form.fields.ongoingTask")} placeholder={t("form.fields.ongoingTaskPlaceholder")} isRequired />
                <FormInput form={form} name="temporary_replacement" label={t("form.fields.replacement")} placeholder={t("form.fields.replacementPlaceholder")} isRequired />
                <FormInput form={form} name="phone_number" label={t("form.fields.phone")} placeholder={t("form.fields.phonePlaceholder")} type="tel" isRequired />
              </div>
            </fieldset>

            <DialogFooter className="flex-row items-center justify-end gap-2">
              <Button type="button" variant="outline" disabled={isPending} onClick={() => onOpenChange(false)}>
                {t("form.close")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? <LoadingButton /> : (
                  <>
                    <HugeiconsIcon icon={SentIcon} />
                    {t("form.submit")}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
