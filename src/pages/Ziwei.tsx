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
import { ZiweiEngine, type ZiweiInput, type ZiweiReport } from '@/utils/ziweiAlgorithm';

const PALACE_TIPS = '本页提供基础命盘宫位计算（不含主星排盘与四化飞星）。';

export default function Ziwei() {
  const [formData, setFormData] = useState<ZiweiInput>({
    year: 1990,
    month: 1,
    day: 1,
    hour: 12,
    gender: 'male',
  });
  const [report, setReport] = useState<ZiweiReport | null>(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setReport(ZiweiEngine.generateReport(formData));
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="py-6 md:py-8 border-b border-border/30">
        <div className="container max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-serif text-primary tracking-[0.2em] mb-2">
            紫微斗数
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm tracking-wider">
            Zi Wei Dou Shu Chart (Base Palaces)
          </p>
          <p className="text-muted-foreground/70 text-xs mt-3">
            {PALACE_TIPS}
          </p>
        </div>
      </header>

      <main className="flex-1 py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-4xl space-y-8">
          <div className="max-w-2xl mx-auto bg-card/50 border border-border rounded-lg p-6 md:p-8 shadow-xl shadow-black/20">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-center border-b border-primary/30 pb-4">
                <h2 className="text-2xl font-display text-primary tracking-wider">命盘输入</h2>
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
                    <h3 className="text-xl font-serif text-primary">命盘概要</h3>
                    <p className="text-muted-foreground text-sm">{PALACE_TIPS}</p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    命宫落在 <span className="text-primary font-semibold">{report.mingGong}</span> 宫位
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-secondary/30 rounded-lg p-4 space-y-2">
                    <p className="text-muted-foreground">阳历日期</p>
                    <p className="text-foreground font-medium">{report.solarDate}</p>
                    <p className="text-muted-foreground mt-3">农历日期</p>
                    <p className="text-foreground font-medium">{report.lunarDate}</p>
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
                  <h4 className="text-lg font-medium text-foreground mb-3">十二宫位排布</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {report.palaces.map((palace) => (
                      <div
                        key={palace.name}
                        className="rounded-lg border border-border/60 bg-background/60 p-3 text-sm"
                      >
                        <p className="text-muted-foreground">{palace.name}</p>
                        <p className="text-primary font-semibold mt-1">{palace.branch}宫</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
