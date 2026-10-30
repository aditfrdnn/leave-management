"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useFieldArray, useForm, type FieldPath } from "react-hook-form";
import { toast } from "sonner";

import FormInput from "@/components/common/form-input";
import FormSwitch from "@/components/common/form-switch";
import { Reveal, SectionLoader } from "@/components/common/loader";
import LoadingButton from "@/components/common/loading-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Form } from "@/components/ui/form";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslateMessage } from "@/hooks/use-translate-message";
import { isActionState } from "@/lib/action-state";
import type { ActionState } from "@/types/action-state";
import type { TAppraisalTemplate, TTemplateSectionKind } from "@/types/appraisal";
import {
  appraisalTemplateSchema,
  SCALE_LENGTH,
  SECTION_KINDS,
  type AppraisalTemplateSchemaType,
} from "@/validations/appraisal-template-validations";
import { Add01Icon, ArrowDown01Icon, ArrowLeft01Icon, Copy01Icon, FloppyDiskIcon, LockIcon } from "@hugeicons/core-free-icons";
import { DuplicateAppraisalTemplate, GetAppraisalTemplate, SaveAppraisalTemplate } from "../../action";
import { GroupError, PlaceholderHint } from "./editor-fields";
import SectionCard from "./section-card";
import TemplatePreview from "./template-preview";

const LIST_HREF = "/setup/appraisal-templates";
/** Same key as the list page's table, so a save or duplicate refreshes it. */
const APPRAISAL_TEMPLATES_QUERY_KEY = ["setup", "appraisal-templates"] as const;
export const APPRAISAL_TEMPLATE_QUERY_KEY = (id: number) => ["setup", "appraisal-template", id] as const;

type TSectionValues = AppraisalTemplateSchemaType["schema"]["sections"][number];
type TScale = { value: number; label: string }[];

function toScale(scale: { value?: number; label?: string }[] | undefined, fallback: string[] = []): TScale {
  return Array.from({ length: SCALE_LENGTH }, (_, index) => ({ value: index + 1, label: scale?.[index]?.label ?? fallback[index] ?? "" }));
}

/** API template → editor values; pads missing pieces so every input has a value to bind to. */
function toFormValues(template: TAppraisalTemplate): AppraisalTemplateSchemaType {
  const sections = (template.schema?.sections ?? []).map((section): TSectionValues => {
    const base = { key: section.key ?? "", title: section.title ?? "", instructions: section.instructions ?? "" };

    switch (section.kind) {
      case "rating":
        return {
          ...base,
          kind: "rating",
          scale: toScale(section.scale),
          items: (section.items ?? []).map((item) => ({
            key: item.key ?? "",
            code: item.code ?? "",
            title: item.title ?? "",
            points: item.points ?? [],
            levels: Array.from({ length: Math.max(SCALE_LENGTH, item.levels?.length ?? 0) }, (_, index) => item.levels?.[index] ?? ""),
            audience: item.audience === "leaders" ? "leaders" : "all",
          })),
        };
      case "kpi_review":
        return { ...base, kind: "kpi_review", scale: toScale(section.scale), min_rows: section.min_rows, max_rows: section.max_rows };
      case "kpi_target":
        return { ...base, kind: "kpi_target", min_rows: section.min_rows, max_rows: section.max_rows };
      default:
        return { ...base, kind: "text", fields: section.kind === "text" ? (section.fields ?? []) : [] };
    }
  });

  return {
    code: template.code ?? "",
    name: template.name ?? "",
    revision: template.revision ?? "",
    is_active: !!template.is_active,
    schema: { title: template.schema?.title ?? "", sections },
  };
}

/**
 * The API reports nested errors by dotted path. Bullet lines and scale values have no input of their own,
 * and array-level messages live in RHF's `root` slot, so those paths are moved to where the editor shows them.
 */
function toFormErrorPath(field: string) {
  const path = field.replace(/\.points\.\d+$/, ".points").replace(/\.scale\.(\d+)\.value$/, ".scale.$1.label");

  return /^schema\.sections(\.\d+\.(items|fields))?$/.test(path) ? `${path}.root` : path;
}

export default function TemplateEditor({ id }: { id: number }) {
  const t = useTranslations("setup.appraisalTemplates");
  const validId = Number.isInteger(id) && id > 0;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: APPRAISAL_TEMPLATE_QUERY_KEY(id),
    queryFn: () => GetAppraisalTemplate(id),
    enabled: validId,
  });

  if (!validId || isError) {
    return (
      <div className="flex flex-col items-start gap-3">
        <BackButton />
        <p className="text-sm text-destructive">{isError ? (error as Error).message : t("errors.load")}</p>
      </div>
    );
  }

  if (isLoading || !data) return <SectionLoader className="min-h-60" />;

  return (
    <Reveal>
      <TemplateForm key={data.id} template={data} />
    </Reveal>
  );
}

