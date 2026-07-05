import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, textResult, errorResult } from "../supabase";

export default defineTool({
  name: "list_my_requests",
  title: "Mis solicitudes",
  description:
    "Lista las solicitudes de cotización del usuario autenticado (creadas por él como comprador). Puede filtrarse por estado.",
  inputSchema: {
    status: z
      .enum(["pending", "quoted", "accepted", "completed", "cancelled"])
      .optional()
      .describe("Filtra por estado."),
    limit: z.number().int().min(1).max(50).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("No autenticado.");
    const userId = ctx.getUserId();
    if (!userId) return errorResult("No pudimos identificar tu usuario.");
    const sb = supabaseForUser(ctx);
    let q = sb
      .from("quote_requests")
      .select(
        `id, title, description, city, urgency, budget_min, budget_max, status,
         preferred_date, created_at,
         categories(name, slug),
         quotes(count)`,
      )
      .eq("client_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit ?? 20);
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    if (error) return errorResult(error.message);
    return textResult({ requests: data ?? [] }, { count: (data ?? []).length });
  },
});
