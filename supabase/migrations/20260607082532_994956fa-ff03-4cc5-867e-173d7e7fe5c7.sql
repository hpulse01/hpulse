CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS public.ziwei_corpus (
  id BIGSERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  subcategory TEXT,
  title TEXT,
  content TEXT NOT NULL,
  source TEXT,
  tags TEXT[] DEFAULT '{}'::text[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ziwei_corpus TO anon;
GRANT SELECT ON public.ziwei_corpus TO authenticated;
GRANT ALL ON public.ziwei_corpus TO service_role;

ALTER TABLE public.ziwei_corpus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read ziwei corpus"
  ON public.ziwei_corpus FOR SELECT
  USING (true);

CREATE INDEX IF NOT EXISTS idx_ziwei_corpus_category ON public.ziwei_corpus(category);
CREATE INDEX IF NOT EXISTS idx_ziwei_corpus_tags ON public.ziwei_corpus USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_ziwei_corpus_content_trgm ON public.ziwei_corpus USING GIN (content gin_trgm_ops);