function BackButton({ onNavigate }: { onNavigate?: (event: React.MouseEvent) => void }) {
  const tCommon = useTranslations("common.actions");

  return (
    <Button asChild variant="outline" size="sm">
      <Link href={LIST_HREF} onClick={onNavigate}>
        <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
        {tCommon("back")}
      </Link>
    </Button>
  );
}

function TemplateForm({ template }: { template: TAppraisalTemplate }) {
  const t = useTranslations("setup.appraisalTemplates");
  const translateMessage = useTranslateMessage();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [tab, setTab] = useState("editor");
  const locked = template.periods_count > 0;

  const form = useForm<AppraisalTemplateSchemaType>({
    resolver: zodResolver(appraisalTemplateSchema),
    defaultValues: toFormValues(template),
  });

  const { fields: sections, append, move, remove } = useFieldArray({ control: form.control, name: "schema.sections" });
  const isDirty = form.formState.isDirty;

  // Unsaved-changes guard for reloads, tab closes and external links.
  useEffect(() => {
    if (!isDirty || locked) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);

    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty, locked]);

  const confirmLeave = (event: React.MouseEvent) => {
    if (isDirty && !locked && !window.confirm(t("editor.leaveConfirm"))) event.preventDefault();
  };

  const save = useMutation({
    mutationFn: async (values: AppraisalTemplateSchemaType) => {
      const formData = new FormData();
      formData.append("id", String(template.id));
      formData.append("payload", JSON.stringify(values));

      const state = await SaveAppraisalTemplate({ status: "idle" }, formData);
      if (state.status === "error") throw state;

      return state;
    },
    onSuccess: (state) => {
      toast.success(translateMessage(state.message) || t("toast.saved"));
      queryClient.invalidateQueries({ queryKey: APPRAISAL_TEMPLATES_QUERY_KEY });

      if (state.data) {
        form.reset(toFormValues(state.data));
        queryClient.setQueryData(APPRAISAL_TEMPLATE_QUERY_KEY(template.id), state.data);
      }
    },
    onError: (failure: unknown) => {
      if (!isActionState(failure)) {
        toast.error(t("toast.saveFailed"), { description: failure instanceof Error ? failure.message : undefined });
        return;
      }

      const fieldErrors = Object.entries(failure.errors ?? {}).filter(([field, messages]) => field !== "_form" && messages.length > 0);
      fieldErrors.forEach(([field, messages]) => {
        form.setError(toFormErrorPath(field) as FieldPath<AppraisalTemplateSchemaType>, { type: "server", message: messages[0] });
      });

      if (fieldErrors.length > 0) setTab("editor");

      toast.error(translateMessage(failure.message) || t("toast.saveFailed"), {
        description: translateMessage(failure.errors?._form?.[0] ?? fieldErrors[0]?.[1][0]) || undefined,
      });
    },
  });

  const duplicate = useMutation({
    mutationFn: async () => {
      const state: ActionState<TAppraisalTemplate> = await DuplicateAppraisalTemplate(template.id);
      if (state.status === "error" || !state.data) throw state;

      return state;
    },
    onSuccess: (state) => {
      toast.success(translateMessage(state.message) || t("toast.duplicated"));
      queryClient.invalidateQueries({ queryKey: APPRAISAL_TEMPLATES_QUERY_KEY });
      if (state.data) router.push(`${LIST_HREF}/${state.data.id}`);
    },
    onError: (failure: unknown) => {
      const state = isActionState(failure) ? failure : undefined;
      toast.error(translateMessage(state?.message) || t("toast.duplicateFailed"), {
        description: translateMessage(state?.errors?._form?.[0]) || undefined,
      });
    },
  });

  const addSection = (kind: TTemplateSectionKind) => {
    const current = form.getValues("schema.sections");
    const existingScale = current.find((section) => section.kind === "rating" || section.kind === "kpi_review");
    const defaultLabels = Array.from({ length: SCALE_LENGTH }, (_, index) => t(`defaults.scale.${index + 1}` as "defaults.scale.1"));
    const scale = toScale(existingScale && "scale" in existingScale ? existingScale.scale : undefined, defaultLabels);
    const base = { key: "", title: "", instructions: "" };

    const next: Record<TTemplateSectionKind, TSectionValues> = {
      rating: {
        ...base,
        kind: "rating",
        scale,
        items: [{ key: "", code: "", title: "", points: [], levels: Array.from({ length: SCALE_LENGTH }, () => ""), audience: "all" }],
      },
      kpi_review: { ...base, kind: "kpi_review", scale, min_rows: 1, max_rows: 10 },
      kpi_target: { ...base, kind: "kpi_target", min_rows: 1, max_rows: 10 },
      text: { ...base, kind: "text", fields: [{ key: "", label: "", filled_by: "assessor" }] },
    };

    append(next[kind]);
  };

  const onSubmit = form.handleSubmit(
    (values) => save.mutate(values),
    () => {
      setTab("editor");
      toast.error(t("toast.invalid"));
    },
  );

  const saveButton = (
    <Button type="submit" form="appraisal-template-form" size="sm" disabled={locked || save.isPending}>
      {save.isPending ? (
        <LoadingButton />
      ) : (
        <>
          <HugeiconsIcon icon={FloppyDiskIcon} className="size-4" />
          {t("editor.save")}
        </>
      )}
    </Button>
  );

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <BackButton onNavigate={confirmLeave} />
        <div className="flex flex-wrap items-center gap-2">
          {isDirty && !locked && (
            <span role="status" className="text-xs text-muted-foreground">
              {t("editor.unsaved")}
            </span>
          )}
          {!locked && saveButton}
        </div>
      </div>

      {locked && (
        <div className="flex flex-col gap-3 rounded-xl border border-yellow/40 bg-yellow/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <HugeiconsIcon icon={LockIcon} className="mt-0.5 size-5 shrink-0 text-yellow-strong" />
            <p className="text-sm">{t("editor.lockedBanner", { count: template.periods_count })}</p>
          </div>
          <Button type="button" size="sm" className="self-start sm:self-auto" disabled={duplicate.isPending} onClick={() => duplicate.mutate()}>
            {duplicate.isPending ? (
              <LoadingButton />
            ) : (
              <>
                <HugeiconsIcon icon={Copy01Icon} className="size-4" />
                {t("editor.createRevision")}
              </>
            )}
          </Button>
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab} className="min-w-0">
        <TabsList>
          <TabsTrigger value="editor">{t("editor.tabs.editor")}</TabsTrigger>
          <TabsTrigger value="preview">{t("editor.tabs.preview")}</TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form id="appraisal-template-form" onSubmit={onSubmit} noValidate className="min-w-0">
            <TabsContent value="editor" className="min-w-0">
              <fieldset disabled={locked || save.isPending} className="flex min-w-0 flex-col gap-4">
                <Card className="min-w-0 gap-4">
                  <CardHeader className="px-4 sm:px-6">
                    <CardTitle className="type-section-title">{t("editor.header.title")}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex min-w-0 flex-col gap-3 px-4 sm:px-6">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <FormInput form={form} name="code" label={t("fields.code")} isRequired />
                      <div className="lg:col-span-2">
                        <FormInput form={form} name="name" label={t("fields.name")} isRequired />
                      </div>
                      <FormInput form={form} name="revision" label={t("fields.revision")} isRequired />
                    </div>
                    <div className="flex flex-col gap-1">
                      <FormInput form={form} name="schema.title" label={t("fields.formTitle")} isRequired />
                      <PlaceholderHint />
                    </div>
                    <div className="flex flex-col gap-1 sm:max-w-md">
                      <FormSwitch form={form} name="is_active" label={t("fields.isActive")} />
                      <p className="text-xs text-muted-foreground">{t("editor.header.activeHint")}</p>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="type-heading">{t("editor.sections.title", { count: sections.length })}</h2>
                  <Badge variant="outline">{t("editor.sections.hint")}</Badge>
                </div>

                <ol className="flex min-w-0 flex-col gap-4">
                  {sections.map((section, index) => (
                    <li key={section.id} className="min-w-0">
                      <SectionCard
                        form={form}
                        index={index}
                        count={sections.length}
                        locked={locked}
                        onMove={move}
                        onRemove={() => remove(index)}
                      />
                    </li>
                  ))}
                </ol>
                <GroupError form={form} path="schema.sections" />

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="outline" size="sm">
                        <HugeiconsIcon icon={Add01Icon} className="size-4" />
                        {t("editor.sections.add")}
                        <HugeiconsIcon icon={ArrowDown01Icon} className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-72 max-w-[calc(100vw-2rem)]">
                      <DropdownMenuLabel>{t("editor.sections.pickKind")}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {SECTION_KINDS.map((kind) => (
                        <DropdownMenuItem key={kind} onSelect={() => addSection(kind)} className="flex-col items-start gap-0.5">
                          <span className="text-sm font-medium">{t(`editor.kinds.${kind}.label`)}</span>
                          <span className="text-xs text-muted-foreground">{t(`editor.kinds.${kind}.description`)}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {!locked && saveButton}
                </div>
              </fieldset>
            </TabsContent>
          </form>
        </Form>

        <TabsContent value="preview" className="min-w-0">
          <TemplatePreview form={form} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
