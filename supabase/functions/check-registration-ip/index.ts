/**
 * Check Registration IP Edge Function
 * Prevents same IP from registering multiple times within 24 hours
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-forwarded-for, x-real-ip',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP from various headers
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const cfConnectingIp = req.headers.get('cf-connecting-ip');
    
    // Parse the first IP from x-forwarded-for (could be comma-separated)
    let clientIp = cfConnectingIp || realIp || (forwardedFor ? forwardedFor.split(',')[0].trim() : null);
    
    // Fallback if no IP found
    if (!clientIp) {
      clientIp = 'unknown';
    }

    const body = await req.json();
    const { action, userAgent } = body;

    // Create Supabase client with service role for bypassing RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    if (action === 'check') {
      // Check if this IP has registered in the last 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { data: existingRegistrations, error: checkError } = await supabase
        .from('registration_ips')
        .select('id, registered_at')
        .eq('ip_address', clientIp)
        .gte('registered_at', twentyFourHoursAgo)
        .limit(1);

      if (checkError) {
        console.error('Error checking IP:', checkError);
        throw checkError;
      }

      if (existingRegistrations && existingRegistrations.length > 0) {
        const registrationTime = new Date(existingRegistrations[0].registered_at);
        const nextAllowedTime = new Date(registrationTime.getTime() + 24 * 60 * 60 * 1000);
        const hoursRemaining = Math.ceil((nextAllowedTime.getTime() - Date.now()) / (1000 * 60 * 60));
        
        return new Response(JSON.stringify({
          allowed: false,
          message: `该网络已注册过账户，请${hoursRemaining}小时后再试`,
          hoursRemaining,
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        allowed: true,
        message: 'IP check passed',
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'record') {
      // Record the IP after successful registration
      const { error: insertError } = await supabase
        .from('registration_ips')
        .insert({
          ip_address: clientIp,
          user_agent: userAgent || null,
          registered_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('Error recording IP:', insertError);
        // Don't fail the registration, just log the error
      }

      // Also cleanup old records periodically (1% chance to avoid overhead)
      if (Math.random() < 0.01) {
        await supabase.rpc('cleanup_old_registration_ips');
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'IP recorded',
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else {
      return new Response(JSON.stringify({
        error: 'Invalid action',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error: unknown) {
    console.error('Check registration IP error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    
    return new Response(JSON.stringify({
      error: message,
      // Allow registration on error to avoid blocking legitimate users
      allowed: true,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
