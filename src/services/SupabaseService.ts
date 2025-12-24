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
 * Find a single clause containing specific keywords (for Six Relations verification)
 * Returns the clause content, or a fallback message if not found.
 * 
 * @param keyword - The search keyword (e.g., "父属鼠")
 * @returns The clause content or a constructed fallback
 */
export async function findClauseByContent(keyword: string): Promise<{ content: string; clauseNumber: number | null }> {
  const { data, error } = await supabase
    .from('tieban_clauses')
    .select('content, clause_number')
    .ilike('content', `%${keyword}%`)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error finding clause by content:', error);
    return {
      content: `(数据库查询出错，推演结果应为：${keyword})`,
      clauseNumber: null,
    };
  }

  if (!data) {
    // Fallback if exact phrase not found
    return {
      content: `(数据库未收录此具体条文，推演结果应为：${keyword})`,
      clauseNumber: null,
    };
  }

  return {
    content: data.content,
    clauseNumber: data.clause_number,
  };
}

/**
 * REVERSE LOOKUP: Find a clause based on Family Zodiacs (Both Father AND Mother)
 * This ensures the text displayed MATCHES the user's input exactly.
 * 
 * @param fatherZodiac - Chinese zodiac character (e.g., "牛")
 * @param motherZodiac - Chinese zodiac character (e.g., "兔")
 * @returns The matching clause or null
 */
export async function findClauseByFamilyFacts(
  fatherZodiac: string,
  motherZodiac: string
): Promise<{ content: string; clauseNumber: number } | null> {
  // Construct search terms based on classical Chinese phrasing
  const fatherTerm = `父属${fatherZodiac}`;
  const motherTerm = `母属${motherZodiac}`;

  // Search for clauses containing BOTH father AND mother zodiacs
  const { data, error } = await supabase
    .from('tieban_clauses')
    .select('content, clause_number')
    .ilike('content', `%${fatherTerm}%`)
    .ilike('content', `%${motherTerm}%`)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error finding clause by family facts:', error);
    return null;
  }

  if (!data) {
    // Try searching for just father zodiac as fallback
    const { data: fatherOnlyData } = await supabase
      .from('tieban_clauses')
      .select('content, clause_number')
      .ilike('content', `%${fatherTerm}%`)
      .limit(1)
      .maybeSingle();

    if (fatherOnlyData) {
      return {
        content: fatherOnlyData.content,
        clauseNumber: fatherOnlyData.clause_number,
      };
    }

    return null;
  }

  return {
    content: data.content,
    clauseNumber: data.clause_number,
  };
}

/**
 * ADVANCED SEARCH: Finds the most detailed clauses matching the Family Facts.
 * Logic:
 * 1. Search for clauses containing Father's Zodiac AND Mother's Zodiac.
 * 2. Search for clauses containing Father's Zodiac ONLY (as fallback context).
 * 3. Sort results by TEXT LENGTH (assuming longer text = more detailed).
 * 4. Return the Top N distinct candidates.
 * 
 * @param fatherZodiac - Chinese zodiac character (e.g., "牛")
 * @param motherZodiac - Chinese zodiac character (e.g., "兔")
 * @param limit - Maximum number of results to return (default: 3)
 * @returns Array of matching clauses, sorted by richness (text length)
 */
export async function findDetailedFamilyMatches(
  fatherZodiac: string,
  motherZodiac: string,
  limit: number = 3
): Promise<Clause[]> {
  const fTerm = `父属${fatherZodiac}`;
  const mTerm = `母属${motherZodiac}`;

  // 1. Primary Search: Perfect Match (Father + Mother)
  const { data: exactMatches, error: exactError } = await supabase
    .from('tieban_clauses')
    .select('*')
    .ilike('content', `%${fTerm}%`)
    .ilike('content', `%${mTerm}%`)
    .limit(5);

  if (exactError) {
    console.error('Error in exact match search:', exactError);
  }

  // 2. Secondary Search: Father Match Only (Broader Context)
  const { data: fatherMatches, error: fatherError } = await supabase
    .from('tieban_clauses')
    .select('*')
    .ilike('content', `%${fTerm}%`)
    .limit(5);

  if (fatherError) {
    console.error('Error in father match search:', fatherError);
  }

  // 3. Tertiary Search: Mother Match Only
  const { data: motherMatches, error: motherError } = await supabase
    .from('tieban_clauses')
    .select('*')
    .ilike('content', `%${mTerm}%`)
    .limit(3);

  if (motherError) {
    console.error('Error in mother match search:', motherError);
  }

  // Combine all candidates
  const allCandidates = [
    ...(exactMatches || []),
    ...(fatherMatches || []),
    ...(motherMatches || []),
  ];

  // Deduplicate by clause_number
  const seen = new Set<number>();
  const uniqueCandidates = allCandidates.filter((clause) => {
    if (seen.has(clause.clause_number)) return false;
    seen.add(clause.clause_number);
    return true;
  });

  // Sort by richness (text length) - longer = more detailed
  const sortedByRichness = uniqueCandidates.sort(
    (a, b) => b.content.length - a.content.length
  );

  return sortedByRichness.slice(0, limit) as Clause[];
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
