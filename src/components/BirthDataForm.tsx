import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, MapPin, Clock, Compass } from 'lucide-react';
import { TiebanEngine, type TiebanInput } from '@/utils/tiebanAlgorithm';
import { LocationSearch, type GeocodedLocation } from '@/components/LocationSearch';
import { useI18n } from '@/hooks/useI18n';

/** Extended birth data that includes P0.5 location metadata */
export interface BirthDataWithGeo extends TiebanInput {
  normalizedLocationName: string;
  timezoneIana: string;
  sourceProvider: string;
  sourceConfidence: number;
}

interface BirthDataFormProps {
  onSubmit: (data: BirthDataWithGeo) => void;
  isLoading?: boolean;
}

function formatTimezone(offsetMinutes: number): string {
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMinutes);
  const hh = Math.floor(abs / 60).toString().padStart(2, '0');
  const mm = (abs % 60).toString().padStart(2, '0');
  return `UTC${sign}${hh}:${mm}`;
}

export function BirthDataForm({ onSubmit, isLoading }: BirthDataFormProps) {
  const { t, lang } = useI18n();
  const [formData, setFormData] = useState<TiebanInput>({
    year: 1990,
    month: 1,
    day: 1,
    hour: 12,
    minute: 0,
    gender: 'male',
    geoLatitude: 39.9042,
    geoLongitude: 116.4074,
    timezoneOffsetMinutes: 480,
  });
  const [locationName, setLocationName] = useState('北京');
  const [timezoneIana, setTimezoneIana] = useState('Asia/Shanghai');
  const [sourceProvider, setSourceProvider] = useState('default');
  const [sourceConfidence, setSourceConfidence] = useState(0.9);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errorText, setErrorText] = useState('');

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');

    if (Number.isNaN(formData.geoLatitude) || formData.geoLatitude < -90 || formData.geoLatitude > 90) {
      setErrorText(t('form.lat_error'));
      return;
    }
    if (Number.isNaN(formData.geoLongitude) || formData.geoLongitude < -180 || formData.geoLongitude > 180) {
      setErrorText(t('form.lng_error'));
      return;
    }
    if (
      Number.isNaN(formData.timezoneOffsetMinutes) ||
      formData.timezoneOffsetMinutes < -720 ||
      formData.timezoneOffsetMinutes > 840
    ) {
      setErrorText(t('form.tz_error'));
      return;
    }

    onSubmit({
      ...formData,
      normalizedLocationName: locationName,
      timezoneIana,
      sourceProvider,
      sourceConfidence,
    });
  };

  const handleLocationSelect = (loc: GeocodedLocation) => {
    setFormData((prev) => ({
      ...prev,
      geoLatitude: loc.geoLatitude,
      geoLongitude: loc.geoLongitude,
      timezoneOffsetMinutes: loc.timezoneOffsetMinutesAtBirth,
    }));
    setLocationName(loc.normalizedLocationName);
    setTimezoneIana(loc.timezoneIana);
    setSourceProvider(loc.sourceProvider);
    setSourceConfidence(1.0);
  };

  const chineseHour = TiebanEngine.getChineseHour(formData.hour);

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      {/* Header */}
      <div className="text-center pb-5 border-b border-border/30">
        <h2 className="text-xl font-serif text-gradient-gold tracking-wider">{t('form.title')}</h2>
        <p className="text-muted-foreground text-xs mt-2 font-sans">
          {t('form.desc')}
        </p>
      </div>

      {/* Date */}
      <div className="space-y-2.5">
        <Label className="text-xs text-muted-foreground font-sans flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />{t('form.birth_date')}
        </Label>
        <div className="grid grid-cols-3 gap-2.5">
          <Select value={formData.year.toString()} onValueChange={(v) => setFormData({ ...formData, year: parseInt(v, 10) })}>
            <SelectTrigger className="bg-input border-border/50 hover:border-primary/40 transition-colors text-sm h-11 rounded-lg">
              <SelectValue placeholder="年" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>{year}年</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={formData.month.toString()} onValueChange={(v) => setFormData({ ...formData, month: parseInt(v, 10) })}>
            <SelectTrigger className="bg-input border-border/50 hover:border-primary/40 transition-colors text-sm h-11 rounded-lg">
              <SelectValue placeholder="月" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month} value={month.toString()}>{month}月</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={formData.day.toString()} onValueChange={(v) => setFormData({ ...formData, day: parseInt(v, 10) })}>
            <SelectTrigger className="bg-input border-border/50 hover:border-primary/40 transition-colors text-sm h-11 rounded-lg">
              <SelectValue placeholder="日" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {days.map((day) => (
                <SelectItem key={day} value={day.toString()}>{day}日</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Time */}
      <div className="space-y-2.5">
        <Label className="text-xs text-muted-foreground font-sans flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />{t('form.birth_time')}
        </Label>
        <div className="grid grid-cols-2 gap-2.5">
          <Select value={formData.hour.toString()} onValueChange={(v) => setFormData({ ...formData, hour: parseInt(v, 10) })}>
            <SelectTrigger className="bg-input border-border/50 hover:border-primary/40 transition-colors text-sm h-11 rounded-lg">
              <SelectValue placeholder="时" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {hours.map((hour) => (
                <SelectItem key={hour} value={hour.toString()}>{hour.toString().padStart(2, '0')}时</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={formData.minute.toString()} onValueChange={(v) => setFormData({ ...formData, minute: parseInt(v, 10) })}>
            <SelectTrigger className="bg-input border-border/50 hover:border-primary/40 transition-colors text-sm h-11 rounded-lg">
              <SelectValue placeholder="分" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {minutes.map((minute) => (
                <SelectItem key={minute} value={minute.toString()}>{minute.toString().padStart(2, '0')}分</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="text-center mt-2 py-2 bg-card/50 rounded-lg border border-border/20">
          <span className="text-muted-foreground text-xs font-sans">时辰 </span>
          <span className="text-primary font-serif text-sm">{chineseHour}</span>
        </div>
      </div>

      {/* Location */}
      <LocationSearch
        birthYear={formData.year}
        birthMonth={formData.month}
        birthDay={formData.day}
        birthHour={formData.hour}
        onSelect={handleLocationSelect}
        initialLocationName="北京"
      />

      {/* Geo info */}
      <div className="bg-card/40 border border-border/20 rounded-lg p-3 space-y-1.5">
        <div className="grid grid-cols-3 gap-2 text-[11px] font-sans">
          <div className="flex items-center gap-1">
            <Compass className="w-3 h-3 text-muted-foreground/50" />
            <span className="text-muted-foreground">纬</span>
            <span className="text-foreground/70 font-mono">{formData.geoLatitude.toFixed(4)}°</span>
          </div>
          <div className="flex items-center gap-1">
            <Compass className="w-3 h-3 text-muted-foreground/50" />
            <span className="text-muted-foreground">经</span>
            <span className="text-foreground/70 font-mono">{formData.geoLongitude.toFixed(4)}°</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-muted-foreground/50" />
            <span className="text-foreground/70 font-mono">{formatTimezone(formData.timezoneOffsetMinutes)}</span>
          </div>
        </div>
        {timezoneIana && (
          <p className="text-[10px] text-muted-foreground/50 font-sans">
            {timezoneIana}{locationName && ` · ${locationName.split(', ').slice(0, 2).join(', ')}`}
          </p>
        )}
      </div>

      {/* Advanced */}
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleTrigger className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors font-sans">
          <ChevronDown className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          手动修正坐标与时区
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground/60 font-sans">纬度</Label>
              <Input type="number" step="0.0001" value={formData.geoLatitude}
                onChange={(e) => setFormData({ ...formData, geoLatitude: Number(e.target.value) })}
                className="bg-input border-border/50 h-9 rounded-lg text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground/60 font-sans">经度</Label>
              <Input type="number" step="0.0001" value={formData.geoLongitude}
                onChange={(e) => setFormData({ ...formData, geoLongitude: Number(e.target.value) })}
                className="bg-input border-border/50 h-9 rounded-lg text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground/60 font-sans">时区偏移(分)</Label>
              <Input type="number" step="1" value={formData.timezoneOffsetMinutes}
                onChange={(e) => setFormData({ ...formData, timezoneOffsetMinutes: Number(e.target.value) })}
                className="bg-input border-border/50 h-9 rounded-lg text-sm" />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Gender */}
      <div className="space-y-3">
        <Label className="text-xs text-muted-foreground font-sans">性别</Label>
        <RadioGroup
          value={formData.gender}
          onValueChange={(v) => setFormData({ ...formData, gender: v as 'male' | 'female' })}
          className="flex gap-4"
        >
          <label htmlFor="male" className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg border border-border/30 bg-card/30 hover:border-primary/30 cursor-pointer transition-all has-[data-state=checked]:border-primary/50 has-[data-state=checked]:bg-primary/5">
            <RadioGroupItem value="male" id="male" className="border-primary/40 text-primary" />
            <span className="text-sm font-sans">乾命 (男)</span>
          </label>
          <label htmlFor="female" className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg border border-border/30 bg-card/30 hover:border-primary/30 cursor-pointer transition-all has-[data-state=checked]:border-primary/50 has-[data-state=checked]:bg-primary/5">
            <RadioGroupItem value="female" id="female" className="border-primary/40 text-primary" />
            <span className="text-sm font-sans">坤命 (女)</span>
          </label>
        </RadioGroup>
      </div>

      {errorText && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive font-sans">
          {errorText}
        </div>
      )}

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/85 py-6 text-base font-serif tracking-[0.2em] transition-all duration-300 hover:shadow-lg hover:shadow-primary/15 rounded-xl"
      >
        {isLoading ? <span className="animate-pulse">推算中...</span> : '起 盘 考 刻'}
      </Button>
    </form>
  );
}
