import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import ReactQueryProvider from "@/providers/react-query-providers";
// import { AuthProvider } from '@/context/auth-context';

export const metadata: Metadata = {
  title: "Leave",
  description: "Employee leave request application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <ReactQueryProvider>
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton={true}
            duration={3000}
          />
        </ReactQueryProvider>
      </body>
    </html>
  );
}
