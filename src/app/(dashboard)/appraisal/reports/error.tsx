"use client";

import { useTranslations } from "next-intl";

import ErrorState from "@/components/common/error-state";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("appraisal.page.reports");

  return <ErrorState title={t("title")} error={error} reset={reset} />;
}
