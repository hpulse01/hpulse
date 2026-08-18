import { useState } from 'react';
import { CheckCircle2, LogIn, Trash2 } from 'lucide-react';
import { LegalPage, LegalSection } from '@/components/legal/LegalPage';
import { Button } from '@/components/ui/button';
import { AuthModal } from '@/components/AuthModal';
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
import { useAuth } from '@/hooks/useAuth';
import { PublicSupportContact } from '@/components/legal/PublicSupportContact';

export default function AccountDeletion() {
  const { isAuthenticated, user, deleteAccount } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async () => {
    setDeleting(true);
    setError(null);
    const result = await deleteAccount();
    setDeleting(false);
    if (result.error) {
      setError('删除失败，请重新登录后重试，或联系支持邮箱。');
      return;
    }
    setConfirmOpen(false);
    setDeleted(true);
  };

  return (
    <LegalPage
      title="删除 H-Pulse 账户"
      description="永久删除 H-Pulse 账户及关联数据。"
      path="/account-deletion"
    >
      <LegalSection title="将被删除的内容">
        <p>认证账户、个人资料、账户等级、预测运行记录、引擎审计记录、真实事件回填及与账户关联的防滥用标识将被永久删除，且无法恢复。</p>
      </LegalSection>

      {deleted ? (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-5 text-emerald-300">
          <CheckCircle2 className="mb-2 h-6 w-6" />
          账户及关联数据已删除。
        </div>
      ) : isAuthenticated ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-5 space-y-4">
          <p className="text-sm">当前账户：{user?.email}</p>
          <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />永久删除账户
          </Button>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      ) : (
        <div className="rounded-lg border border-border/40 bg-card/40 p-5 space-y-4">
          <p>请先登录需要删除的账户，以验证账户所有权。</p>
          <Button onClick={() => setAuthOpen(true)}>
            <LogIn className="mr-2 h-4 w-4" />登录并继续
          </Button>
        </div>
      )}

      <LegalSection title="无法登录">
        <p>请从注册邮箱发送请求至 <PublicSupportContact className="text-primary underline" subject="H-Pulse Account Deletion" />。完成所有权验证后，我们会处理删除请求。</p>
      </LegalSection>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认永久删除？</AlertDialogTitle>
            <AlertDialogDescription>所有账户与预测数据将立即删除，无法撤销。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={remove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? '正在删除…' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </LegalPage>
  );
}
