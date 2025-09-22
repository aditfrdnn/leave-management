"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Leaf, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginSchemaType } from "@/validations/auth-validations";
import {
  INITIAL_LOGIN_FORM,
  INITIAL_LOGIN_STATE,
} from "@/constants/auth-constant";
import { startTransition, useActionState, useEffect } from "react";
import { Login } from "./actions";
import { toast } from "sonner";
import { Form } from "@/components/ui/form";
import FormInput from "@/components/common/form-input";

export default function LoginPage() {
  const router = useRouter();
  const form = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
    defaultValues: INITIAL_LOGIN_FORM,
  });

  const [loginState, loginAction, isPendingLogin] = useActionState(
    Login,
    INITIAL_LOGIN_STATE
  );

  const onSubmit = form.handleSubmit(async (data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });

    startTransition(() => {
      loginAction(formData);
    });
  });

  useEffect(() => {
    if (loginState?.status === "error") {
      toast.error("Login Failed!", {
        description: loginState.errors?._form?.[0],
      });
    }

    if (loginState.status === "success" && loginState.redirect) {
      toast.success("Login Success!");
      router.push(loginState.redirect);
    }
  }, [loginState]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-3 mb-2">
            <Leaf className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight text-primary font-headline">
              Leave
            </h1>
          </div>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <FormInput
                  name="email"
                  label="Email"
                  disabled={isPendingLogin}
                  placeholder="mail@example.com"
                  type="email"
                  form={form}
                />
                <FormInput
                  name="password"
                  label="Password"
                  disabled={isPendingLogin}
                  placeholder="********"
                  type="password"
                  form={form}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isPendingLogin}
              >
                {isPendingLogin ? (
                  "Loading..."
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" /> Login
                  </>
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
