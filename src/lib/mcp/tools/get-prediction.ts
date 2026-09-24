import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_prediction",
  title: "Get prediction details",
  description: "Get one archived prediction run (fate vector, engine records, audit blockers) by its prediction ID.",
  inputSchema: { predictionId: z.string().min(1).describe("Prediction ID from list_predictions.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ predictionId }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    const { data, error } = await supabaseForUser(ctx)
      .from("prediction_runs")
      .select("prediction_id, algorithm_version, query_type, final_confidence, generated_at, birth_input, fused_fate_vector, engine_records, audit_blockers")
      .eq("prediction_id", predictionId)
      .maybeSingle();
    if (error) throw new ToolError(error.message);
    if (!data) throw new ToolError("Prediction not found");
    return { content: [{ type: "text", text: JSON.stringify(data) }] };
  },
});
