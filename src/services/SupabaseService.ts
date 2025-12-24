/**
 * Supabase Service for Iron Plate Destiny Engine
 * Handles all database operations for clauses
 */

import { supabase } from '@/integrations/supabase/client';

export interface Clause {
  id: number;
  clause_number: number;
  content: string;
  category: string | null;
  created_at: string;
}

// Cache for valid clause numbers (populated on first load)
let validClauseNumbersCache: Set<number> | null = null;

/**
 * Get all valid clause numbers from database (for fallback logic)
 */
export async function getValidClauseNumbers(): Promise<Set<number>> {
  if (validClauseNumbersCache) {
    return validClauseNumbersCache;
  }

  const { data, error } = await supabase
    .from('tieban_clauses')
    .select('clause_number');

  if (error) {
    console.error('Error fetching clause numbers:', error);
    return new Set();
  }

  validClauseNumbersCache = new Set(data?.map(d => d.clause_number) || []);
  return validClauseNumbersCache;
}

/**
 * Clear the cache (call after data import)
 */
export function clearClauseCache(): void {
  validClauseNumbersCache = null;
}

/**
 * Fetch a single clause by its number
 * Includes fallback search if exact match not found (tries ±1, ±2, up to ±10)
 */
export async function fetchClauseByNumber(
  clauseNumber: number,
  searchRadius: number = 10
): Promise<Clause | null> {
  // Try exact match first
  const { data: exactMatch, error: exactError } = await supabase
    .from('tieban_clauses')
    .select('*')
    .eq('clause_number', clauseNumber)
    .maybeSingle();

  if (exactError) {
    console.error('Error fetching clause:', exactError);
    return null;
  }

  if (exactMatch) {
    return exactMatch as Clause;
  }

  // Fallback: search nearby numbers (±1, ±2, etc.)
  console.log(`Clause ${clauseNumber} not found, searching nearby...`);
  
  for (let offset = 1; offset <= searchRadius; offset++) {
    // Try +offset
    const { data: plusMatch } = await supabase
      .from('tieban_clauses')
      .select('*')
      .eq('clause_number', clauseNumber + offset)
      .maybeSingle();

    if (plusMatch) {
      console.log(`Found fallback clause: ${clauseNumber + offset}`);
      return plusMatch as Clause;
    }

    // Try -offset
    const { data: minusMatch } = await supabase
      .from('tieban_clauses')
      .select('*')
      .eq('clause_number', clauseNumber - offset)
      .maybeSingle();

    if (minusMatch) {
      console.log(`Found fallback clause: ${clauseNumber - offset}`);
      return minusMatch as Clause;
    }
  }

  console.warn(`No clause found near ${clauseNumber}`);
  return null;
}

/**
 * Fetch multiple clauses by their numbers
 */
export async function fetchClausesByNumbers(
  clauseNumbers: number[]
): Promise<Clause[]> {
  const { data, error } = await supabase
    .from('tieban_clauses')
    .select('*')
    .in('clause_number', clauseNumbers);

  if (error) {
    console.error('Error fetching clauses:', error);
    return [];
  }

  return (data || []) as Clause[];
}

/**
 * Fetch all clauses (with pagination for large datasets)
 */
export async function fetchAllClauses(
  page: number = 0,
  pageSize: number = 1000
): Promise<{ clauses: Clause[]; total: number }> {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from('tieban_clauses')
    .select('*', { count: 'exact' })
    .range(from, to)
    .order('clause_number');

  if (error) {
    console.error('Error fetching all clauses:', error);
    return { clauses: [], total: 0 };
  }

  return {
    clauses: (data || []) as Clause[],
    total: count || 0,
  };
}

/**
 * Search clauses by content
 */
export async function searchClauses(
  searchTerm: string,
  limit: number = 20
): Promise<Clause[]> {
  const { data, error } = await supabase
    .from('tieban_clauses')
    .select('*')
    .ilike('content', `%${searchTerm}%`)
    .limit(limit);

  if (error) {
    console.error('Error searching clauses:', error);
    return [];
  }

  return (data || []) as Clause[];
}

/**
 * Get clauses by category
 */
export async function fetchClausesByCategory(
  category: string
): Promise<Clause[]> {
  const { data, error } = await supabase
    .from('tieban_clauses')
    .select('*')
    .eq('category', category)
    .order('clause_number');

  if (error) {
    console.error('Error fetching clauses by category:', error);
    return [];
  }

  return (data || []) as Clause[];
}

/**
 * Get clause count
 */
export async function getClauseCount(): Promise<number> {
  const { count, error } = await supabase
    .from('tieban_clauses')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error getting clause count:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Import clauses via edge function
 */
export async function importClausesFromJson(
  clauses: Array<{ id: string; text: string }>
): Promise<{ success: boolean; imported: number; errors?: string[] }> {
  const { data, error } = await supabase.functions.invoke('import-clauses', {
    body: { clauses },
  });

  if (error) {
    console.error('Import error:', error);
    return { success: false, imported: 0, errors: [error.message] };
  }

  // Clear cache after import so new data is fetched
  clearClauseCache();

  return data;
}
