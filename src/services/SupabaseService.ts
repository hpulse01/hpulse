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

/**
 * Fetch a single clause by its number
 * Includes fallback search if exact match not found
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

  // Fallback: search nearby numbers
  const { data: nearbyMatches, error: nearbyError } = await supabase
    .from('tieban_clauses')
    .select('*')
    .gte('clause_number', clauseNumber - searchRadius)
    .lte('clause_number', clauseNumber + searchRadius)
    .order('clause_number')
    .limit(1);

  if (nearbyError) {
    console.error('Error fetching nearby clause:', nearbyError);
    return null;
  }

  if (nearbyMatches && nearbyMatches.length > 0) {
    // Find the closest match
    const closest = nearbyMatches.reduce((prev, curr) => {
      const prevDist = Math.abs(prev.clause_number - clauseNumber);
      const currDist = Math.abs(curr.clause_number - clauseNumber);
      return currDist < prevDist ? curr : prev;
    });
    return closest as Clause;
  }

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

  return data;
}
