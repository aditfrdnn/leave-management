import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import SignInForm from "./_components/sign-in-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");

  return { title: t("metaTitle") };
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const callbackUrl = (params.callbackUrl as string) || (params.callback as string);

  return (
    <div className="flex w-full flex-col items-start justify-center gap-2">
      <SignInForm callbackUrl={callbackUrl} />
    </div>
  );
}
