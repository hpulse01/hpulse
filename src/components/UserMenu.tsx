/**
 * User Menu Component
 * Shows user status, login button, or user dropdown
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth, UserLevel } from '@/hooks/useAuth';
import { AuthModal, UserLevelBadge } from '@/components/AuthModal';
import { supabase } from '@/integrations/supabase/client';
import { 
  User, LogOut, Sparkles, Crown, Star, ChevronDown, Shield, Settings
} from 'lucide-react';

export function UserMenu() {
  const { user, profile, isAuthenticated, isLoading, signOut, canUseAI } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  // Check admin status
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user?.id) {
        setIsAdmin(false);
        return;
      }
      try {
        const { data } = await (supabase as any).rpc('is_admin', { _user_id: user.id });
        setIsAdmin(data === true);
      } catch {
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="w-20 h-9 bg-secondary/30 animate-pulse rounded" />
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowAuthModal(true)}
          className="border-primary/30 hover:border-primary hover:bg-primary/10"
        >
          <User className="w-4 h-4 mr-2" />
          登录
        </Button>
        <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
      </>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="border-primary/30 hover:border-primary hover:bg-primary/10"
        >
          {profile?.level === 'level_4' && <Shield className="w-4 h-4 mr-1 text-red-500" />}
          {profile?.level !== 'level_4' && <User className="w-4 h-4 mr-2" />}
          {profile?.display_name || user?.email?.split('@')[0] || '用户'}
          <ChevronDown className="w-3 h-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-card border-primary/20">
        <DropdownMenuLabel className="flex flex-col gap-1">
          <span className="font-normal text-muted-foreground text-xs">
            {user?.email}
          </span>
          {profile && <UserLevelBadge level={profile.level} />}
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <div className="px-2 py-2 text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-muted-foreground">AI解读权限</span>
            {canUseAI ? (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                可用
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground text-xs">
                不可用
              </Badge>
            )}
          </div>
          {profile?.level === 'level_2' && (
            <div className="text-muted-foreground">
              剩余次数: {profile.ai_uses_remaining}
            </div>
          )}
          {profile?.level === 'level_3' && (
            <div className="text-muted-foreground">
              本周剩余: {profile.ai_uses_remaining}/10
            </div>
          )}
          {profile?.level === 'level_4' && (
            <div className="text-primary flex items-center gap-1">
              <Crown className="w-3 h-3" />
              无限使用
            </div>
          )}
        </div>
        
        <DropdownMenuSeparator />
        
        {isAdmin && (
          <>
            <DropdownMenuItem 
              onClick={() => navigate('/admin-users')}
              className="cursor-pointer"
            >
              <Settings className="w-4 h-4 mr-2" />
              用户管理
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        
        <DropdownMenuItem 
          onClick={() => signOut()}
          className="text-destructive focus:text-destructive cursor-pointer"
        >
          <LogOut className="w-4 h-4 mr-2" />
          退出登录
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default UserMenu;
