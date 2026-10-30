"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useForm, useWatch, type FieldPath } from "react-hook-form";
import { toast } from "sonner";

import FormInput from "@/components/common/form-input";
import { SectionLoader } from "@/components/common/loader";
import LoadingButton from "@/components/common/loading-button";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslateMessage } from "@/hooks/use-translate-message";
import { isActionState } from "@/lib/action-state";
import type { TRoleItem } from "@/types/setup";
import { roleSchema, type RoleSchemaType } from "@/validations/setup-validations";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { CreateRole, GetPermissionGroups, UpdateRole } from "../action";

export const ROLE_PERMISSION_GROUPS_QUERY_KEY = ["setup", "permission-groups"] as const;

function buildFormData(values: RoleSchemaType) {
  const formData = new FormData();
  formData.append("id", values.id);
  formData.append("title", values.title);
  formData.append("description", values.description);
  values.permission_ids.forEach((id) => formData.append("permission_ids", String(id)));

  return formData;
}

/**
 * One dialog for create and update. Permissions are checkbox groups from
 * `GET /api/permissions/groups`, each with its own "select all". A system role keeps its title.
 */
export default function RoleFormDialog({
  open,
  onOpenChange,
  item,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: TRoleItem | null;
  onSuccess?: () => void;
}) {
  const t = useTranslations("setup");
  const tCommon = useTranslations("common.actions");
  const translateMessage = useTranslateMessage();
  const isUpdate = !!item;
  const isSystem = !!item?.is_system;
  const [permissionSearch, setPermissionSearch] = useState("");

  const form = useForm<RoleSchemaType>({
    resolver: zodResolver(roleSchema),
    defaultValues: { id: "", title: "", description: "", permission_ids: [] },
    values: {
      id: item ? String(item.id) : "",
      title: item?.title ?? "",
      description: item?.description ?? "",
      permission_ids: item?.permission_ids ?? [],
    },
  });

  const selected = useWatch({ control: form.control, name: "permission_ids" }) ?? [];

  const { data: groups, isLoading: isGroupsLoading, isError: isGroupsError, error: groupsError } = useQuery({
    queryKey: ROLE_PERMISSION_GROUPS_QUERY_KEY,
    queryFn: () => GetPermissionGroups(),
    enabled: open,
  });

  const groupLabel = (groupName: string) => {
    const key = `shared.permissionGroups.${groupName}`;

    return t.has(key as never) ? t(key as never) : groupName;
  };

  const visibleGroups = useMemo(() => {
    const keyword = permissionSearch.trim().toLowerCase();

    return (groups ?? [])
      .map((group) => ({
        ...group,
        permissions: group.permissions.filter(
          (permission) =>
            !keyword || permission.title.toLowerCase().includes(keyword) || (permission.label ?? "").toLowerCase().includes(keyword),
        ),
      }))
      .filter((group) => group.permissions.length > 0);
  }, [groups, permissionSearch]);

  const setPermissions = (next: number[]) => form.setValue("permission_ids", next, { shouldDirty: true, shouldValidate: true });

  const togglePermission = (id: number, checked: boolean) =>
    setPermissions(checked ? Array.from(new Set([...selected, id])) : selected.filter((value) => value !== id));

  const toggleGroup = (ids: number[], checked: boolean) =>
    setPermissions(checked ? Array.from(new Set([...selected, ...ids])) : selected.filter((value) => !ids.includes(value)));

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: RoleSchemaType) => {
      const action = isUpdate ? UpdateRole : CreateRole;
      const state = await action({ status: "idle" }, buildFormData(values));

      if (state.status === "error") throw state;

      return state;
    },
    onSuccess: (state) => {
      toast.success(translateMessage(state.message) || t(isUpdate ? "roles.toast.updated" : "roles.toast.created"));
      onOpenChange(false);
      setPermissionSearch("");
      onSuccess?.();
    },
    onError: (error: unknown) => {
      if (!isActionState(error)) {
        toast.error(t("roles.toast.saveFailed"), { description: error instanceof Error ? error.message : undefined });
        return;
      }

      toast.error(translateMessage(error.message) || t("roles.toast.saveFailed"), {
        description: translateMessage(error.errors?._form?.[0]) || undefined,
      });

      Object.entries(error.errors ?? {}).forEach(([field, messages]) => {
        if (field === "_form" || messages.length === 0) return;

        // Laravel reports array items as `permission_ids.0`; they belong to the checklist.
        const name = field.startsWith("permission_ids") ? "permission_ids" : field;
        form.setError(name as FieldPath<RoleSchemaType>, { type: "server", message: messages[0] });
      });
    },
  });

  const onSubmit = form.handleSubmit((values) => mutate(values));

  return (
    <Dialog open={open} onOpenChange={isPending ? () => {} : onOpenChange}>
      <DialogContent className="max-w-full sm:max-w-175">
        <DialogHeader>
          <DialogTitle>{isUpdate ? t("roles.form.updateTitle") : t("roles.form.createTitle")}</DialogTitle>
          <DialogDescription>{t("roles.form.description")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="flex min-w-0 flex-col gap-4">
            <fieldset disabled={isPending} className="flex min-w-0 flex-col gap-4">
              <div className="flex flex-col gap-1">
                <FormInput
                  form={form}
                  name="title"
                  label={t("roles.fields.title")}
                  placeholder={t("roles.form.titlePlaceholder")}
                  readOnly={isSystem}
                  isRequired
                />
                {isSystem && <p className="text-xs text-muted-foreground">{t("roles.form.systemTitleHint")}</p>}
              </div>
              <FormInput
                form={form}
                name="description"
                label={t("roles.fields.description")}
                placeholder={t("roles.form.descriptionPlaceholder")}
              />

              <FormField
                control={form.control}
                name="permission_ids"
                render={() => (
                  <FormItem className="gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <FormLabel>
                        {t("roles.columns.permissions")}
                        <span className="-ml-1 text-destructive">*</span>
                      </FormLabel>
                      <span className="text-xs text-muted-foreground">{t("roles.form.selected", { count: selected.length })}</span>
                    </div>

                    <div className="relative">
                      <HugeiconsIcon icon={Search01Icon} className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        placeholder={t("roles.form.searchPermission")}
                        value={permissionSearch}
                        onChange={(event) => setPermissionSearch(event.target.value)}
                      />
                    </div>

                    <ScrollArea className="h-72 rounded-lg border p-3">
                      {isGroupsLoading ? (
                        <SectionLoader className="min-h-64" />
                      ) : isGroupsError ? (
                        <p className="py-8 text-center text-sm text-destructive">{(groupsError as Error).message}</p>
                      ) : visibleGroups.length === 0 ? (
                        <p className="py-8 text-center text-sm text-muted-foreground">
                          {permissionSearch ? t("roles.form.noPermissionMatch") : t("roles.form.noPermissionAvailable")}
                        </p>
                      ) : (
                        <div className="flex flex-col gap-4">
                          {visibleGroups.map((group) => {
                            const ids = group.permissions.map((permission) => permission.id);
                            const checkedCount = ids.filter((id) => selected.includes(id)).length;
                            const groupState = checkedCount === 0 ? false : checkedCount === ids.length ? true : "indeterminate";
                            const groupId = `role-group-${group.group_name}`;

                            return (
                              <div key={group.group_name} className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                  <Checkbox id={groupId} checked={groupState} onCheckedChange={(checked) => toggleGroup(ids, checked === true)} />
                                  <Label htmlFor={groupId} className="text-sm font-semibold">
                                    {groupLabel(group.group_name)}
                                  </Label>
                                  <span className="text-xs text-muted-foreground">
                                    {t("roles.form.selectAllGroup", { selected: checkedCount, total: ids.length })}
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 gap-2 pl-6 sm:grid-cols-2">
                                  {group.permissions.map((permission) => {
                                    const permissionId = `role-permission-${permission.id}`;

                                    return (
                                      <div key={permission.id} className="flex items-start gap-2">
                                        <Checkbox
                                          id={permissionId}
                                          checked={selected.includes(permission.id)}
                                          onCheckedChange={(checked) => togglePermission(permission.id, checked === true)}
                                        />
                                        <Label htmlFor={permissionId} className="flex min-w-0 flex-col items-start gap-0.5 font-normal">
                                          <span className="text-sm">{permission.label || permission.title}</span>
                                          <span className="font-mono text-2xs break-all text-muted-foreground">{permission.title}</span>
                                        </Label>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </ScrollArea>
                    <FormMessage className="-mt-1 text-xs italic" />
                  </FormItem>
                )}
              />
            </fieldset>

            <DialogFooter className="flex-row items-center gap-2">
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending ? <LoadingButton /> : tCommon("save")}
              </Button>
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
