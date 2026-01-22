/**
 * Admin Users Management Page
 * Allows super admins to view and modify user levels
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, UserLevel } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Shield, Users, Crown, Star, ArrowLeft, RefreshCw, Sparkles } from 'lucide-react';

interface UserData {
  user_id: string;
  email: string;
  display_name: string | null;
  level: UserLevel;
  ai_uses_remaining: number;
  total_calculations: number;
  created_at: string;
}

export default function AdminUsers() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserData[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  // Check if current user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user?.id) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await (supabase as any).rpc('is_admin', {
          _user_id: user.id,
        });

        if (error) throw error;
        setIsAdmin(data === true);
      } catch (err) {
        console.error('Error checking admin status:', err);
        setIsAdmin(false);
      }
      setIsLoading(false);
    };

    if (!authLoading) {
      checkAdminStatus();
    }
  }, [user?.id, authLoading]);

  // Fetch users if admin
  useEffect(() => {
    const fetchUsers = async () => {
      if (!isAdmin || !user?.id) return;

      try {
        const { data, error } = await (supabase as any).rpc('admin_get_all_users', {
          p_admin_id: user.id,
        });

        if (error) throw error;
        setUsers(data || []);
      } catch (err) {
        console.error('Error fetching users:', err);
        toast.error('获取用户列表失败');
      }
    };

    fetchUsers();
  }, [isAdmin, user?.id]);

  const handleUpdateLevel = async (targetUserId: string, newLevel: UserLevel) => {
    if (!user?.id) return;

    setUpdatingUser(targetUserId);
    try {
      const { data, error } = await (supabase as any).rpc('admin_update_user_level', {
        p_admin_id: user.id,
        p_target_user_id: targetUserId,
        p_new_level: newLevel,
      });

      if (error) throw error;

      // Update local state
      setUsers(users.map(u => 
        u.user_id === targetUserId 
          ? { ...u, level: newLevel, ai_uses_remaining: newLevel === 'level_3' ? 999 : newLevel === 'level_2' ? Math.max(u.ai_uses_remaining, 1) : u.ai_uses_remaining }
          : u
      ));

      toast.success('用户等级已更新');
    } catch (err) {
      console.error('Error updating user level:', err);
      toast.error('更新用户等级失败');
    }
    setUpdatingUser(null);
  };

  const refreshUsers = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any).rpc('admin_get_all_users', {
        p_admin_id: user.id,
      });

      if (error) throw error;
      setUsers(data || []);
      toast.success('用户列表已刷新');
    } catch (err) {
      console.error('Error fetching users:', err);
      toast.error('获取用户列表失败');
    }
    setIsLoading(false);
  };

  const getLevelBadge = (level: UserLevel) => {
    switch (level) {
      case 'level_4':
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/30"><Shield className="w-3 h-3 mr-1" />超级管理员</Badge>;
      case 'level_3':
        return <Badge className="bg-primary/20 text-primary border-primary/30"><Crown className="w-3 h-3 mr-1" />尊享会员</Badge>;
      case 'level_2':
        return <Badge className="bg-accent/20 text-accent-foreground border-accent/30"><Star className="w-3 h-3 mr-1" />高级会员</Badge>;
      default:
        return <Badge variant="secondary">普通用户</Badge>;
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">请先登录</h2>
            <p className="text-muted-foreground mb-4">需要登录才能访问管理页面</p>
            <Button onClick={() => navigate('/')}>返回首页</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-semibold mb-2">无权限访问</h2>
            <p className="text-muted-foreground mb-4">您没有管理员权限</p>
            <Button onClick={() => navigate('/')}>返回首页</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-serif text-primary flex items-center gap-2">
                <Shield className="w-6 h-6" />
                用户管理
              </h1>
              <p className="text-muted-foreground text-sm">管理用户等级和权限</p>
            </div>
          </div>
          <Button variant="outline" onClick={refreshUsers} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{users.length}</p>
                  <p className="text-sm text-muted-foreground">总用户数</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{users.filter(u => u.level === 'level_4').length}</p>
                  <p className="text-sm text-muted-foreground">超级管理员</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Crown className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{users.filter(u => u.level === 'level_3').length}</p>
                  <p className="text-sm text-muted-foreground">尊享会员</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Star className="w-8 h-8 text-accent-foreground" />
                <div>
                  <p className="text-2xl font-bold">{users.filter(u => u.level === 'level_2').length}</p>
                  <p className="text-sm text-muted-foreground">高级会员</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{users.filter(u => u.level === 'level_1').length}</p>
                  <p className="text-sm text-muted-foreground">普通用户</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>用户列表</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>用户</TableHead>
                    <TableHead>当前等级</TableHead>
                    <TableHead>AI次数</TableHead>
                    <TableHead>计算次数</TableHead>
                    <TableHead>注册时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        暂无用户数据
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((userData) => (
                      <TableRow key={userData.user_id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{userData.display_name || '未设置'}</p>
                            <p className="text-sm text-muted-foreground">{userData.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{getLevelBadge(userData.level)}</TableCell>
                        <TableCell>
                          {userData.level === 'level_4' || userData.level === 'level_3' ? (
                            <span className="text-primary">无限</span>
                          ) : (
                            userData.ai_uses_remaining
                          )}
                        </TableCell>
                        <TableCell>{userData.total_calculations}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(userData.created_at).toLocaleDateString('zh-CN')}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={userData.level}
                            onValueChange={(value) => handleUpdateLevel(userData.user_id, value as UserLevel)}
                            disabled={updatingUser === userData.user_id}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="level_1">普通用户</SelectItem>
                              <SelectItem value="level_2">高级会员</SelectItem>
                              <SelectItem value="level_3">尊享会员</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
