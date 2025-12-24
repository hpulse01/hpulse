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
 * Convert number to Chinese numeral for sibling matching
 */
function toChineseNumeral(num: number): string {
  const numerals = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  if (num <= 10) return numerals[num];
  if (num < 20) return `十${numerals[num - 10]}`;
  return num.toString();
}

/**
 * Generate sibling search patterns
 * e.g., for 3 siblings: ['兄弟三人', '兄弟3人', '弟兄三', '同胞三']
 */
function getSiblingsPatterns(count: number): string[] {
  const chineseNum = toChineseNumeral(count);
  return [
    `兄弟${chineseNum}人`,
    `兄弟${count}人`,
    `弟兄${chineseNum}`,
    `同胞${chineseNum}`,
    `手足${chineseNum}`,
  ];
}

/**
 * ADVANCED SEARCH: Finds the most detailed clauses matching the Family Facts.
 * Logic:
 * 1. Search for clauses containing Father's Zodiac AND Mother's Zodiac AND Siblings.
 * 2. Search for clauses containing Father's Zodiac AND Mother's Zodiac.
 * 3. Search for clauses containing Father's Zodiac AND Siblings.
 * 4. Search for clauses containing Father's Zodiac ONLY (as fallback context).
 * 5. Sort results by MATCH QUALITY and TEXT LENGTH.
 * 
 * @param fatherZodiac - Chinese zodiac character (e.g., "牛")
 * @param motherZodiac - Chinese zodiac character (e.g., "兔")
 * @param siblingsCount - Number of siblings including the user
 * @param limit - Maximum number of results to return (default: 6)
 * @returns Array of matching clauses, sorted by richness and relevance
 */
export async function findDetailedFamilyMatches(
  fatherZodiac: string,
  motherZodiac: string,
  siblingsCount: number = 1,
  limit: number = 6
): Promise<Clause[]> {
  const fTerm = `父属${fatherZodiac}`;
  const mTerm = `母属${motherZodiac}`;
  const siblingPatterns = getSiblingsPatterns(siblingsCount);

  // Build all search results
  type SearchResult = { data: Clause[] | null; priority: number };
  const searchResults: SearchResult[] = [];

  // Helper to run a search and capture result
  const runSearch = async (
    query: PromiseLike<{ data: any[] | null }>,
    priority: number
  ): Promise<SearchResult> => {
    const { data } = await query;
    return { data: data as Clause[] | null, priority };
  };

  // 1. BEST: Father + Mother + Siblings (any pattern)
  const siblingSearches = siblingPatterns.map((sibPattern) =>
    runSearch(
      supabase
        .from('tieban_clauses')
        .select('*')
        .ilike('content', `%${fTerm}%`)
        .ilike('content', `%${mTerm}%`)
        .ilike('content', `%${sibPattern}%`)
        .limit(3),
      1
    )
  );

  // 2. Father + Mother (no siblings)
  const parentSearch = runSearch(
    supabase
      .from('tieban_clauses')
      .select('*')
      .ilike('content', `%${fTerm}%`)
      .ilike('content', `%${mTerm}%`)
      .limit(5),
    2
  );

  // 3. Father + Siblings
  const fatherSiblingSearches = siblingPatterns.slice(0, 2).map((sibPattern) =>
    runSearch(
      supabase
        .from('tieban_clauses')
        .select('*')
        .ilike('content', `%${fTerm}%`)
        .ilike('content', `%${sibPattern}%`)
        .limit(3),
      3
    )
  );

  // 4. Father Only (broad fallback)
  const fatherSearch = runSearch(
    supabase
      .from('tieban_clauses')
      .select('*')
      .ilike('content', `%${fTerm}%`)
      .limit(5),
    4
  );

  // 5. Mother Only
  const motherSearch = runSearch(
    supabase
      .from('tieban_clauses')
      .select('*')
      .ilike('content', `%${mTerm}%`)
      .limit(3),
    5
  );

  // Execute all searches in parallel
  const results = await Promise.all([
    ...siblingSearches,
    parentSearch,
    ...fatherSiblingSearches,
    fatherSearch,
    motherSearch,
  ]);

  // Combine and tag with priority
  const allCandidates: Array<Clause & { _priority: number }> = [];
  for (const { data, priority } of results) {
    if (data) {
      for (const clause of data) {
        allCandidates.push({ ...clause, _priority: priority });
      }
    }
  }

  // Deduplicate by clause_number, keeping highest priority (lowest number)
  const seen = new Map<number, Clause & { _priority: number }>();
  for (const clause of allCandidates) {
    const existing = seen.get(clause.clause_number);
    if (!existing || clause._priority < existing._priority) {
      seen.set(clause.clause_number, clause);
    }
  }

  const uniqueCandidates = Array.from(seen.values());

  // Sort by: priority first, then text length (richness)
  const sortedResults = uniqueCandidates.sort((a, b) => {
    if (a._priority !== b._priority) {
      return a._priority - b._priority;
    }
    return b.content.length - a.content.length;
  });

  // Remove internal _priority field and return
  return sortedResults.slice(0, limit).map(({ _priority, ...clause }) => clause) as Clause[];
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

/**
 * MANUAL SEARCH: Generic fuzzy search for clauses.
 * Allows searching by ANY text, supporting multi-keyword AND logic.
 * e.g., query: "父属牛 母属兔" -> searches for clauses containing "父属牛" AND "母属兔"
 * 
 * @param query - Space-separated keywords to search for
 * @param limit - Maximum number of results to return (default: 20)
 * @returns Array of matching clauses with clause_number and content
 */
export async function searchClausesFreeText(
  query: string,
  limit: number = 20
): Promise<Array<{ clause_number: number; content: string }>> {
  // Split query by spaces to allow multi-keyword search
  const keywords = query.split(/\s+/).filter(k => k.trim() !== '');
  
  if (keywords.length === 0) return [];

  // Build query with chained ilike for AND logic
  let dbQuery = supabase
    .from('tieban_clauses')
    .select('clause_number, content');

  // Chain "ilike" for each keyword (AND logic)
  keywords.forEach(keyword => {
    dbQuery = dbQuery.ilike('content', `%${keyword}%`);
  });

  // Execute with limit
  const { data, error } = await dbQuery.limit(limit);
  
  if (error) {
    console.error('Free text search error:', error);
    return [];
  }
  
  // Sort by content length (more detailed first)
  return (data || []).sort((a, b) => b.content.length - a.content.length);
}
