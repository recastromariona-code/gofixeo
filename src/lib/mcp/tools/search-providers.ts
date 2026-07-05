import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseAnon, textResult, errorResult } from "../supabase";

export default defineTool({
  name: "search_providers",
  title: "Buscar prestadores",
  description:
    "Busca prestadores de servicios en FIXEO por texto libre, categoría (slug) y/o ciudad. Devuelve nombre, ciudad, calificación, número de reseñas y biografía.",
  inputSchema: {
    query: z.string().optional().describe("Texto libre (ej: 'aire acondicionado')."),
    category: z.string().optional().describe("Slug de categoría (ej: 'fontaneria')."),
    city: z.string().optional().describe("Ciudad o zona de cobertura."),
    limit: z.number().int().min(1).max(50).optional().describe("Máximo de resultados (por defecto 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, category, city, limit }) => {
    const sb = supabaseAnon();
    const max = limit ?? 10;

    let categoryId: string | undefined;
    if (category) {
      const { data: cat } = await sb.from("categories").select("id").eq("slug", category).maybeSingle();
      if (!cat) return errorResult(`Categoría '${category}' no encontrada.`);
      categoryId = cat.id;
    }

    let q = sb
      .from("providers")
      .select(
        `id, bio, rating, reviews_count, is_verified, service_areas,
         profiles!inner(full_name, city),
         provider_categories!left(categories(name, slug))`,
      )
      .order("rating", { ascending: false })
      .limit(50);

    if (categoryId) {
      const { data: pcs } = await sb.from("provider_categories").select("provider_id").eq("category_id", categoryId);
      const ids = (pcs ?? []).map((p) => p.provider_id);
      if (ids.length === 0) return textResult({ providers: [] }, { providers: [] });
      q = q.in("id", ids);
    }

    const { data, error } = await q;
    if (error) return errorResult(error.message);

    let rows = (data ?? []).map((p) => ({
      id: p.id,
      full_name: p.profiles?.full_name ?? null,
      city: p.profiles?.city ?? null,
      rating: Number(p.rating ?? 0),
      reviews_count: p.reviews_count ?? 0,
      is_verified: !!p.is_verified,
      bio: p.bio,
      service_areas: (p.service_areas ?? []) as string[],
      categories: (p.provider_categories ?? [])
        .map((pc: { categories: { name: string; slug: string } | null }) => pc.categories)
        .filter((c): c is { name: string; slug: string } => !!c),
    }));

    if (query) {
      const needle = query.toLowerCase();
      rows = rows.filter(
        (r) =>
          (r.full_name ?? "").toLowerCase().includes(needle) ||
          (r.bio ?? "").toLowerCase().includes(needle) ||
          r.categories.some((c) => c.name.toLowerCase().includes(needle)),
      );
    }
    if (city) {
      const needle = city.toLowerCase();
      rows = rows.filter(
        (r) =>
          (r.city ?? "").toLowerCase().includes(needle) ||
          r.service_areas.some((a) => (a ?? "").toLowerCase().includes(needle)),
      );
    }

    rows = rows.slice(0, max);
    return textResult({ providers: rows }, { count: rows.length });
  },
});
