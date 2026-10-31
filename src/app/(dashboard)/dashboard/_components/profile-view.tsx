"use client";

import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { differenceInMonths, parse } from "date-fns";
import { useLocale, useTranslations } from "next-intl";

import { Reveal, SectionLoader } from "@/components/common/loader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getInitials } from "@/lib/get-initials";
import { cn, dateFormatter } from "@/lib/utils/utils";
import type { TMyEmployee, TMyProfile } from "@/types/profile";
import { GetMyProfile } from "../action";
import SignatureCard from "./signature-card";

export const MY_PROFILE_QUERY_KEY = ["home", "profile"] as const;

/** "2 years 3 months" style, from the join date to today. */
function useTenure(joinDate: string | null) {
  const t = useTranslations("home.employment");
  if (!joinDate) return null;

  const months = Math.max(0, differenceInMonths(new Date(), parse(joinDate, "yyyy-MM-dd", new Date())));
  const years = Math.floor(months / 12);
  const rest = months % 12;

  if (years === 0) return t("tenureMonths", { months: rest });
  if (rest === 0) return t("tenureYears", { years });
  return t("tenure", { years, months: rest });
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{children || "-"}</dd>
    </div>
  );
}

export default function ProfileView() {
  const t = useTranslations("home");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: MY_PROFILE_QUERY_KEY,
    queryFn: GetMyProfile,
  });

  if (isLoading) return <SectionLoader className="min-h-80" />;
  if (isError || !data) return <p className="text-sm text-destructive">{(error as Error | null)?.message ?? t("errors.load")}</p>;

  return <Profile profile={data} />;
}

function Profile({ profile }: { profile: TMyProfile }) {
  const t = useTranslations("home");
  const locale = useLocale();
  const { user, employee } = profile;
  const tenure = useTenure(employee?.join_date ?? null);
  const name = employee?.name ?? user.name;

  return (
    <Reveal className="flex flex-col gap-4">
      {/* Identity: who this is, what they do and where */}
      <Card className="gap-0 py-0">
        <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-xl font-semibold text-primary-foreground">
            {getInitials(name)}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="text-sm text-muted-foreground">{t("page.greeting")}</p>
            <h1 className="type-page-title truncate">{name}</h1>
            <p className="text-sm text-muted-foreground">
              {[employee?.position, employee?.department?.name].filter(Boolean).join(" · ") || t("page.noPosition")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
            {employee && (
              <Badge variant="secondary" className="font-mono tabular-nums">
                {employee.employee_number}
              </Badge>
            )}
            {user.role && <Badge variant="outline">{user.role.title}</Badge>}
          </div>
        </CardContent>
      </Card>

      {!employee ? (
        <div className="grid min-w-0 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">{t("noEmployee")}</CardContent>
          </Card>
          <SignatureCard />
        </div>
      ) : (
        <div className="grid min-w-0 gap-4 lg:grid-cols-3">
          <Card className="min-w-0 lg:col-span-2">
            <CardHeader>
              <CardTitle>{t("employment.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                <Field label={t("employment.employeeNumber")}>
                  <span className="tabular-nums">{employee.employee_number}</span>
                </Field>
                <Field label={t("employment.position")}>
                  {employee.position}
                  {employee.grade != null && (
                    <span className="font-normal text-muted-foreground"> · {t("employment.grade", { grade: employee.grade })}</span>
                  )}
                </Field>
                <Field label={t("employment.department")}>
                  {employee.department ? `${employee.department.name} (${employee.department.alias})` : null}
                </Field>
                <Field label={t("employment.supervisor")}>
                  {employee.supervisor ? (
                    <>
                      {employee.supervisor.name}
                      {employee.supervisor.position && <span className="font-normal text-muted-foreground"> · {employee.supervisor.position}</span>}
                    </>
                  ) : null}
                </Field>
                <Field label={t("employment.type")}>{t(`employment.types.${employee.employment_type}`)}</Field>
                <Field label={t("employment.joinDate")}>
                  {employee.join_date ? (
                    <>
                      {dateFormatter(employee.join_date, locale)}
                      {tenure && <span className="font-normal text-muted-foreground"> · {tenure}</span>}
                    </>
                  ) : null}
                </Field>
              </dl>
            </CardContent>
          </Card>

          <div className="flex min-w-0 flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("contact.title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="flex flex-col gap-4">
                  <Field label={t("contact.email")}>{employee.email}</Field>
                  <Field label={t("contact.phone")}>
                    {employee.phone_number ? <span className="tabular-nums">+{employee.phone_number}</span> : null}
                  </Field>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("account.title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="flex flex-col gap-4">
                  <Field label={t("account.login")}>{user.email}</Field>
                  <Field label={t("account.status")}>
                    <span className={cn(user.status === "active" ? "text-green-strong" : "text-destructive")}>
                      {t(`account.statuses.${user.status}`)}
                    </span>
                  </Field>
                  <Field label={t("account.since")}>{dateFormatter(user.created_at, locale)}</Field>
                </dl>
              </CardContent>
            </Card>

            <SignatureCard />
          </div>

          {employee.careers?.length > 0 && <CareerTimeline careers={employee.careers} />}

          {employee.subordinates.length > 0 && (
            <Card className="min-w-0 lg:col-span-3">
              <CardHeader>
                <CardTitle>{t("team.title", { count: employee.subordinates.length })}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
                  {employee.subordinates.map((member) => (
                    <li key={member.id} className="flex items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                        {getInitials(member.name)}
                      </span>
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-medium">{member.name}</span>
                        <span className="truncate text-xs text-muted-foreground">{member.position ?? "-"}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </Reveal>
  );
}

/** Position, employment type, grade and department over time, newest first. */
function CareerTimeline({ careers }: { careers: TMyEmployee["careers"] }) {
  const t = useTranslations("home");
  const locale = useLocale();

  return (
    <Card className="min-w-0 lg:col-span-3">
      <CardHeader>
        <CardTitle>{t("careers.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="flex flex-col">
          {careers.map((career, index) => (
            <li key={career.id} className="relative flex gap-3 pb-5 last:pb-0">
              {index < careers.length - 1 && <span aria-hidden className="absolute top-3 bottom-0 left-1.25 w-px bg-border" />}
              <span
                aria-hidden
                className={cn(
                  "relative mt-1.5 size-2.75 shrink-0 rounded-full border-2",
                  career.is_current ? "border-primary bg-primary" : "border-border bg-background",
                )}
              />
              <div className="flex min-w-0 flex-col gap-0.5">
                <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
                  <span className="tabular-nums">{dateFormatter(career.effective_date, locale)}</span>
                  <span aria-hidden>·</span>
                  <span>{t(`employment.types.${career.employment_type}`)}</span>
                  {career.grade != null && (
                    <>
                      <span aria-hidden>·</span>
                      <span className="tabular-nums">{t("employment.grade", { grade: career.grade })}</span>
                    </>
                  )}
                  {career.is_current && (
                    <Badge variant="default" className="ml-1">
                      {t("careers.current")}
                    </Badge>
                  )}
                </p>
                <p className={cn("text-sm break-words", career.is_current && "font-medium")}>
                  {career.position}
                  {career.department && <span className="font-normal text-muted-foreground"> · {career.department.name}</span>}
                </p>
                {career.note && <p className="text-xs break-words text-muted-foreground">{career.note}</p>}
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
