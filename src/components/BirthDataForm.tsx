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
import { TiebanEngine, type TiebanInput } from '@/utils/tiebanAlgorithm';

interface BirthDataFormProps {
  onSubmit: (data: TiebanInput) => void;
  isLoading?: boolean;
}

const LOCATION_PRESETS = [
  { key: 'beijing', label: '北京 (39.9042, 116.4074, UTC+8)', lat: 39.9042, lon: 116.4074, tz: 480 },
  { key: 'shanghai', label: '上海 (31.2304, 121.4737, UTC+8)', lat: 31.2304, lon: 121.4737, tz: 480 },
  { key: 'guangzhou', label: '广州 (23.1291, 113.2644, UTC+8)', lat: 23.1291, lon: 113.2644, tz: 480 },
  { key: 'hongkong', label: '香港 (22.3193, 114.1694, UTC+8)', lat: 22.3193, lon: 114.1694, tz: 480 },
  { key: 'taipei', label: '台北 (25.0330, 121.5654, UTC+8)', lat: 25.0330, lon: 121.5654, tz: 480 },
  { key: 'tokyo', label: '东京 (35.6762, 139.6503, UTC+9)', lat: 35.6762, lon: 139.6503, tz: 540 },
  { key: 'newyork', label: '纽约 (40.7128, -74.0060, UTC-5)', lat: 40.7128, lon: -74.0060, tz: -300 },
  { key: 'london', label: '伦敦 (51.5074, -0.1278, UTC+0)', lat: 51.5074, lon: -0.1278, tz: 0 },
];

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
  const [presetKey, setPresetKey] = useState('beijing');
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

    onSubmit(formData);
  };

  const handlePresetChange = (key: string) => {
    setPresetKey(key);
    const preset = LOCATION_PRESETS.find((p) => p.key === key);
    if (!preset) return;
    setFormData((prev) => ({
      ...prev,
      geoLatitude: preset.lat,
      geoLongitude: preset.lon,
      timezoneOffsetMinutes: preset.tz,
    }));
  };

  const chineseHour = TiebanEngine.getChineseHour(formData.hour);

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="text-center border-b border-border pb-4">
        <h2 className="text-2xl font-display text-primary tracking-wider">输入生辰</h2>
        <p className="text-muted-foreground text-sm mt-2">
          请填写出生地经纬度与时区，主流程将据此计算真实上升点与中天
        </p>
      </div>

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

      <div className="space-y-2">
        <Label className="text-foreground/80 text-sm">出生地（可选预设）</Label>
        <Select value={presetKey} onValueChange={handlePresetChange}>
          <SelectTrigger className="bg-secondary border-border hover:border-primary/50 transition-colors">
            <SelectValue placeholder="选择城市预设" />
          </SelectTrigger>
          <SelectContent>
            {LOCATION_PRESETS.map((preset) => (
              <SelectItem key={preset.key} value={preset.key}>{preset.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-foreground/80 text-sm">出生地经纬度与时区</Label>
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
        <p className="text-xs text-muted-foreground">
          当前时区：<span className="text-foreground">{formatTimezone(formData.timezoneOffsetMinutes)}</span>
        </p>
      </div>

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

      <div className="bg-secondary/20 border border-border/50 rounded p-4">
        <p className="text-muted-foreground text-xs leading-relaxed text-center">
          本地出生时间 + 出生地经纬度 + 时区会转换为 UTC 后进入天文引擎，
          用于上升点与中天计算。
        </p>
      </div>

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
