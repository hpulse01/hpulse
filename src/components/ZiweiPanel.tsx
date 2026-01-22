import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ZiweiEngine, type ZiweiInput, type ZiweiReport } from '@/utils/ziweiAlgorithm';

const PALACE_TIPS = '基础命盘宫位计算（含命宫、身宫、十二宫位；不含主星排盘与四化飞星）。';

export function ZiweiPanel() {
  const [formData, setFormData] = useState<ZiweiInput>({
    year: 1990,
    month: 1,
    day: 1,
    hour: 12,
    gender: 'male',
  });
  const [report, setReport] = useState<ZiweiReport | null>(null);
  const { toast } = useToast();

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const candidateDate = new Date(formData.year, formData.month - 1, formData.day);
    const isValidDate =
      candidateDate.getFullYear() === formData.year &&
      candidateDate.getMonth() === formData.month - 1 &&
      candidateDate.getDate() === formData.day;

    if (!isValidDate) {
      toast({
        title: '日期无效',
        description: '请确认输入的公历日期是否存在。',
        variant: 'destructive',
      });
      return;
    }
    setReport(ZiweiEngine.generateReport(formData));
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-serif text-primary tracking-[0.2em]">紫微斗数命盘</h2>
        <p className="text-muted-foreground text-sm mt-2">{PALACE_TIPS}</p>
      </div>

      <div className="max-w-3xl mx-auto bg-card/50 border border-border rounded-lg p-6 md:p-8 shadow-xl shadow-black/20">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-center border-b border-primary/30 pb-4">
            <h3 className="text-xl font-display text-primary tracking-wider">命盘输入</h3>
            <p className="text-muted-foreground text-sm mt-2">使用阳历出生日期推算紫微命盘宫位。</p>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground/80 text-sm">出生日期</Label>
            <div className="grid grid-cols-3 gap-3">
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

          <div className="space-y-2">
            <Label className="text-foreground/80 text-sm">出生时辰（按小时）</Label>
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
          </div>

          <div className="space-y-2">
            <Label className="text-foreground/80 text-sm">性别</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={formData.gender === 'male' ? 'default' : 'outline'}
                onClick={() => setFormData({ ...formData, gender: 'male' })}
              >
                乾命 (男)
              </Button>
              <Button
                type="button"
                variant={formData.gender === 'female' ? 'default' : 'outline'}
                onClick={() => setFormData({ ...formData, gender: 'female' })}
              >
                坤命 (女)
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-6 text-lg font-serif tracking-widest"
          >
            推算命盘
          </Button>
        </form>
      </div>

      {report && (
        <section className="bg-card/60 border border-border rounded-lg p-6 md:p-8 shadow-xl shadow-black/20">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h4 className="text-xl font-serif text-primary">命盘概要</h4>
                <p className="text-muted-foreground text-sm">{PALACE_TIPS}</p>
              </div>
              <div className="text-sm text-muted-foreground space-x-3">
                <span>
                  命宫落在 <span className="text-primary font-semibold">{report.mingGong}</span>
                </span>
                <span>
                  身宫落在 <span className="text-primary font-semibold">{report.shenGong}</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-secondary/30 rounded-lg p-4 space-y-2">
                <p className="text-muted-foreground">阳历日期</p>
                <p className="text-foreground font-medium">{report.solarDate}</p>
                <p className="text-muted-foreground mt-3">农历日期</p>
                <p className="text-foreground font-medium">{report.lunarDate}</p>
                {report.isLeapMonth && (
                  <p className="text-xs text-muted-foreground/70">提示：该日期为闰月。</p>
                )}
              </div>
              <div className="bg-secondary/30 rounded-lg p-4 space-y-2">
                <p className="text-muted-foreground">干支信息</p>
                <p className="text-foreground font-medium">
                  {report.yearGanZhi}年 · {report.monthGanZhi}月 · {report.dayGanZhi}日
                </p>
                <p className="text-muted-foreground mt-3">出生时辰</p>
                <p className="text-foreground font-medium">{report.hourBranch}时</p>
              </div>
            </div>

            <div>
              <h5 className="text-lg font-medium text-foreground mb-3">十二宫位排布</h5>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {report.palaces.map((palace) => (
                  <div
                    key={palace.name}
                    className="rounded-lg border border-border/60 bg-background/60 p-3 text-sm"
                  >
                    <p className="text-muted-foreground flex items-center gap-2">
                      {palace.name}
                      {palace.isMing && (
                        <span className="rounded bg-primary/15 px-2 py-0.5 text-xs text-primary">命宫</span>
                      )}
                      {palace.isShen && (
                        <span className="rounded bg-accent/15 px-2 py-0.5 text-xs text-accent">身宫</span>
                      )}
                    </p>
                    <p className="text-primary font-semibold mt-1">{palace.branch}宫</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
