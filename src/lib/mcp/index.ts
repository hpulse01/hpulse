import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listPredictions from "./tools/list-predictions";
import getPrediction from "./tools/get-prediction";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "iron-plate-oracle",
  title: "Iron Plate Oracle",
  version: "0.1.0",
  instructions:
    "Read-only access to the signed-in user's archived H-Pulse prediction runs. Use `list_predictions` to browse, then `get_prediction` for details.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listPredictions, getPrediction],
});
