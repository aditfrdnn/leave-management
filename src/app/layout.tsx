import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";

import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/provider/auth/auth-provider";
import ReactQueryProvider from "@/provider/react-query-provider";
import { ThemeProvider } from "@/provider/theme-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LVR System",
  description: "Employee leave request application",
  icons: { icon: "/lvr.png" },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.variable} ${geistMono.variable} min-h-svh w-full antialiased tracking-tight`}>
        <NextIntlClientProvider>
          <AuthProvider>
            <ReactQueryProvider>
              <ThemeProvider>
                <div className="mx-auto min-h-svh w-full">{children}</div>
                <Toaster position="top-right" richColors closeButton={true} duration={3000} />
              </ThemeProvider>
            </ReactQueryProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
