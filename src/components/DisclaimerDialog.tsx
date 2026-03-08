/**
 * Mandatory Disclaimer / Consent Dialog
 * Users MUST agree before using any prediction features.
 * Persists consent in localStorage so it only shows once per device.
 */

import { useState } from 'react';
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

const CONSENT_KEY = 'hpulse_disclaimer_accepted';
const CONSENT_VERSION = '1.0'; // bump to force re-consent

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
      <AlertDialogContent className="sm:max-w-lg border-accent/40 bg-gradient-to-b from-card to-card/95">
        <AlertDialogHeader className="space-y-4">
          {/* Warning Icon */}
          <div className="mx-auto w-16 h-16 rounded-full bg-accent/10 border-2 border-accent/30 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-accent" />
          </div>

          <AlertDialogTitle className="text-xl font-serif text-center tracking-wider text-foreground">
            重要声明与免责条款
          </AlertDialogTitle>

          <AlertDialogDescription asChild>
            <div className="text-sm text-muted-foreground text-center">
              使用本应用前，请仔细阅读以下声明
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Scrollable Disclaimer Content */}
        <ScrollArea className="max-h-[50vh] pr-3">
          <div className="space-y-4 text-sm leading-relaxed text-foreground/80">
            {/* Section 1 */}
            <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-accent flex-shrink-0" />
                <h3 className="font-semibold text-foreground">一、算法性质说明</h3>
              </div>
              <p>
                本应用集成铁板神数、八字命理、紫微斗数、六爻、西方占星、吠陀占星、数字命理、玛雅历法、卡巴拉、
                梅花易数、奇门遁甲、大六壬、太乙神数等十三大命理体系。所有算法均基于传统数学模型的程序化实现，
                <strong className="text-accent">不构成任何形式的科学预测、医疗建议、投资建议或人生指导</strong>。
              </p>
            </div>

            {/* Section 2 */}
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-primary flex-shrink-0" />
                <h3 className="font-semibold text-foreground">二、结果仅供参考</h3>
              </div>
              <p>
                所有推算结果（包括但不限于命运树生成、量子坍缩路径、寿限推断、婚姻/事业/健康预测）
                均为<strong className="text-primary">基于传统命理理论的数学推演结果</strong>，
                不代表真实未来，不应作为任何重大人生决策的依据。
              </p>
            </div>

            {/* Section 3 */}
            <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
              <div className="flex items-center gap-2 mb-2">
                <Scale className="w-4 h-4 text-destructive flex-shrink-0" />
                <h3 className="font-semibold text-foreground">三、免责声明</h3>
              </div>
              <ul className="list-disc list-inside space-y-1.5 text-foreground/70">
                <li>本应用对推算结果的准确性、完整性、适用性<strong>不做任何保证</strong></li>
                <li>用户因使用本应用结果而做出的任何决定，<strong>后果自行承担</strong></li>
                <li>涉及健康问题请咨询专业医生，涉及法律问题请咨询专业律师</li>
                <li>涉及心理健康问题请联系专业心理咨询师或拨打心理援助热线</li>
                <li>本应用<strong>严禁</strong>用于封建迷信活动或欺骗他人</li>
              </ul>
            </div>

            {/* Section 4 */}
            <div className="p-3 rounded-lg bg-muted/50 border border-border/30">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <h3 className="font-semibold text-foreground">四、使用须知</h3>
              </div>
              <ul className="list-disc list-inside space-y-1.5 text-foreground/70">
                <li>本应用仅为<strong>传统文化研究与个人兴趣</strong>提供工具性辅助</li>
                <li>用户应以<strong>理性、科学</strong>的态度看待所有推算结果</li>
                <li>未满18周岁的用户应在监护人指导下使用</li>
                <li>继续使用即表示您已充分理解并同意以上全部条款</li>
              </ul>
            </div>
          </div>
        </ScrollArea>

        {/* Checkbox */}
        <div className="flex items-start gap-3 p-3 rounded-lg border border-accent/30 bg-accent/5 mt-2">
          <Checkbox
            id="disclaimer-accept"
            checked={checked}
            onCheckedChange={(v) => setChecked(v === true)}
            className="mt-0.5 border-accent/50 data-[state=checked]:bg-accent data-[state=checked]:border-accent"
          />
          <label htmlFor="disclaimer-accept" className="text-sm text-foreground cursor-pointer leading-snug select-none">
            我已仔细阅读并充分理解以上声明，了解所有推算结果<strong className="text-accent">仅供参考、不构成任何建议</strong>，
            自愿承担使用风险。
          </label>
        </div>

        <AlertDialogFooter className="sm:justify-center pt-2">
          <AlertDialogAction
            onClick={handleAccept}
            disabled={!checked}
            className="w-full sm:w-auto px-8 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            我已理解，同意并继续
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
