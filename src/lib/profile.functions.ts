import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const updateRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ role: z.enum(["client", "provider"]) }).parse(data)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ role: data.role })
      .eq("id", userId);

    if (profileError) {
      throw new Error(profileError.message);
    }

    if (data.role === "provider") {
      const { error: providerError } = await supabase
        .from("providers")
        .upsert({ id: userId }, { onConflict: "id" });

      if (providerError) {
        throw new Error(providerError.message);
      }
    }

    return { success: true, role: data.role };
  });
