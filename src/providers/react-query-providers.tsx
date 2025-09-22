"use client";

import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

export default function ReactQueryProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity, // data tak pernah stale → tidak refetch
            gcTime: 24 * 60 * 60 * 1000, // (v5) simpan cache 24 jam
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            refetchOnMount: false, // jangan refetch saat komponen mount
          },
        },
      })
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
