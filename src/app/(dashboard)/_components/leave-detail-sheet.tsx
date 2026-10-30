"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";

import { Reveal, SectionLoader } from "@/components/common/loader";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { dateFormatter, dateTimeFormatter } from "@/lib/utils/utils";
import type { TLeaveApproval, TLeaveDetail } from "@/types/leave";
import { CheckmarkCircle02Icon, Cancel01Icon, Clock01Icon } from "@hugeicons/core-free-icons";
import { GetLeaveRequest } from "../action";
import LeaveStatusBadge from "./leave-status-badge";

export const LEAVE_DETAIL_QUERY_KEY = (id: number) => ["leave", "detail", id] as const;

function approvalIcon(action: number) {
  if (action === 1) return { icon: CheckmarkCircle02Icon, className: "text-green-strong" };
  if (action === 2) return { icon: Cancel01Icon, className: "text-destructive" };
  return { icon: Clock01Icon, className: "text-yellow-strong" };
}

/**
 * Everything about one request: the form fields, the days, and the approval trail.
 * `footer` lets the caller add actions (cancel for the requester, approve/reject for the approver).
 */
export default function LeaveDetailSheet({
  leaveId,
  onOpenChange,
  footer,
}: {
  leaveId: number | null;
  onOpenChange: (open: boolean) => void;
  footer?: (detail: TLeaveDetail) => React.ReactNode;
}) {
  const t = useTranslations("leave.detail");
  const tApproval = useTranslations("leave.approvals");
  const locale = useLocale();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: LEAVE_DETAIL_QUERY_KEY(leaveId ?? 0),
    queryFn: () => GetLeaveRequest(leaveId as number),
    enabled: leaveId !== null,
  });

  const rows: { label: string; value: React.ReactNode }[] = data
    ? [
        { label: t("fields.requester"), value: `${data.user?.name ?? "-"}${data.user?.department ? ` · ${data.user.department.alias}` : ""}` },
        { label: t("fields.leaveType"), value: data.leave_type?.name ?? "-" },
        { label: t("fields.dates"), value: `${dateFormatter(data.start_date, locale)} – ${dateFormatter(data.end_date, locale)}` },
        { label: t("fields.duration"), value: t("days", { count: Number(data.duration) }) },
        { label: t("fields.returnToOffice"), value: dateFormatter(data.return_to_office, locale) },
        { label: t("fields.reason"), value: data.reason },
        { label: t("fields.location"), value: data.location_during_leave },
        { label: t("fields.ongoingTask"), value: <span className="whitespace-pre-line">{data.ongoing_task}</span> },
        { label: t("fields.replacement"), value: data.temporary_replacement },
        { label: t("fields.phone"), value: data.phone_number },
        { label: t("fields.submittedAt"), value: dateTimeFormatter(data.submitted_at ?? data.created_at, locale) },
      ]
    : [];

  return (
    <Sheet open={leaveId !== null} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-4 overflow-y-auto sm:max-w-130">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {data?.subject ?? t("fallbackTitle")}
            {data && <LeaveStatusBadge status={Number(data.status)} />}
          </SheetTitle>
          <SheetDescription>{t("description")}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-4 pb-6">
          {isLoading && <SectionLoader className="min-h-60" />}
          {isError && <p className="text-sm text-destructive">{(error as Error).message}</p>}

          {data && (
            <Reveal className="flex flex-col gap-6">
              <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-[minmax(0,10rem)_1fr]">
                {rows.map((row) => (
                  <div key={row.label} className="contents">
                    <dt className="text-muted-foreground">{row.label}</dt>
                    <dd className="font-medium">{row.value || "-"}</dd>
                  </div>
                ))}
              </dl>

              {data.leave_request_days?.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-semibold">{t("daysTitle")}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {data.leave_request_days.map((day) => (
                      <Badge key={day.id} variant="secondary" className="font-normal">
                        {dateFormatter(day.date, locale)}
                        {Number(day.portion) < 1 && <span className="text-muted-foreground"> · ½</span>}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold">{t("approvalsTitle")}</p>
                {data.approvals?.length ? (
                  <ol className="flex flex-col gap-3">
                    {data.approvals.map((approval: TLeaveApproval) => {
                      const { icon, className } = approvalIcon(Number(approval.approval_action));

                      return (
                        <li key={approval.id} className="flex items-start gap-3 rounded-lg border p-3">
                          <HugeiconsIcon icon={icon} className={`mt-0.5 size-4 shrink-0 ${className}`} />
                          <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-sm">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-medium">
                                {t("level", { level: approval.approval_level })} · {approval.approval_by?.name ?? "-"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {approval.approved_at ? dateTimeFormatter(approval.approved_at, locale) : tApproval("status.pending")}
                              </span>
                            </div>
                            {approval.notes && <p className="text-muted-foreground">{approval.notes}</p>}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                ) : (
                  <p className="text-sm text-muted-foreground">{t("noApprovals")}</p>
                )}
              </div>

              {footer?.(data)}
            </Reveal>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
