/**
 * Welcome Dialog Component
 * Shows welcome message for newly registered users
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
import { Star, Sparkles, Gift, CheckCircle2 } from 'lucide-react';

interface WelcomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  displayName?: string;
}

export function WelcomeDialog({ open, onOpenChange, displayName }: WelcomeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gradient-to-b from-card to-card/95 border-primary/30">
        <DialogHeader className="text-center space-y-4">
          {/* Celebration Icon */}
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center animate-in zoom-in duration-300">
            <Gift className="w-8 h-8 text-primary animate-pulse" />
          </div>
          
          <DialogTitle className="text-2xl font-serif text-primary tracking-wider">
            🎉 欢迎加入铁板神数
          </DialogTitle>
          <DialogDescription className="text-base">
            {displayName ? `${displayName}，` : ''}恭喜您成功注册！
          </DialogDescription>
        </DialogHeader>

        {/* Upgrade Notice */}
        <div className="my-4 p-4 bg-primary/10 border border-primary/20 rounded-lg space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Badge variant="outline" className="text-yellow-500 border-yellow-500/50 bg-yellow-500/10 px-3 py-1">
              <Star className="w-4 h-4 mr-1" />
              二级用户
            </Badge>
          </div>
          
          <p className="text-center text-sm text-muted-foreground">
            您已自动升级为二级用户，享有以下特权：
          </p>

          <div className="space-y-2">
            <div className="flex items-center gap-3 p-2 bg-background/50 rounded-md">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <div className="text-sm">
                <span className="font-medium text-foreground">完整铁板神数推算</span>
                <p className="text-xs text-muted-foreground">六宫命运分析、流年运势推演</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-2 bg-background/50 rounded-md">
              <Sparkles className="w-5 h-5 text-primary flex-shrink-0" />
              <div className="text-sm">
                <span className="font-medium text-foreground">AI深度解读 × 1次</span>
                <p className="text-xs text-muted-foreground">三术合参·智能命理分析</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-center">
          <Button 
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto px-8"
          >
            开始探索命运
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default WelcomeDialog;
