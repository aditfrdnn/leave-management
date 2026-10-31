"use client";

import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

import { refreshAfterChange } from "@/lib/refresh-after-change";

export default function ReactQueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => {
    const queryClient: QueryClient = new QueryClient({
      // Any successful write refreshes every query and the signed-in identity, so related screens
      // never need a browser reload. A mutation can opt out with `meta: { refresh: false }`.
      mutationCache: new MutationCache({
        onSuccess: (_data, _variables, _context, mutation) => {
          if (mutation.meta?.refresh === false) return;
          refreshAfterChange(queryClient);
        },
      }),
      defaultOptions: {
        queries: {
          // Fresh for 30 s, so moving between pages does not refetch on every click; after
          // that a page open, a return to the tab or a reconnect fetches again, which also picks
          // up changes made by other users.
          staleTime: 30 * 1000,
          gcTime: 5 * 60 * 1000,
          refetchOnMount: true,
          refetchOnWindowFocus: true,
          refetchOnReconnect: true,
        },
      },
    });

    return queryClient;
  });

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
