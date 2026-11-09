"use client";

import { createContext, useCallback, useContext, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { accountSchema, type Account } from "@/lib/contracts";
import { api, ApiError } from "@/lib/api";
import { z } from "zod";

const SessionContext = createContext<{
  account: Account | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<unknown>;
  logout: () => Promise<void>;
}>({
  account: null,
  loading: true,
  error: null,
  refresh: async () => {},
  logout: async () => {},
});
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const client = useQueryClient();
  const session = useQuery({
    queryKey: ["session"],
    queryFn: async ({ signal }) => {
      try {
        return await api("/session", accountSchema, { signal });
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
    retry: false,
  });
  const refresh = useCallback(async () => {
    await client.invalidateQueries();
  }, [client]);
  useEffect(() => {
    const channel = new BroadcastChannel("ms52-session");
    channel.onmessage = () => {
      client.clear();
      void refresh();
    };
    return () => channel.close();
  }, [client, refresh]);
  async function logout() {
    await api("/session", z.undefined(), { method: "DELETE" });
    client.clear();
    await client.invalidateQueries({ queryKey: ["session"] });
    const channel = new BroadcastChannel("ms52-session");
    channel.postMessage("changed");
    channel.close();
    window.location.assign(
      new URL("/store/login/", window.location.origin).href,
    );
  }
  return (
    <SessionContext.Provider
      value={{
        account: session.data ?? null,
        loading: session.isPending,
        error: session.error,
        refresh,
        logout,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}
export const useSession = () => useContext(SessionContext);
export const isAdmin = (account: Account | null) =>
  !!account?.roles
    .split(",")
    .map((role) => role.trim())
    .includes("ROLE_ADMIN");
