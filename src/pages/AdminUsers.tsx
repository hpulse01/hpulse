/**
 * Admin Users Management Page
 * Allows super admins to view and modify user levels, ban, disable, delete users
 * Super admin is protected and cannot be modified by anyone
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Shield, Users, Crown, Star, ArrowLeft, RefreshCw, Ban, Power, Trash2, ShieldCheck, AlertTriangle, Gift, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type UserStatus = 'active' | 'banned' | 'disabled';

interface UserData {
  user_id: string;
  email: string;
  display_name: string | null;
  level: UserLevel;
  status: UserStatus;
  ai_uses_remaining: number;
  total_calculations: number;
  created_at: string;
  is_protected: boolean;
  temp_ai_uses: number;
  temp_ai_expires_at: string | null;
}

export default function AdminUsers() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserData[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [grantAIDialogOpen, setGrantAIDialogOpen] = useState(false);
  const [userToGrant, setUserToGrant] = useState<UserData | null>(null);
  const [grantAmount, setGrantAmount] = useState<number>(5);

  // Check if current user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user?.id) {
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        const [adminResult, superAdminResult] = await Promise.all([
          (supabase as any).rpc('is_admin', { _user_id: user.id }),
          (supabase as any).rpc('has_role', { _user_id: user.id, _role: 'super_admin' }),
        ]);

        setIsAdmin(adminResult.data === true);
        setIsSuperAdmin(superAdminResult.data === true);
      } catch (err) {
        console.error('Error checking admin status:', err);
        setIsAdmin(false);
        setIsSuperAdmin(false);
      }
      setIsLoading(false);
    };

    if (!authLoading) {
      checkAdminStatus();
    }
  }, [user?.id, authLoading]);

  // Fetch users if admin
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

  useEffect(() => {
    fetchUsers();
  }, [isAdmin, user?.id]);

  // Real-time subscription for profiles changes
  useEffect(() => {
    if (!isAdmin || !user?.id) return;

    const channel = supabase
      .channel('admin-profiles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          console.log('Profile change detected:', payload);
          // Refresh the entire list to get updated data with email
          fetchUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, user?.id]);

  const handleUpdateLevel = async (targetUserId: string, newLevel: UserLevel) => {
    if (!user?.id) return;

    setUpdatingUser(targetUserId);
    try {
      const { error } = await (supabase as any).rpc('admin_update_user_level', {
        p_admin_id: user.id,
        p_target_user_id: targetUserId,
        p_new_level: newLevel,
      });

      if (error) throw error;

      // Update local state - sync with database logic
      setUsers(users.map(u => 
        u.user_id === targetUserId 
          ? { 
              ...u, 
              level: newLevel, 
              ai_uses_remaining: newLevel === 'level_3' ? 10 : newLevel === 'level_2' ? 1 : 0 
            }
          : u
      ));

      toast.success('用户等级已更新');
    } catch (err: any) {
      console.error('Error updating user level:', err);
      toast.error(err.message || '更新用户等级失败');
    }
    setUpdatingUser(null);
  };

  const handleUpdateStatus = async (targetUserId: string, newStatus: UserStatus) => {
    if (!user?.id) return;

    setUpdatingUser(targetUserId);
    try {
      const { error } = await (supabase as any).rpc('admin_update_user_status', {
        p_admin_id: user.id,
        p_target_user_id: targetUserId,
        p_new_status: newStatus,
      });

      if (error) throw error;

      // Update local state
      setUsers(users.map(u => 
        u.user_id === targetUserId ? { ...u, status: newStatus } : u
      ));

      const statusLabels: Record<UserStatus, string> = {
        active: '已激活',
        banned: '已封禁',
        disabled: '已停用',
      };
      toast.success(`用户${statusLabels[newStatus]}`);
    } catch (err: any) {
      console.error('Error updating user status:', err);
      toast.error(err.message || '更新用户状态失败');
    }
    setUpdatingUser(null);
  };

  const handleDeleteUser = async () => {
    if (!user?.id || !userToDelete) return;

    setUpdatingUser(userToDelete.user_id);
    try {
      const { error } = await (supabase as any).rpc('admin_delete_user', {
        p_admin_id: user.id,
        p_target_user_id: userToDelete.user_id,
      });

      if (error) throw error;

      // Remove from local state
      setUsers(users.filter(u => u.user_id !== userToDelete.user_id));
      toast.success('用户已删除');
    } catch (err: any) {
      console.error('Error deleting user:', err);
      toast.error(err.message || '删除用户失败');
    }
    setUpdatingUser(null);
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const handleGrantTempAI = async () => {
    if (!user?.id || !userToGrant || grantAmount <= 0) return;

    setUpdatingUser(userToGrant.user_id);
    try {
      const { error } = await (supabase as any).rpc('admin_grant_temp_ai_uses', {
        p_admin_id: user.id,
        p_target_user_id: userToGrant.user_id,
        p_uses: grantAmount,
      });

      if (error) throw error;

      // Calculate new expiration (3 days from now)
      const newExpiration = new Date();
      newExpiration.setDate(newExpiration.getDate() + 3);

      // Update local state
      setUsers(users.map(u => 
        u.user_id === userToGrant.user_id 
          ? { 
              ...u, 
              temp_ai_uses: (u.temp_ai_uses || 0) + grantAmount,
              temp_ai_expires_at: u.temp_ai_expires_at && new Date(u.temp_ai_expires_at) > new Date() 
                ? u.temp_ai_expires_at 
                : newExpiration.toISOString()
            }
          : u
      ));

      toast.success(`已为 ${userToGrant.display_name || userToGrant.email} 增加 ${grantAmount} 次临时AI次数（3天有效期）`);
    } catch (err: any) {
      console.error('Error granting temp AI uses:', err);
      toast.error(err.message || '增加临时AI次数失败');
    }
    setUpdatingUser(null);
    setGrantAIDialogOpen(false);
    setUserToGrant(null);
    setGrantAmount(5);
  };

  const refreshUsers = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    await fetchUsers();
    toast.success('用户列表已刷新');
    setIsLoading(false);
  };

  const getLevelBadge = (level: UserLevel) => {
    switch (level) {
      case 'level_4':
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/30"><Shield className="w-3 h-3 mr-1" />超级管理员</Badge>;
      case 'level_3':
        return <Badge className="bg-primary/20 text-primary border-primary/30"><Crown className="w-3 h-3 mr-1" />尊享会员</Badge>;
      case 'level_2':
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30"><Star className="w-3 h-3 mr-1" />高级会员</Badge>;
      default:
        return <Badge variant="secondary">普通用户</Badge>;
    }
  };

  const getStatusBadge = (status: UserStatus) => {
    switch (status) {
      case 'banned':
        return <Badge variant="destructive"><Ban className="w-3 h-3 mr-1" />已封禁</Badge>;
      case 'disabled':
        return <Badge variant="outline" className="text-orange-500 border-orange-500/50"><Power className="w-3 h-3 mr-1" />已停用</Badge>;
      default:
        return <Badge variant="outline" className="text-green-500 border-green-500/50"><ShieldCheck className="w-3 h-3 mr-1" />正常</Badge>;
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
                {isSuperAdmin && (
                  <Badge className="ml-2 bg-red-500/20 text-red-500 text-xs">超级管理员</Badge>
                )}
              </h1>
              <p className="text-muted-foreground text-sm">管理用户等级、状态和权限</p>
            </div>
          </div>
          <Button variant="outline" onClick={refreshUsers} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-primary" />
                <div>
                  <p className="text-xl font-bold">{users.length}</p>
                  <p className="text-xs text-muted-foreground">总用户</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-red-500" />
                <div>
                  <p className="text-xl font-bold">{users.filter(u => u.level === 'level_4').length}</p>
                  <p className="text-xs text-muted-foreground">超管</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Crown className="w-6 h-6 text-primary" />
                <div>
                  <p className="text-xl font-bold">{users.filter(u => u.level === 'level_3').length}</p>
                  <p className="text-xs text-muted-foreground">尊享</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Star className="w-6 h-6 text-yellow-500" />
                <div>
                  <p className="text-xl font-bold">{users.filter(u => u.level === 'level_2').length}</p>
                  <p className="text-xs text-muted-foreground">高级</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Ban className="w-6 h-6 text-destructive" />
                <div>
                  <p className="text-xl font-bold">{users.filter(u => u.status === 'banned').length}</p>
                  <p className="text-xs text-muted-foreground">封禁</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Power className="w-6 h-6 text-orange-500" />
                <div>
                  <p className="text-xl font-bold">{users.filter(u => u.status === 'disabled').length}</p>
                  <p className="text-xs text-muted-foreground">停用</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              用户列表
              <span className="text-sm font-normal text-muted-foreground">
                (带 <Shield className="w-3 h-3 inline text-red-500" /> 标记的用户不可修改)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>用户</TableHead>
                    <TableHead>等级</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>AI次数</TableHead>
                    <TableHead>注册时间</TableHead>
                    <TableHead>修改等级</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        暂无用户数据
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((userData) => (
                      <TableRow key={userData.user_id} className={userData.is_protected ? 'bg-red-500/5' : ''}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {userData.is_protected && (
                              <Shield className="w-4 h-4 text-red-500 flex-shrink-0" />
                            )}
                            <div>
                              <p className="font-medium">{userData.display_name || '未设置'}</p>
                              <p className="text-sm text-muted-foreground">{userData.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getLevelBadge(userData.level)}</TableCell>
                        <TableCell>{getStatusBadge(userData.status)}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {userData.level === 'level_4' ? (
                              <span className="text-primary">无限</span>
                            ) : userData.level === 'level_3' ? (
                              <span className="text-primary">{userData.ai_uses_remaining}/周</span>
                            ) : (
                              <span>{userData.ai_uses_remaining}</span>
                            )}
                            {/* Show temporary AI uses if active */}
                            {userData.temp_ai_uses > 0 && userData.temp_ai_expires_at && (
                              <div className="flex items-center gap-1 text-xs">
                                <Gift className="w-3 h-3 text-primary" />
                                <span className="text-primary">+{userData.temp_ai_uses}临时</span>
                                <Clock className="w-3 h-3 text-muted-foreground ml-1" />
                                <span className="text-muted-foreground">
                                  {new Date(userData.temp_ai_expires_at).toLocaleDateString('zh-CN')}
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(userData.created_at).toLocaleDateString('zh-CN')}
                        </TableCell>
                        <TableCell>
                          {userData.is_protected ? (
                            <span className="text-xs text-muted-foreground">不可修改</span>
                          ) : (
                            <Select
                              value={userData.level}
                              onValueChange={(value) => handleUpdateLevel(userData.user_id, value as UserLevel)}
                              disabled={updatingUser === userData.user_id}
                            >
                              <SelectTrigger className="w-28">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="level_1">普通用户</SelectItem>
                                <SelectItem value="level_2">高级会员</SelectItem>
                                <SelectItem value="level_3">尊享会员</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                        <TableCell>
                          {userData.is_protected ? (
                            <span className="text-xs text-muted-foreground">受保护</span>
                          ) : (
                            <div className="flex gap-1">
                              {userData.status === 'active' ? (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-orange-500 hover:text-orange-600 hover:bg-orange-500/10"
                                    onClick={() => handleUpdateStatus(userData.user_id, 'disabled')}
                                    disabled={updatingUser === userData.user_id}
                                    title="停用账号"
                                  >
                                    <Power className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleUpdateStatus(userData.user_id, 'banned')}
                                    disabled={updatingUser === userData.user_id}
                                    title="封禁账号"
                                  >
                                    <Ban className="w-4 h-4" />
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                                  onClick={() => handleUpdateStatus(userData.user_id, 'active')}
                                  disabled={updatingUser === userData.user_id}
                                  title="激活账号"
                                >
                                  <ShieldCheck className="w-4 h-4" />
                                </Button>
                              )}
                              {isSuperAdmin && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                                    onClick={() => {
                                      setUserToGrant(userData);
                                      setGrantAIDialogOpen(true);
                                    }}
                                    disabled={updatingUser === userData.user_id}
                                    title="增加临时AI次数"
                                  >
                                    <Gift className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => {
                                      setUserToDelete(userData);
                                      setDeleteDialogOpen(true);
                                    }}
                                    disabled={updatingUser === userData.user_id}
                                    title="删除用户"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                确认删除用户
              </AlertDialogTitle>
              <AlertDialogDescription>
                您确定要删除用户 <strong>{userToDelete?.display_name || userToDelete?.email}</strong> 吗？
                <br />
                此操作不可撤销，将永久删除该用户的所有数据。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteUser}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                确认删除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Grant Temporary AI Uses Dialog */}
        <Dialog open={grantAIDialogOpen} onOpenChange={setGrantAIDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-primary">
                <Gift className="w-5 h-5" />
                增加临时AI次数
              </DialogTitle>
              <DialogDescription>
                为用户 <strong>{userToGrant?.display_name || userToGrant?.email}</strong> 增加临时AI解读次数，有效期3天。
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium mb-2 block">增加次数</label>
              <Input
                type="number"
                min={1}
                max={100}
                value={grantAmount}
                onChange={(e) => setGrantAmount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-2">
                临时次数将优先于常规次数消耗，过期后自动清除
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setGrantAIDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleGrantTempAI} disabled={updatingUser === userToGrant?.user_id}>
                确认增加
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}