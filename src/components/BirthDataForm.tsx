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
import type { TiebanInput } from '@/services/TiebanCalculator';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Section Title */}
      <div className="text-center border-b border-primary/30 pb-4">
        <h2 className="text-2xl font-display text-primary tracking-wider">
          输入生辰
        </h2>
        <p className="text-muted-foreground text-sm mt-2">
          请准确填写阳历出生时间
        </p>
      </div>

      {/* Date Selection */}
      <div className="grid grid-cols-3 gap-4">
        {/* Year */}
        <div className="space-y-2">
          <Label className="text-foreground/80">年</Label>
          <Select
            value={formData.year.toString()}
            onValueChange={(v) => setFormData({ ...formData, year: parseInt(v) })}
          >
            <SelectTrigger className="bg-secondary border-border hover:border-primary/50 transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Month */}
        <div className="space-y-2">
          <Label className="text-foreground/80">月</Label>
          <Select
            value={formData.month.toString()}
            onValueChange={(v) => setFormData({ ...formData, month: parseInt(v) })}
          >
            <SelectTrigger className="bg-secondary border-border hover:border-primary/50 transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month} value={month.toString()}>
                  {month}月
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Day */}
        <div className="space-y-2">
          <Label className="text-foreground/80">日</Label>
          <Select
            value={formData.day.toString()}
            onValueChange={(v) => setFormData({ ...formData, day: parseInt(v) })}
          >
            <SelectTrigger className="bg-secondary border-border hover:border-primary/50 transition-colors">
              <SelectValue />
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

      {/* Time Selection */}
      <div className="grid grid-cols-2 gap-4">
        {/* Hour */}
        <div className="space-y-2">
          <Label className="text-foreground/80">时</Label>
          <Select
            value={formData.hour.toString()}
            onValueChange={(v) => setFormData({ ...formData, hour: parseInt(v) })}
          >
            <SelectTrigger className="bg-secondary border-border hover:border-primary/50 transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {hours.map((hour) => (
                <SelectItem key={hour} value={hour.toString()}>
                  {hour.toString().padStart(2, '0')}:00
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Minute */}
        <div className="space-y-2">
          <Label className="text-foreground/80">分</Label>
          <Input
            type="number"
            min={0}
            max={59}
            value={formData.minute}
            onChange={(e) => setFormData({ ...formData, minute: parseInt(e.target.value) || 0 })}
            className="bg-secondary border-border hover:border-primary/50 focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Gender Selection */}
      <div className="space-y-3">
        <Label className="text-foreground/80">性别</Label>
        <RadioGroup
          value={formData.gender}
          onValueChange={(v) => setFormData({ ...formData, gender: v as 'male' | 'female' })}
          className="flex gap-6"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="male" id="male" className="border-primary text-primary" />
            <Label htmlFor="male" className="cursor-pointer hover:text-primary transition-colors">
              乾 (男)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="female" id="female" className="border-primary text-primary" />
            <Label htmlFor="female" className="cursor-pointer hover:text-primary transition-colors">
              坤 (女)
            </Label>
          </div>
        </RadioGroup>
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
