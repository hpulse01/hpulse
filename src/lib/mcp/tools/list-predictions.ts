import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_predictions",
  title: "List saved predictions",
  description: "List the signed-in user's archived prediction runs, newest first.",
  inputSchema: {
    limit: z.number().int().min(1).max(50).default(10).describe("Maximum runs to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    const { data, error } = await supabaseForUser(ctx)
      .from("prediction_runs")
      .select("prediction_id, algorithm_version, query_type, final_confidence, generated_at")
      .order("generated_at", { ascending: false })
      .limit(limit);
    if (error) throw new ToolError(error.message);
    const runs = (data ?? []).map((r) => ({
      predictionId: String(r.prediction_id),
      algorithmVersion: String(r.algorithm_version),
      queryType: String(r.query_type),
      finalConfidence: Number(r.final_confidence),
      generatedAt: String(r.generated_at),
    }));
    return { content: [{ type: "text", text: JSON.stringify(runs) }], structuredContent: { runs } };
  },
});
