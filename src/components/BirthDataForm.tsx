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

export function BirthDataForm({ onSubmit, isLoading }: BirthDataFormProps) {
  const [formData, setFormData] = useState<TiebanInput>({
    year: 1990,
    month: 1,
    day: 1,
    hour: 12,
    minute: 0,
    gender: 'male',
  });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Get Chinese hour for display
  const chineseHour = TiebanEngine.getChineseHour(formData.hour);

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Section Title */}
      <div className="text-center border-b border-primary/30 pb-4">
        <h2 className="text-2xl font-display text-primary tracking-wider">
          输入生辰
        </h2>
        <p className="text-muted-foreground text-sm mt-2">
          请准确填写阳历出生时间（精确到分钟）
        </p>
      </div>

      {/* Date Selection */}
      <div className="space-y-2">
        <Label className="text-foreground/80 text-sm">出生日期</Label>
        <div className="grid grid-cols-3 gap-3">
          {/* Year */}
          <Select
            value={formData.year.toString()}
            onValueChange={(v) => setFormData({ ...formData, year: parseInt(v) })}
          >
            <SelectTrigger className="bg-secondary border-border hover:border-primary/50 transition-colors">
              <SelectValue placeholder="年" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}年
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Month */}
          <Select
            value={formData.month.toString()}
            onValueChange={(v) => setFormData({ ...formData, month: parseInt(v) })}
          >
            <SelectTrigger className="bg-secondary border-border hover:border-primary/50 transition-colors">
              <SelectValue placeholder="月" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month} value={month.toString()}>
                  {month}月
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Day */}
          <Select
            value={formData.day.toString()}
            onValueChange={(v) => setFormData({ ...formData, day: parseInt(v) })}
          >
            <SelectTrigger className="bg-secondary border-border hover:border-primary/50 transition-colors">
              <SelectValue placeholder="日" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {days.map((day) => (
                <SelectItem key={day} value={day.toString()}>
                  {day}日
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Time Selection - CRITICAL: Distinct Hour and Minute */}
      <div className="space-y-2">
        <Label className="text-foreground/80 text-sm">出生时间（精确选择）</Label>
        <div className="grid grid-cols-2 gap-3">
          {/* Hour */}
          <Select
            value={formData.hour.toString()}
            onValueChange={(v) => setFormData({ ...formData, hour: parseInt(v) })}
          >
            <SelectTrigger className="bg-secondary border-border hover:border-primary/50 transition-colors">
              <SelectValue placeholder="时" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {hours.map((hour) => (
                <SelectItem key={hour} value={hour.toString()}>
                  {hour.toString().padStart(2, '0')}时
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Minute - DISTINCT SELECTION */}
          <Select
            value={formData.minute.toString()}
            onValueChange={(v) => setFormData({ ...formData, minute: parseInt(v) })}
          >
            <SelectTrigger className="bg-secondary border-border hover:border-primary/50 transition-colors">
              <SelectValue placeholder="分" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {minutes.map((minute) => (
                <SelectItem key={minute} value={minute.toString()}>
                  {minute.toString().padStart(2, '0')}分
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Chinese Hour Display */}
        <div className="text-center mt-2 py-2 bg-secondary/30 rounded">
          <span className="text-muted-foreground text-sm">时辰: </span>
          <span className="text-primary font-medium">{chineseHour}</span>
        </div>
      </div>

      {/* Gender Selection */}
      <div className="space-y-3">
        <Label className="text-foreground/80 text-sm">性别</Label>
        <RadioGroup
          value={formData.gender}
          onValueChange={(v) => setFormData({ ...formData, gender: v as 'male' | 'female' })}
          className="flex gap-6"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="male" id="male" className="border-primary text-primary" />
            <Label htmlFor="male" className="cursor-pointer hover:text-primary transition-colors">
              乾命 (男)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="female" id="female" className="border-primary text-primary" />
            <Label htmlFor="female" className="cursor-pointer hover:text-primary transition-colors">
              坤命 (女)
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Important Notice */}
      <div className="bg-secondary/20 border border-border/50 rounded p-4">
        <p className="text-muted-foreground text-xs leading-relaxed text-center">
          铁板神数对出生时刻要求极为精确，分钟误差将影响推算结果。
          <br />
          如不确定精确分钟，请选择大致时间后通过"考刻"步骤校准。
        </p>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 
                   py-6 text-lg font-serif tracking-widest transition-all duration-300
                   hover:shadow-lg hover:shadow-primary/20"
      >
        {isLoading ? (
          <span className="animate-pulse">推算中...</span>
        ) : (
          '起盘考刻'
        )}
      </Button>
    </form>
  );
}
