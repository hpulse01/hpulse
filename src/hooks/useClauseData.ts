import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Clause {
  id: number;
  clause_number: number;
  content: string;
  category: string | null;
}

/**
 * Hook to fetch and manage clause data from the database
 */
export function useClauseData() {
  const [clauses, setClauses] = useState<Map<number, Clause>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadClauses();
  }, []);

  const loadClauses = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('tieban_clauses')
        .select('*');

      if (fetchError) {
        throw fetchError;
      }

      // Create a map for O(1) lookup by clause_number
      const clauseMap = new Map<number, Clause>();
      data?.forEach((clause: Clause) => {
        clauseMap.set(clause.clause_number, clause);
      });

      setClauses(clauseMap);
    } catch (err) {
      console.error('Error loading clauses:', err);
      setError('无法加载条文数据');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get clause by number with fallback search
   */
  const getClause = (clauseNumber: number, searchRadius: number = 10): Clause | null => {
    // Try exact match first
    if (clauses.has(clauseNumber)) {
      return clauses.get(clauseNumber)!;
    }

    // Search nearby numbers
    for (let offset = 1; offset <= searchRadius; offset++) {
      if (clauses.has(clauseNumber + offset)) {
        return clauses.get(clauseNumber + offset)!;
      }
      if (clauses.has(clauseNumber - offset)) {
        return clauses.get(clauseNumber - offset)!;
      }
    }

    return null;
  };

  /**
   * Get multiple clauses by numbers
   */
  const getClauses = (clauseNumbers: number[]): (Clause | null)[] => {
    return clauseNumbers.map(num => getClause(num));
  };

  /**
   * Get all valid clause numbers (for validation)
   */
  const getValidNumbers = (): Set<number> => {
    return new Set(clauses.keys());
  };

  return {
    clauses,
    isLoading,
    error,
    getClause,
    getClauses,
    getValidNumbers,
    reload: loadClauses,
  };
}
