import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, textResult, errorResult } from "../supabase";

export default defineTool({
  name: "list_open_requests",
  title: "Solicitudes abiertas para prestadores",
  description:
    "Para prestadores autenticados: lista solicitudes abiertas (sin prestador asignado) que coinciden con sus categorías. Aplica RLS de FIXEO.",
  inputSchema: {
    category: z.string().optional().describe("Slug de categoría para filtrar."),
    city: z.string().optional().describe("Ciudad para filtrar."),
    limit: z.number().int().min(1).max(50).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ category, city, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("No autenticado.");
    const sb = supabaseForUser(ctx);

    let categoryId: string | undefined;
    if (category) {
      const { data: cat } = await sb.from("categories").select("id").eq("slug", category).maybeSingle();
      if (!cat) return errorResult(`Categoría '${category}' no encontrada.`);
      categoryId = cat.id;
    }

    let q = sb
      .from("quote_requests")
      .select(
        `id, title, description, city, urgency, budget_min, budget_max, status, preferred_date, created_at,
         categories(name, slug)`,
      )
      .is("provider_id", null)
      .in("status", ["pending", "quoted"])
      .order("created_at", { ascending: false })
      .limit(limit ?? 20);
    if (categoryId) q = q.eq("category_id", categoryId);
    if (city) q = q.ilike("city", `%${city}%`);

    const { data, error } = await q;
    if (error) return errorResult(error.message);
    return textResult({ requests: data ?? [] }, { count: (data ?? []).length });
  },
});
