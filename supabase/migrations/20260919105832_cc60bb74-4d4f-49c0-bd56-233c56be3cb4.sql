CREATE TABLE public.prediction_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prediction_id TEXT NOT NULL,
  algorithm_version TEXT NOT NULL,
  query_type TEXT NOT NULL,
  birth_input JSONB,
  final_confidence NUMERIC NOT NULL DEFAULT 0,
  fused_fate_vector JSONB,
  engine_records JSONB,
  audit_blockers JSONB,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, prediction_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prediction_runs TO authenticated;
GRANT ALL ON public.prediction_runs TO service_role;
ALTER TABLE public.prediction_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own prediction runs" ON public.prediction_runs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.prediction_actuals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES public.prediction_runs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_date DATE NOT NULL,
  domain TEXT NOT NULL,
  magnitude NUMERIC NOT NULL DEFAULT 0,
  polarity SMALLINT NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prediction_actuals TO authenticated;
GRANT ALL ON public.prediction_actuals TO service_role;
ALTER TABLE public.prediction_actuals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own prediction actuals" ON public.prediction_actuals FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);