"use server";

import { login } from "@/constants/endpoint-constant";
import instance from "@/lib/axios";
import { AuthFormState } from "@/types/auth";
import { loginSchema } from "@/validations/auth-validations";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function Login(
  prevState: AuthFormState,
  formData: FormData | null
): Promise<AuthFormState> {
  const parsed = await loginSchema.safeParse({
    email: formData?.get("email") as string,
    password: formData?.get("password") as string,
  });

  if (parsed.error) {
    return {
      status: "error",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const { email, password } = parsed.data;

    const result = await instance.post(`${login}`, { email, password });
    const user = await result.data.data;

    if (result.status !== 200 || !user.token) {
      return {
        status: "error",
        errors: {
          ...prevState.errors,
          _form: [result.data.message],
        },
      };
    }

    const cookiesStore = await cookies();
    cookiesStore.set("auth-user", JSON.stringify(user), {
      httpOnly: true,
      secure: true,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 6,
    });

    revalidatePath("/", "page");
    return {
      status: "success",
      redirect: "/",
    };
  } catch (error) {
    return {
      status: "error",
      errors: {
        _form: ["Invalid email or password"],
      },
    };
  }
}
