-- Create the tieban_clauses table for storing prediction clauses
CREATE TABLE public.tieban_clauses (
    id SERIAL PRIMARY KEY,
    clause_number INTEGER NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT unique_clause_number UNIQUE (clause_number)
);

-- Create index for fast clause lookups
CREATE INDEX idx_tieban_clauses_number ON public.tieban_clauses(clause_number);
CREATE INDEX idx_tieban_clauses_category ON public.tieban_clauses(category);

-- Enable Row Level Security (public read access for clauses)
ALTER TABLE public.tieban_clauses ENABLE ROW LEVEL SECURITY;

-- Allow public read access to clauses (they are reference data, not user data)
CREATE POLICY "Anyone can read clauses"
ON public.tieban_clauses
FOR SELECT
USING (true);

-- Add comment for documentation
COMMENT ON TABLE public.tieban_clauses IS 'Iron Plate Divine Number (铁板神数) prediction clauses - ancient metaphysical texts';