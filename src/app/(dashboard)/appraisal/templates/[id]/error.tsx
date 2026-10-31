"use client";

import { useTranslations } from "next-intl";

import ErrorState from "@/components/common/error-state";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("setup.appraisalTemplates");

  return <ErrorState title={t("editor.title")} error={error} reset={reset} />;
}
