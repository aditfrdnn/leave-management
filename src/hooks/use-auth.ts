import { useAuthStore } from "@/stores";

/** Read-only facade over the auth store; the login/logout flows call the store's actions directly. */
export const useAuth = () => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  return {
    loading: !user && !isInitialized,
    user,
    isAuthenticated,
    isInitialized,
  };
};
