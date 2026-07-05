import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseAnon, textResult, errorResult } from "../supabase";

export default defineTool({
  name: "list_categories",
  title: "Listar categorías",
  description: "Devuelve las categorías de servicios de FIXEO con su slug (útil como parámetro de otros tools).",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async () => {
    const sb = supabaseAnon();
    const { data, error } = await sb
      .from("categories")
      .select("id, slug, name, description")
      .order("sort_order");
    if (error) return errorResult(error.message);
    return textResult({ categories: data ?? [] }, { count: (data ?? []).length });
  },
});
