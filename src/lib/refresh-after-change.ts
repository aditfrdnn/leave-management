import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { authService } from "@/services";
import { useAuthStore } from "@/stores";

let identityRequest: Promise<void> | null = null;

/**
 * Re-reads `/api/me` so the header, sidebar and permission checks follow a change to the
 * signed-in account (a new role, a renamed employee). Concurrent calls share one request, and an
 * answer that lands after logout is dropped.
 */
function refreshIdentity() {
  if (identityRequest || !useAuthStore.getState().isAuthenticated) return;

  identityRequest = authService
    .me()
    .then((response) => {
      if (response?.data && useAuthStore.getState().isAuthenticated) useAuthStore.getState().setAuth(response.data);
    })
    .catch(() => undefined)
    .finally(() => {
      identityRequest = null;
    });
}

/**
 * Every write may touch data other screens show (a role change moves the approver list, an
 * approval moves balances and the dashboard), so after any successful write every cached query
 * is marked stale: queries on screen refetch now, the rest when their screen opens. See RULES
 * "Data freshness".
 */
export function refreshAfterChange(queryClient: QueryClient) {
  void queryClient.invalidateQueries();
  refreshIdentity();
}

/** The same refresh for writes that do not go through `useMutation` (useActionState, direct calls). */
export function useRefreshAfterChange() {
  const queryClient = useQueryClient();

  return useCallback(() => refreshAfterChange(queryClient), [queryClient]);
}
