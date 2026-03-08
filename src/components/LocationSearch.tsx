/**
 * LocationSearch — Debounced city search with geocoding via edge function.
 * Returns structured location data (lat, lon, IANA timezone, offset at birth).
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2, Search, AlertCircle } from 'lucide-react';

export interface GeocodedLocation {
  normalizedLocationName: string;
  geoLatitude: number;
  geoLongitude: number;
  timezoneIana: string;
  timezoneOffsetMinutesAtBirth: number;
  sourceProvider: string;
  confidence: number;
}

interface LocationSearchProps {
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour: number;
  onSelect: (location: GeocodedLocation) => void;
  initialLocationName?: string;
}

export function LocationSearch({
  birthYear,
  birthMonth,
  birthDay,
  birthHour,
  onSelect,
  initialLocationName,
}: LocationSearchProps) {
  const [query, setQuery] = useState(initialLocationName || '');
  const [results, setResults] = useState<GeocodedLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedName, setSelectedName] = useState(initialLocationName || '');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const doSearch = useCallback(
    async (q: string) => {
      if (q.length < 2) {
        setResults([]);
        setShowDropdown(false);
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const url = `https://${projectId}.supabase.co/functions/v1/geocode-location`;

        const resp = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': anonKey,
          },
          body: JSON.stringify({
            query: q,
            birthYear,
            birthMonth,
            birthDay,
            birthHour,
          }),
        });

        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({ error: resp.statusText }));
          throw new Error(errData.error || `HTTP ${resp.status}`);
        }

        const data = await resp.json();
        setResults(data.results || []);
        setShowDropdown((data.results || []).length > 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : '搜索失败');
        setResults([]);
        setShowDropdown(false);
      } finally {
        setIsLoading(false);
      }
    },
    [birthYear, birthMonth, birthDay, birthHour],
  );

  const handleInputChange = (value: string) => {
    setQuery(value);
    setSelectedName('');

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 500);
  };

  const handleSelect = (loc: GeocodedLocation) => {
    // Shorten display name: take first 2-3 parts
    const parts = loc.normalizedLocationName.split(', ');
    const short = parts.slice(0, 3).join(', ');
    setQuery(short);
    setSelectedName(short);
    setShowDropdown(false);
    setResults([]);
    onSelect(loc);
  };

  function formatOffset(minutes: number): string {
    const sign = minutes >= 0 ? '+' : '-';
    const abs = Math.abs(minutes);
    const hh = Math.floor(abs / 60);
    const mm = abs % 60;
    return `UTC${sign}${hh}${mm > 0 ? ':' + mm.toString().padStart(2, '0') : ''}`;
  }

  return (
    <div ref={containerRef} className="relative space-y-1.5">
      <Label className="text-foreground/80 text-sm flex items-center gap-1.5">
        <MapPin className="w-3.5 h-3.5" />
        出生地点搜索
      </Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          placeholder="输入城市名称，如：北京、Tokyo、New York..."
          className="pl-9 pr-9 bg-secondary border-border"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
        )}
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{error}（可手动输入经纬度）</span>
        </div>
      )}

      {selectedName && (
        <p className="text-xs text-primary">
          ✓ 已选择：{selectedName}
        </p>
      )}

      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-64 overflow-y-auto">
          {results.map((loc, i) => {
            const parts = loc.normalizedLocationName.split(', ');
            const primary = parts.slice(0, 2).join(', ');
            const secondary = parts.slice(2).join(', ');

            return (
              <button
                key={`${loc.geoLatitude}-${loc.geoLongitude}-${i}`}
                type="button"
                onClick={() => handleSelect(loc)}
                className="w-full text-left px-3 py-2.5 hover:bg-accent/50 transition-colors border-b border-border/30 last:border-b-0"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{primary}</p>
                    {secondary && (
                      <p className="text-xs text-muted-foreground truncate">{secondary}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {loc.geoLatitude.toFixed(2)}°, {loc.geoLongitude.toFixed(2)}°
                    </p>
                    <p className="text-[10px] text-primary font-mono">
                      {loc.timezoneIana} ({formatOffset(loc.timezoneOffsetMinutesAtBirth)})
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
