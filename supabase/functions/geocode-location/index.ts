/**
 * geocode-location Edge Function
 *
 * Geocodes a city/place name → lat, lon, IANA timezone, offset at birth datetime.
 * Uses: OpenStreetMap Nominatim (free, no key) + TimeAPI.io (free, no key).
 *
 * POST body:
 *   { query: string, birthYear?: number, birthMonth?: number, birthDay?: number, birthHour?: number }
 *
 * Returns:
 *   { results: GeocodedLocation[] }
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface GeocodedLocation {
  normalizedLocationName: string;
  geoLatitude: number;
  geoLongitude: number;
  timezoneIana: string;
  timezoneOffsetMinutesAtBirth: number;
  sourceProvider: string;
  confidence: number;
}

/**
 * Compute the UTC offset in minutes for a given IANA timezone at a specific date.
 * Uses Intl.DateTimeFormat.formatToParts with longOffset to extract the real offset.
 */
function getOffsetAtDate(ianaTimezone: string, date: Date): number {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: ianaTimezone,
      timeZoneName: 'longOffset',
    });
    const parts = formatter.formatToParts(date);
    const tzPart = parts.find(p => p.type === 'timeZoneName');
    if (tzPart) {
      // Format: "GMT+08:00" or "GMT-05:00" or "GMT"
      if (tzPart.value === 'GMT') return 0;
      const match = tzPart.value.match(/GMT([+-])(\d{1,2}):?(\d{2})?/);
      if (match) {
        const sign = match[1] === '+' ? 1 : -1;
        const hours = parseInt(match[2], 10);
        const minutes = parseInt(match[3] || '0', 10);
        return sign * (hours * 60 + minutes);
      }
    }
    return 0;
  } catch {
    return 0;
  }
}

/**
 * Query TimeAPI.io for IANA timezone from coordinates.
 * Falls back to longitude-based estimate if the API fails.
 */
async function getIanaTimezone(lat: number, lon: number): Promise<string> {
  try {
    const url = `https://timeapi.io/api/timezone/coordinate?latitude=${lat}&longitude=${lon}`;
    const resp = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    if (resp.ok) {
      const data = await resp.json();
      if (data.timeZone) return data.timeZone;
    }
  } catch {
    // fall through
  }

  // Fallback: rough estimate from longitude (±15° per hour)
  const offsetHours = Math.round(lon / 15);
  // Map to common IANA names
  const etcZone = `Etc/GMT${offsetHours <= 0 ? '+' : '-'}${Math.abs(offsetHours)}`;
  return etcZone;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const query = (body.query || '').trim();
    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Missing query parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const birthYear = body.birthYear ?? 1990;
    const birthMonth = body.birthMonth ?? 1;
    const birthDay = body.birthDay ?? 1;
    const birthHour = body.birthHour ?? 12;

    // Step 1: Nominatim geocoding
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&accept-language=zh,en`;
    const nominatimResp = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'HPulse-BirthChart/1.0 (hpulse.lovable.app)',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!nominatimResp.ok) {
      const errText = await nominatimResp.text();
      return new Response(
        JSON.stringify({ error: `Nominatim API failed [${nominatimResp.status}]: ${errText}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const nominatimResults = await nominatimResp.json();

    if (!Array.isArray(nominatimResults) || nominatimResults.length === 0) {
      return new Response(
        JSON.stringify({ results: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Step 2: For each result, resolve IANA timezone + compute offset at birth
    const results: GeocodedLocation[] = [];

    for (const item of nominatimResults.slice(0, 5)) {
      const lat = parseFloat(item.lat);
      const lon = parseFloat(item.lon);
      const displayName = item.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;

      // importance is 0-1 from Nominatim
      const confidence = Math.min(1, Math.max(0, parseFloat(item.importance) || 0.5));

      // Get IANA timezone
      const ianaTimezone = await getIanaTimezone(lat, lon);

      // Compute offset at birth date
      const birthDate = new Date(Date.UTC(birthYear, birthMonth - 1, birthDay, birthHour, 0, 0));
      const offsetMinutes = getOffsetAtDate(ianaTimezone, birthDate);

      results.push({
        normalizedLocationName: displayName,
        geoLatitude: lat,
        geoLongitude: lon,
        timezoneIana: ianaTimezone,
        timezoneOffsetMinutesAtBirth: offsetMinutes,
        sourceProvider: 'nominatim+timeapi',
        confidence,
      });
    }

    return new Response(
      JSON.stringify({ results }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('geocode-location error:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
