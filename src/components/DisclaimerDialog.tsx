/**
 * Mandatory Disclaimer / Consent Dialog
 * Users MUST agree before using any prediction features.
 * Persists consent in localStorage so it only shows once per device.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Shield, Scale, BookOpen } from 'lucide-react';
import { HPulseLogo } from '@/components/brand';

const CONSENT_KEY = 'hpulse_disclaimer_accepted';
const CONSENT_VERSION = '2.0'; // sensitive-output policy + adult-only beta

export function hasConsented(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === CONSENT_VERSION;
  } catch {
    return false;
  }
}

export function setConsented(): void {
  try {
    localStorage.setItem(CONSENT_KEY, CONSENT_VERSION);
  } catch {
    // silently fail
  }
}

interface DisclaimerDialogProps {
  open: boolean;
  onAccept: () => void;
}

export function DisclaimerDialog({ open, onAccept }: DisclaimerDialogProps) {
  const [checked, setChecked] = useState(false);

  const handleAccept = () => {
    if (!checked) return;
    setConsented();
    onAccept();
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="sm:max-w-xl border-primary/30 bg-gradient-to-br from-card via-card/95 to-card/85 backdrop-blur-xl shadow-[0_20px_80px_-20px_hsl(40_65%_55%_/_0.4)]">
        {/* Decorative top hairline */}
        <div
          aria-hidden
          className="absolute top-0 left-8 right-8 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, hsl(40 65% 55% / 0.6), transparent)',
          }}
        />
        <AlertDialogHeader className="space-y-3">
          <div className="flex justify-center">
            <HPulseLogo variant="full" size="lg" tone="light" />
          </div>
          <p className="text-center text-[10px] uppercase tracking-[0.45em] text-primary/70 font-mono">
            System Disclosure
          </p>
          <AlertDialogTitle className="text-xl font-serif text-center tracking-[0.18em] text-gradient-gold">
            系统使用声明
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-xs text-muted-foreground/80 text-center font-sans leading-relaxed">
              进入 H-Pulse 多体系文化规则分析前，请确认您已理解以下条款。
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ScrollArea className="max-h-[45vh] pr-3">
          <div className="space-y-3 text-sm leading-relaxed text-foreground/80">
            <div className="p-3 rounded-lg bg-primary/[0.04] border border-primary/20">
              <div className="flex items-center gap-2 mb-1.5">
                <AlertTriangle className="w-4 h-4 text-primary flex-shrink-0" />
                <h3 className="font-serif text-foreground tracking-wider text-sm">一、系统性质</h3>
              </div>
              <p className="text-xs">
                H-Pulse 输出的是基于当前输入、当前算法版本与多种传统规则生成的文化解释。
                系统集成铁板神数、八字、紫微斗数、六爻、西方占星、吠陀、数字、玛雅、卡巴拉、
                梅花易数、奇门、大六壬、太乙等十三大体系,
                <strong className="text-primary">未经科学验证，不构成医疗、心理、法律、金融或人生决策建议</strong>。
                本产品使用经典确定性软件算法，不使用量子计算；“情景融合”只是产品内的排序模型名称。
              </p>
            </div>

            <div className="p-3 rounded-lg bg-card/40 border border-border/30">
              <div className="flex items-center gap-2 mb-1.5">
                <BookOpen className="w-4 h-4 text-primary/70 flex-shrink-0" />
                <h3 className="font-serif text-foreground tracking-wider text-sm">二、敏感结果</h3>
              </div>
              <p className="text-xs">
                公测公开端不会展示寿命、死亡年龄或死因等确定性结论。部分健康、关系与人生事件解释仍可能令人不适，
                <strong className="text-foreground/95">均不代表事实或必然结果</strong>。
                涉及健康请咨询医生，涉及法律请咨询律师，涉及心理困扰请联系专业人士。
              </p>
            </div>

            <div className="p-3 rounded-lg bg-destructive/[0.06] border border-destructive/25">
              <div className="flex items-center gap-2 mb-1.5">
                <Scale className="w-4 h-4 text-destructive flex-shrink-0" />
                <h3 className="font-serif text-foreground tracking-wider text-sm">三、责任与使用</h3>
              </div>
              <ul className="list-disc list-inside space-y-1 text-xs text-foreground/75">
                <li>系统对结果的准确性、完整性、适用性<strong>不做任何保证</strong></li>
                <li>用户基于结果做出的任何决定,<strong>后果自行承担</strong></li>
                <li>严禁用于封建迷信活动、欺骗他人或鼓励违法及伤害行为</li>
                <li>本免费公测仅向年满 18 周岁的用户开放</li>
              </ul>
            </div>
          </div>
        </ScrollArea>

        <div className="flex items-start gap-3 p-3 rounded-lg border border-primary/30 bg-primary/[0.04] mt-2">
          <Checkbox
            id="disclaimer-accept"
            checked={checked}
            onCheckedChange={(v) => setChecked(v === true)}
            className="mt-0.5 border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
          <label htmlFor="disclaimer-accept" className="text-xs text-foreground/90 cursor-pointer leading-snug select-none font-sans">
            我确认已年满 18 周岁，并已阅读
            <Link className="mx-1 text-primary underline" to="/terms">使用条款</Link>
            与<Link className="mx-1 text-primary underline" to="/privacy">隐私政策</Link>；我理解所有结果仅供文化研究、娱乐与自我反思。
          </label>
        </div>

        <AlertDialogFooter className="sm:justify-center pt-2">
          <AlertDialogAction
            onClick={handleAccept}
            disabled={!checked}
            className="w-full sm:w-auto px-10 py-5 font-serif tracking-[0.25em] disabled:opacity-40 disabled:cursor-not-allowed bg-primary hover:bg-primary/90"
          >
            我理解并进入系统
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
