/**
 * Welcome Dialog Component
 * Shows welcome message for newly registered users with membership privileges
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Sparkles, Gift, CheckCircle2, Crown, Zap, BookOpen, Calculator } from 'lucide-react';

interface WelcomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  displayName?: string;
}

export function WelcomeDialog({ open, onOpenChange, displayName }: WelcomeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-gradient-to-b from-card to-card/95 border-primary/30 z-50" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader className="text-center space-y-4">
          {/* Celebration Icon */}
          <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 via-yellow-500/20 to-primary/5 flex items-center justify-center animate-in zoom-in duration-300">
            <Gift className="w-10 h-10 text-primary animate-pulse" />
          </div>
          
          <DialogTitle className="text-2xl font-serif text-primary tracking-wider">
            🎉 欢迎加入铁板神数
          </DialogTitle>
          <DialogDescription className="text-base">
            {displayName ? `${displayName}，` : ''}恭喜您成功注册！
          </DialogDescription>
        </DialogHeader>

        {/* Upgrade Notice */}
        <div className="my-4 p-4 bg-gradient-to-br from-primary/10 to-yellow-500/10 border border-primary/20 rounded-lg space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Badge variant="outline" className="text-yellow-500 border-yellow-500/50 bg-yellow-500/10 px-4 py-1.5 text-sm">
              <Star className="w-4 h-4 mr-1.5" />
              高级会员
            </Badge>
          </div>
          
          <p className="text-center text-sm text-muted-foreground">
            您已自动升级为高级会员，享有以下特权：
          </p>

          <div className="space-y-3">
            {/* Feature 1: Full Calculation */}
            <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg border border-border/50">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Calculator className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">完整铁板神数推算</span>
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  六宫命运分析、流年运势推演、家庭关系预测
                </p>
              </div>
            </div>
            
            {/* Feature 2: AI Interpretation */}
            <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg border border-primary/30">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-yellow-500/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">AI深度解读</span>
                  <Badge className="bg-primary/20 text-primary text-xs px-2">× 1次</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  三术合参智能命理分析，解读您的命运密码
                </p>
              </div>
            </div>

            {/* Feature 3: Detailed Report */}
            <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg border border-border/50">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">详细命理报告</span>
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  获取完整的六宫条文解读和人生指引
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Upgrade Hint */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Crown className="w-4 h-4 text-primary" />
          <span>升级尊享会员可获得每周10次AI解读额度</span>
          <Zap className="w-4 h-4 text-yellow-500" />
        </div>

        <DialogFooter className="sm:justify-center pt-2">
          <Button 
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto px-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            开始探索命运
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default WelcomeDialog;
