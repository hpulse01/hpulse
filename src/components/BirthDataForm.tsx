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
import { ChevronDown } from 'lucide-react';
import { TiebanEngine, type TiebanInput } from '@/utils/tiebanAlgorithm';
import { LocationSearch, type GeocodedLocation } from '@/components/LocationSearch';

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
      setErrorText('纬度必须在 -90 到 90 之间');
      return;
    }
    if (Number.isNaN(formData.geoLongitude) || formData.geoLongitude < -180 || formData.geoLongitude > 180) {
      setErrorText('经度必须在 -180 到 180 之间');
      return;
    }
    if (
      Number.isNaN(formData.timezoneOffsetMinutes) ||
      formData.timezoneOffsetMinutes < -720 ||
      formData.timezoneOffsetMinutes > 840
    ) {
      setErrorText('时区偏移必须在 -720 到 840 分钟之间');
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
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="text-center border-b border-border pb-4">
        <h2 className="text-2xl font-display text-primary tracking-wider">输入生辰</h2>
        <p className="text-muted-foreground text-sm mt-2">
          搜索出生地自动解析经纬度与时区，也可手动调整
        </p>
      </div>

      {/* Date */}
      <div className="space-y-2">
        <Label className="text-foreground/80 text-sm">出生日期</Label>
        <div className="grid grid-cols-3 gap-3">
          <Select value={formData.year.toString()} onValueChange={(v) => setFormData({ ...formData, year: parseInt(v, 10) })}>
            <SelectTrigger className="bg-secondary border-border hover:border-primary/50 transition-colors">
              <SelectValue placeholder="年" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>{year}年</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={formData.month.toString()} onValueChange={(v) => setFormData({ ...formData, month: parseInt(v, 10) })}>
            <SelectTrigger className="bg-secondary border-border hover:border-primary/50 transition-colors">
              <SelectValue placeholder="月" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month} value={month.toString()}>{month}月</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={formData.day.toString()} onValueChange={(v) => setFormData({ ...formData, day: parseInt(v, 10) })}>
            <SelectTrigger className="bg-secondary border-border hover:border-primary/50 transition-colors">
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
      <div className="space-y-2">
        <Label className="text-foreground/80 text-sm">出生时间（本地时间）</Label>
        <div className="grid grid-cols-2 gap-3">
          <Select value={formData.hour.toString()} onValueChange={(v) => setFormData({ ...formData, hour: parseInt(v, 10) })}>
            <SelectTrigger className="bg-secondary border-border hover:border-primary/50 transition-colors">
              <SelectValue placeholder="时" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {hours.map((hour) => (
                <SelectItem key={hour} value={hour.toString()}>{hour.toString().padStart(2, '0')}时</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={formData.minute.toString()} onValueChange={(v) => setFormData({ ...formData, minute: parseInt(v, 10) })}>
            <SelectTrigger className="bg-secondary border-border hover:border-primary/50 transition-colors">
              <SelectValue placeholder="分" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {minutes.map((minute) => (
                <SelectItem key={minute} value={minute.toString()}>{minute.toString().padStart(2, '0')}分</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="text-center mt-2 py-2 bg-secondary/30 rounded">
          <span className="text-muted-foreground text-sm">时辰: </span>
          <span className="text-primary font-medium">{chineseHour}</span>
        </div>
      </div>

      {/* Location Search */}
      <LocationSearch
        birthYear={formData.year}
        birthMonth={formData.month}
        birthDay={formData.day}
        birthHour={formData.hour}
        onSelect={handleLocationSelect}
        initialLocationName="北京"
      />

      {/* Resolved location info */}
      <div className="bg-secondary/20 border border-border/50 rounded p-3 space-y-1">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">纬度: </span>
            <span className="text-foreground font-mono">{formData.geoLatitude.toFixed(4)}°</span>
          </div>
          <div>
            <span className="text-muted-foreground">经度: </span>
            <span className="text-foreground font-mono">{formData.geoLongitude.toFixed(4)}°</span>
          </div>
          <div>
            <span className="text-muted-foreground">时区: </span>
            <span className="text-foreground font-mono">{formatTimezone(formData.timezoneOffsetMinutes)}</span>
          </div>
        </div>
        {timezoneIana && (
          <p className="text-[11px] text-muted-foreground">
            IANA: <span className="text-foreground">{timezoneIana}</span>
            {locationName && <span> · {locationName.split(', ').slice(0, 2).join(', ')}</span>}
          </p>
        )}
      </div>

      {/* Advanced override */}
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          手动修正经纬度和时区
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">纬度（北纬+）</Label>
              <Input
                type="number"
                step="0.0001"
                value={formData.geoLatitude}
                onChange={(e) => setFormData({ ...formData, geoLatitude: Number(e.target.value) })}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">经度（东经+）</Label>
              <Input
                type="number"
                step="0.0001"
                value={formData.geoLongitude}
                onChange={(e) => setFormData({ ...formData, geoLongitude: Number(e.target.value) })}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">时区偏移（分钟）</Label>
              <Input
                type="number"
                step="1"
                value={formData.timezoneOffsetMinutes}
                onChange={(e) => setFormData({ ...formData, timezoneOffsetMinutes: Number(e.target.value) })}
                className="bg-secondary border-border"
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Gender */}
      <div className="space-y-3">
        <Label className="text-foreground/80 text-sm">性别</Label>
        <RadioGroup
          value={formData.gender}
          onValueChange={(v) => setFormData({ ...formData, gender: v as 'male' | 'female' })}
          className="flex gap-6"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="male" id="male" className="border-primary text-primary" />
            <Label htmlFor="male" className="cursor-pointer hover:text-primary transition-colors">乾命 (男)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="female" id="female" className="border-primary text-primary" />
            <Label htmlFor="female" className="cursor-pointer hover:text-primary transition-colors">坤命 (女)</Label>
          </div>
        </RadioGroup>
      </div>

      {errorText && (
        <div className="rounded border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorText}
        </div>
      )}

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-6 text-lg font-serif tracking-widest transition-all duration-300 hover:shadow-lg hover:shadow-primary/20"
      >
        {isLoading ? <span className="animate-pulse">推算中...</span> : '起盘考刻'}
      </Button>
    </form>
  );
}
