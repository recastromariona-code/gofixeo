import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type UserRole = "client" | "provider" | "admin" | null;

/** Returns the current user's role. `null` when not signed in or still loading. */
export function useUserRole(): { role: UserRole; isClient: boolean; isProvider: boolean; isGuest: boolean; loading: boolean } {
  const { user, loading } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["user-role", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("role").eq("id", user!.id).maybeSingle();
      return (data?.role as UserRole) ?? "client";
    },
  });
  const role = user ? ((data as UserRole) ?? null) : null;
  return {
    role,
    isClient: role === "client",
    isProvider: role === "provider",
    isGuest: !user,
    loading: loading || (!!user && isLoading),
  };
}
