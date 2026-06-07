/**
 * ziwei-rag-explain — retrieve Ziwei corpus evidence and optionally synthesize
 * a Chinese-language interpretation via Lovable AI Gateway.
 *
 * POST body:
 *   {
 *     patterns?: string[];   // e.g. ["紫府同宫", "杀破狼"]
 *     stars?: string[];      // e.g. ["紫微", "天府"]
 *     query?: string;        // free-text fallback for trgm search
 *     synthesize?: boolean;  // if true, also call LLM
 *     question?: string;     // user-question for the LLM
 *     model?: string;        // default 'google/gemini-2.5-flash'
 *     topK?: number;         // default 8
 *   }
 *
 * Returns: { evidence: Row[], interpretation?: string }
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

interface Body {
  patterns?: string[];
  stars?: string[];
  query?: string;
  synthesize?: boolean;
  question?: string;
  model?: string;
  topK?: number;
}

interface Row {
  id: number;
  category: string;
  subcategory: string | null;
  title: string | null;
  content: string;
  source: string | null;
  tags: string[] | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid json" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const topK = Math.min(Math.max(body.topK ?? 8, 1), 30);
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  // Build search terms list
  const terms = [
    ...(body.patterns ?? []),
    ...(body.stars ?? []),
    ...(body.query ? [body.query] : []),
  ].map(t => t.trim()).filter(Boolean);

  let rows: Row[] = [];
  if (terms.length === 0) {
    // Just sample a few entries
    const { data } = await supabase
      .from("ziwei_corpus")
      .select("id,category,subcategory,title,content,source,tags")
      .limit(topK);
    rows = (data ?? []) as Row[];
  } else {
    // Run ILIKE OR across title + content + tags. Use chained .or filters.
    const orClauses = terms.flatMap(t => {
      const safe = t.replace(/[%_,()]/g, "");
      return [
        `title.ilike.%${safe}%`,
        `content.ilike.%${safe}%`,
      ];
    }).join(",");
    const { data, error } = await supabase
      .from("ziwei_corpus")
      .select("id,category,subcategory,title,content,source,tags")
      .or(orClauses)
      .limit(topK * 2);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    rows = (data ?? []) as Row[];
    // Rank: prefer rows whose title matches a pattern term
    const patternSet = new Set((body.patterns ?? []).map(s => s.trim()));
    rows.sort((a, b) => {
      const aHit = a.title && patternSet.has(a.title) ? 0 : 1;
      const bHit = b.title && patternSet.has(b.title) ? 0 : 1;
      return aHit - bHit;
    });
    rows = rows.slice(0, topK);
  }

  let interpretation: string | undefined;
  if (body.synthesize && LOVABLE_API_KEY) {
    const evidenceBlock = rows.map((r, i) =>
      `【${i + 1}】(${r.category}${r.subcategory ? "/" + r.subcategory : ""}) ${r.title ?? ""}\n${r.content}${r.source ? `\n— 出处：${r.source}` : ""}`
    ).join("\n\n");

    const sys = [
      "你是一位严谨的紫微斗数解读师，遵循倪海厦体系与古籍传统。",
      "只能基于下列『古籍/格局』证据进行回答；若证据不足请明确指出。",
      "回答需引用证据编号（如【1】【3】），不得编造未在证据中出现的格局名或星曜组合。",
    ].join("\n");

    const userMsg =
      `# 问题\n${body.question ?? "请综合下列证据，对该命主做出综合判断。"}\n\n` +
      `# 涉及格局\n${(body.patterns ?? []).join("、") || "（未指定）"}\n\n` +
      `# 涉及星曜\n${(body.stars ?? []).join("、") || "（未指定）"}\n\n` +
      `# 证据\n${evidenceBlock || "（语料库未命中相关条目）"}`;

    try {
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: body.model ?? "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: sys },
            { role: "user", content: userMsg },
          ],
        }),
      });
      if (resp.ok) {
        const j = await resp.json();
        interpretation = j?.choices?.[0]?.message?.content ?? "";
      } else {
        interpretation = `(AI 调用失败: ${resp.status})`;
      }
    } catch (e) {
      interpretation = `(AI 异常: ${(e as Error).message})`;
    }
  }

  return new Response(JSON.stringify({
    evidence: rows,
    interpretation,
    meta: { terms, count: rows.length },
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
