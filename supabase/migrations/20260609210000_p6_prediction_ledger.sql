-- P6 — Prediction Verification Ledger
-- prediction_runs: archives every unified prediction run (engine outputs with
--   cappedConfidence / implementationStatus / sourceGrade / warnings / trace).
-- prediction_actuals: user-reported real-world outcomes — the absolute source
--   of truth used to score engines over time.

CREATE TABLE public.prediction_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  prediction_id TEXT NOT NULL,
  algorithm_version TEXT NOT NULL,
  query_type TEXT NOT NULL,
  birth_input JSONB NOT NULL,
  final_confidence NUMERIC NOT NULL,
  fused_fate_vector JSONB NOT NULL,
  engine_records JSONB NOT NULL,
  audit_blockers JSONB NOT NULL DEFAULT '[]'::jsonb,
  generated_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, prediction_id)
);

CREATE TABLE public.prediction_actuals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.prediction_runs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  event_date DATE NOT NULL,
  domain TEXT NOT NULL,
  magnitude INTEGER NOT NULL CHECK (magnitude BETWEEN 1 AND 10),
  polarity INTEGER NOT NULL CHECK (polarity IN (-1, 0, 1)),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_prediction_runs_user ON public.prediction_runs (user_id, generated_at DESC);
CREATE INDEX idx_prediction_actuals_run ON public.prediction_actuals (run_id);
CREATE INDEX idx_prediction_actuals_user ON public.prediction_actuals (user_id, event_date);

ALTER TABLE public.prediction_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_actuals ENABLE ROW LEVEL SECURITY;

-- prediction_runs: owner-only access
CREATE POLICY "Users can view own prediction runs"
ON public.prediction_runs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prediction runs"
ON public.prediction_runs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own prediction runs"
ON public.prediction_runs FOR DELETE
USING (auth.uid() = user_id);

-- prediction_actuals: owner-only access
CREATE POLICY "Users can view own prediction actuals"
ON public.prediction_actuals FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prediction actuals"
ON public.prediction_actuals FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own prediction actuals"
ON public.prediction_actuals FOR DELETE
USING (auth.uid() = user_id);
