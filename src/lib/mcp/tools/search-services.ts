import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseAnon, textResult, errorResult } from "../supabase";

export default defineTool({
  name: "search_services",
  title: "Buscar servicios ofertados",
  description:
    "Busca servicios publicados por prestadores en FIXEO. Filtra por texto, categoría (slug), ciudad/zona y rango de presupuesto (starting_price).",
  inputSchema: {
    query: z.string().optional(),
    category: z.string().optional().describe("Slug de categoría."),
    city: z.string().optional().describe("Ciudad o zona del prestador."),
    min_price: z.number().nonnegative().optional(),
    max_price: z.number().nonnegative().optional(),
    limit: z.number().int().min(1).max(50).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, category, city, min_price, max_price, limit }) => {
    const sb = supabaseAnon();
    const max = limit ?? 10;

    let categoryId: string | undefined;
    if (category) {
      const { data: cat } = await sb.from("categories").select("id").eq("slug", category).maybeSingle();
      if (!cat) return errorResult(`Categoría '${category}' no encontrada.`);
      categoryId = cat.id;
    }

    let q = sb
      .from("services")
      .select(
        `id, title, description, starting_price, provider_id,
         categories!inner(name, slug),
         providers!inner(id, rating, reviews_count, service_areas, profiles!inner(full_name, city))`,
      )
      .eq("is_active", true)
      .order("starting_price", { ascending: true, nullsFirst: false })
      .limit(50);

    if (categoryId) q = q.eq("category_id", categoryId);
    if (min_price != null) q = q.or(`starting_price.gte.${min_price},starting_price.is.null`);
    if (max_price != null) q = q.or(`starting_price.lte.${max_price},starting_price.is.null`);

    const { data, error } = await q;
    if (error) return errorResult(error.message);

    let rows = data ?? [];
    if (query) {
      const needle = query.toLowerCase();
      rows = rows.filter(
        (s) =>
          s.title.toLowerCase().includes(needle) ||
          (s.description ?? "").toLowerCase().includes(needle),
      );
    }
    if (city) {
      const needle = city.toLowerCase();
      rows = rows.filter((s) => {
        const pc = (s.providers?.profiles?.city ?? "").toLowerCase();
        const areas: string[] = (s.providers?.service_areas ?? []) as string[];
        return pc.includes(needle) || areas.some((a) => (a ?? "").toLowerCase().includes(needle));
      });
    }

    const shaped = rows.slice(0, max).map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      starting_price: s.starting_price,
      category: s.categories?.slug ?? null,
      provider: {
        id: s.provider_id,
        name: s.providers?.profiles?.full_name ?? null,
        city: s.providers?.profiles?.city ?? null,
        rating: Number(s.providers?.rating ?? 0),
        reviews_count: s.providers?.reviews_count ?? 0,
      },
    }));

    return textResult({ services: shaped }, { count: shaped.length });
  },
});
