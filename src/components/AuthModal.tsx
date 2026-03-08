/**
 * Authentication Modal Component
 * Login and Register forms
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth, UserLevel } from '@/hooks/useAuth';
import { Loader2, LogIn, UserPlus, Crown, Star, User, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { WelcomeDialog } from './WelcomeDialog';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LEVEL_CONFIG: Record<UserLevel, { label: string; icon: typeof User; color: string; description: string }> = {
  level_1: { 
    label: '一级用户', 
    icon: User, 
    color: 'text-muted-foreground border-muted',
    description: '基础功能' 
  },
  level_2: { 
    label: '二级用户', 
    icon: Star, 
    color: 'text-yellow-500 border-yellow-500/50',
    description: 'AI解读 x 1次' 
  },
  level_3: { 
    label: '三级用户', 
    icon: Crown, 
    color: 'text-primary border-primary/50',
    description: 'AI解读 10次/周' 
  },
  level_4: { 
    label: '超级管理员', 
    icon: Shield, 
    color: 'text-red-500 border-red-500/50',
    description: '最高权限' 
  },
};

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const { signIn, signUp, isLoading } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [registeredName, setRegisteredName] = useState('');
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await signIn(email, password);
    
    if (error) {
      toast({
        title: '登录失败',
        description: error.message || '请检查邮箱和密码',
        variant: 'destructive',
      });
    } else {
      toast({
        title: '登录成功',
        description: '欢迎回来！',
      });
      onOpenChange(false);
      resetForm();
    }
    
    setIsSubmitting(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (password.length < 6) {
      toast({
        title: '密码太短',
        description: '密码至少需要6个字符',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    const { error } = await signUp(email, password, displayName);
    
    if (error) {
      toast({
        title: '注册失败',
        description: error.message || '请稍后重试',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    } else {
      // Store name for welcome dialog
      setRegisteredName(displayName || email.split('@')[0]);
      // Close auth modal first
      onOpenChange(false);
      resetForm();
      setIsSubmitting(false);
      // Show welcome dialog after auth modal animation completes
      setTimeout(() => {
        setShowWelcome(true);
      }, 400);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md glass-elevated border-primary/20 z-50" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-serif text-gradient-gold tracking-[0.15em]">
            H-Pulse
          </DialogTitle>
          <DialogDescription className="text-muted-foreground/70 text-xs tracking-widest uppercase mt-1">
            Quantum Destiny Prediction · 登录解锁高级功能
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'register')}>
          <TabsList className="grid w-full grid-cols-2 bg-card/60 border border-border/30 h-auto p-1 rounded-xl">
            <TabsTrigger value="login" className="font-sans text-xs tracking-wider rounded-lg data-[state=active]:bg-primary/15 data-[state=active]:text-primary py-2.5">
              <LogIn className="w-4 h-4 mr-2" />
              登录
            </TabsTrigger>
            <TabsTrigger value="register" className="font-sans text-xs tracking-wider rounded-lg data-[state=active]:bg-primary/15 data-[state=active]:text-primary py-2.5">
              <UserPlus className="w-4 h-4 mr-2" />
              注册
            </TabsTrigger>
          </TabsList>

          {/* Login Form */}
          <TabsContent value="login" className="mt-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">邮箱</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-secondary/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">密码</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-secondary/30"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4 mr-2" />
                )}
                登录
              </Button>
            </form>
          </TabsContent>

          {/* Register Form */}
          <TabsContent value="register" className="mt-4">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-name">昵称</Label>
                <Input
                  id="register-name"
                  type="text"
                  placeholder="您的昵称"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="bg-secondary/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-email">邮箱</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-secondary/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password">密码</Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="至少6个字符"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="bg-secondary/30"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                注册
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        {/* Level Info */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground text-center mb-3">会员等级说明</p>
          <div className="space-y-2">
            {Object.entries(LEVEL_CONFIG).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <div key={key} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${config.color}`} />
                    <span className={config.color}>{config.label}</span>
                  </div>
                  <span className="text-muted-foreground">{config.description}</span>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
    
    {/* Welcome Dialog for new registrations */}
    <WelcomeDialog 
      open={showWelcome} 
      onOpenChange={setShowWelcome}
      displayName={registeredName}
    />
  </>
  );
}

export function UserLevelBadge({ level }: { level: UserLevel }) {
  const config = LEVEL_CONFIG[level];
  const Icon = config.icon;
  
  return (
    <Badge variant="outline" className={`${config.color} bg-transparent`}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
}

export default AuthModal;
