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
            // Dengan staleTime Infinity, data hanya stale setelah invalidateQueries.
            // `true` = refetch saat mount HANYA jika sudah di-invalidate; `false`
            // membuat query yang di-invalidate saat layarnya tidak terbuka tetap
            // memakai cache lama sampai halaman di-refresh.
            refetchOnMount: true,
          },
        },
      })
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
