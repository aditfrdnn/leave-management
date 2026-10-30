"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { startTransition, useActionState, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import FormInput from "@/components/common/form-input";
import LoadingButton from "@/components/common/loading-button";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { INITIAL_SIGN_IN_FORM, INITIAL_SIGN_IN_STATE } from "@/constants/auth-constant";
import { useTranslateMessage } from "@/hooks/use-translate-message";
import { useAuthStore } from "@/stores";
import { signInSchema, SignInSchemaType } from "@/validations/auth-validations";
import { ViewIcon, ViewOffSlashIcon } from "@hugeicons/core-free-icons";
import { SignIn } from "../../actions";

export default function SignInForm({ callbackUrl }: { callbackUrl?: string }) {
  const t = useTranslations("auth.signIn");
  const translateMessage = useTranslateMessage();
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const setInitialized = useAuthStore((state) => state.setInitialized);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<SignInSchemaType>({
    resolver: zodResolver(signInSchema),
    defaultValues: INITIAL_SIGN_IN_FORM,
  });

  const queryClient = useQueryClient();
  const [signInState, signInAction, isPendingSignIn] = useActionState(SignIn, INITIAL_SIGN_IN_STATE);

  const onSubmit = form.handleSubmit((data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => formData.append(key, value));
    if (callbackUrl) formData.append("callbackUrl", callbackUrl);

    startTransition(() => signInAction(formData));
  });

  useEffect(() => {
    if (signInState?.status === "error") {
      toast.error(t("failed"), { description: translateMessage(signInState.errors?._form?.[0]) });
    }

    if (signInState.status === "success" && signInState.redirect) {
      // Drop anything cached by a previous session in this tab before the new user's pages load.
      queryClient.clear();
      if (signInState.user) setAuth(signInState.user);
      setInitialized(true);
      router.push(signInState.redirect);
      router.refresh();
    }
  }, [signInState, router, setAuth, setInitialized, t, translateMessage, queryClient]);

  return (
    <Form {...form}>
      <form className="flex w-full flex-col gap-4" onSubmit={onSubmit}>
        <div className="flex flex-col items-start gap-0">
          <h1 className="type-heading">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="grid gap-6">
          <FormInput name="email" label={t("email")} disabled={isPendingSignIn} placeholder="mail@example.com" type="email" form={form} />
          <div className="relative">
            <FormInput
              name="password"
              label={t("password")}
              disabled={isPendingSignIn}
              placeholder="********"
              type={showPassword ? "text" : "password"}
              form={form}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={showPassword ? t("hidePassword") : t("showPassword")}
              className="absolute top-7 right-1.5 text-muted-foreground"
              onClick={() => setShowPassword((value) => !value)}
            >
              <HugeiconsIcon icon={showPassword ? ViewOffSlashIcon : ViewIcon} />
            </Button>
          </div>
          <Button type="submit" className="mt-2 w-full" disabled={isPendingSignIn}>
            {isPendingSignIn ? <LoadingButton /> : t("submit")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
