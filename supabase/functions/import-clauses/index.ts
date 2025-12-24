import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ClauseInput {
  id: string;
  text: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting clause import...');

    // Get Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse the request body which should contain the clauses array
    const { clauses } = await req.json() as { clauses: ClauseInput[] };

    if (!clauses || !Array.isArray(clauses)) {
      throw new Error('Invalid input: expected { clauses: [...] }');
    }

    console.log(`Received ${clauses.length} clauses to import`);

    let imported = 0;
    let skipped = 0;
    let errors: string[] = [];

    // Process in batches of 500 for efficiency
    const BATCH_SIZE = 500;
    
    for (let i = 0; i < clauses.length; i += BATCH_SIZE) {
      const batch = clauses.slice(i, i + BATCH_SIZE);
      
      // Transform and sanitize the data
      const records = batch.map((clause) => ({
        clause_number: parseInt(clause.id, 10),
        content: clause.text.trim(), // Trim whitespace
      })).filter((record) => {
        // Validate clause_number is a valid integer
        if (isNaN(record.clause_number)) {
          errors.push(`Invalid clause number: ${record.clause_number}`);
          return false;
        }
        return true;
      });

      // Upsert - insert or update if exists (handles duplicates)
      const { data, error } = await supabase
        .from('tieban_clauses')
        .upsert(records, {
          onConflict: 'clause_number',
          ignoreDuplicates: false, // Update existing records
        })
        .select();

      if (error) {
        console.error(`Batch ${i / BATCH_SIZE + 1} error:`, error);
        errors.push(`Batch error: ${error.message}`);
        skipped += records.length;
      } else {
        imported += records.length;
        console.log(`Batch ${i / BATCH_SIZE + 1}: Imported ${records.length} records`);
      }
    }

    const result = {
      success: true,
      total_processed: clauses.length,
      imported,
      skipped,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined, // Limit error list
    };

    console.log('Import complete:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Import error:', errorMessage);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
