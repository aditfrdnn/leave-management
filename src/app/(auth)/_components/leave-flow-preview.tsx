import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils/utils";

/** Delay (and optional end) of one step of the sequence, read by `styles/auth-flow.css`. */
const at = (ms: number, outMs?: number) =>
  ({ "--d": `${ms}ms`, ...(outMs ? { "--d-out": `${outMs}ms` } : {}) }) as CSSProperties;

const CODE = "K7Q2M9XA";
/** Mon–Fri of one week; the request covers the first two days. */
const WEEK = [9, 10, 11, 12, 13];
const WEEKDAY_KEYS = ["week.0", "week.1", "week.2", "week.3", "week.4"] as const;
const LEAVE_DAYS = [9, 10];

/**
 * What HR Lite does, shown instead of told: a request is filed, its dates land on the calendar,
 * the lead approves from WhatsApp with the code, and the balance updates. Decorative; the
 * sequence is summarised once for screen readers through `aria-label`.
 */
export default function LeaveFlowPreview() {
  const t = useTranslations("auth.layout.preview");

  return (
    <div role="img" aria-label={t("summary")} className="relative mx-auto w-full max-w-md select-none">
      <div aria-hidden className="flex flex-col gap-3">
        {/* 1. The request slip */}
        <div className="flow-in w-[86%] rounded-xl bg-white p-4 text-slate-900 shadow-[0_18px_40px_-18px_rgba(15,23,42,0.55)]" style={at(150)}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col">
              <span className="text-2xs tracking-wide text-slate-500">{t("request.number")}</span>
              <span className="truncate text-sm font-semibold">{t("request.type")}</span>
            </div>
            <span className="relative grid shrink-0 justify-items-end">
              <span className="flow-out col-start-1 row-start-1 rounded-full bg-amber-100 px-2 py-0.5 text-2xs font-medium text-amber-800" style={at(3700)}>
                {t("status.pending")}
              </span>
              <span className="flow-pop col-start-1 row-start-1 flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-2xs font-medium text-emerald-800" style={at(3700)}>
                <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M2.5 6.2 5 8.5l4.5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t("status.approved")}
              </span>
            </span>
          </div>

          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
            <dt className="text-slate-500">{t("request.datesLabel")}</dt>
            <dd className="font-medium tabular-nums">{t("request.dates")}</dd>
            <dt className="text-slate-500">{t("request.approverLabel")}</dt>
            <dd className="font-medium">{t("request.approver")}</dd>
          </dl>

          {/* 2. The dates land on the week */}
          <div className="mt-3 grid grid-cols-5 gap-1.5 border-t border-slate-100 pt-3">
            {WEEK.map((day, index) => {
              const isLeave = LEAVE_DAYS.includes(day);

              return (
                <div key={day} className="relative flex flex-col items-center gap-0.5 rounded-md py-1.5">
                  {isLeave && (
                    <span
                      className="flow-pop absolute inset-0 rounded-md bg-primary"
                      style={at(900 + index * 140)}
                    />
                  )}
                  <span className={cn("relative text-2xs", isLeave ? "text-white/80" : "text-slate-400")}>
                    {t(WEEKDAY_KEYS[index])}
                  </span>
                  <span className={cn("relative text-sm font-semibold tabular-nums", isLeave ? "text-white" : "text-slate-700")}>
                    {day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. The lead approves from WhatsApp */}
        <div
          className="flow-in ml-auto w-[80%] overflow-hidden rounded-xl bg-[#efeae2] shadow-[0_18px_40px_-18px_rgba(15,23,42,0.55)]"
          style={at(1350)}
        >
          <div className="flex items-center gap-2 bg-[#075e54] px-3 py-2 text-white">
            <span className="flex size-6 items-center justify-center rounded-full bg-white/15 text-2xs font-semibold">HR</span>
            <div className="flex flex-col leading-tight">
              <span className="text-xs font-semibold">HR Lite</span>
              <span className="text-2xs text-white/70">{t("chat.subtitle")}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 p-3 text-xs text-slate-900">
            <div className="flow-in max-w-[88%] rounded-lg rounded-tl-none bg-white px-2.5 py-1.5" style={at(1700)}>
              <p>{t("chat.request")}</p>
              <p className="mt-1">
                {t("chat.replyWith")} <span className="font-semibold tabular-nums">{CODE} YES</span>
              </p>
            </div>

            <div className="relative h-7">
              {/* typing… */}
              <div
                className="flow-window absolute right-0 flex items-center gap-1 rounded-lg rounded-tr-none bg-[#d9fdd3] px-3 py-2"
                style={at(2400, 3150)}
              >
                {[0, 1, 2].map((dot) => (
                  <span key={dot} className="flow-dot size-1.5 rounded-full bg-slate-500" style={at(2400 + dot * 150)} />
                ))}
              </div>
              {/* …then the reply */}
              <div
                className="flow-pop absolute right-0 flex items-center gap-1.5 rounded-lg rounded-tr-none bg-[#d9fdd3] px-2.5 py-1.5"
                style={at(3150)}
              >
                <span className="font-semibold tabular-nums">{CODE} YES</span>
                <svg viewBox="0 0 16 11" className="flow-tick h-2.5 w-3.5 text-[#53bdeb]" style={at(3550)} fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M1 5.8 4.2 9 10.5 1.5M6.5 9l.7.7L15 1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* 4. The balance follows */}
        <div className="flow-in w-[70%] rounded-xl bg-white/10 p-3 ring-1 ring-white/20 [@media(max-height:760px)]:hidden" style={at(3900)}>
          <div className="flex items-baseline justify-between gap-2 text-white">
            <span className="text-xs text-white/75">{t("balance.label")}</span>
            <span className="text-sm font-semibold tabular-nums">{t("balance.value")}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/20">
            <div className="flow-fill h-full w-[83%] rounded-full bg-white" style={at(4100)} />
          </div>
        </div>
      </div>
    </div>
  );
}
