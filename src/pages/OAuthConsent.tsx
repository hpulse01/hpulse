import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/AuthModal";
import { Button } from "@/components/ui/button";

type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: { message: string } | null }>;
};
const oauth = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const { user, isLoading: loading } = useAuth();
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!authorizationId) { setError("缺少 authorization_id"); return; }
    if (!user) return;
    let active = true;
    (async () => {
      const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) return setError(error.message);
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) { window.location.href = immediate; return; }
      setDetails(data);
    })();
    return () => { active = false; };
  }, [authorizationId, user]);

  async function decide(approve: boolean) {
    setBusy(true);
    const { data, error } = approve
      ? await oauth().approveAuthorization(authorizationId)
      : await oauth().denyAuthorization(authorizationId);
    if (error) { setBusy(false); return setError(error.message); }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) { setBusy(false); return setError("授权服务器未返回跳转地址。"); }
    window.location.href = target;
  }

  const name = details?.client?.name ?? details?.client?.client_name ?? "外部应用";

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full border border-border/40 rounded-lg p-6 space-y-4 bg-card">
        {error ? (
          <p className="text-destructive text-sm">无法加载授权请求：{error}</p>
        ) : !user && !loading ? (
          <>
            <h1 className="text-lg font-serif text-primary">请先登录</h1>
            <p className="text-sm text-muted-foreground">登录后即可授权外部应用访问你的账户。</p>
            <AuthModal open onOpenChange={() => {}} />
          </>
        ) : !details ? (
          <p className="text-sm text-muted-foreground">加载中…</p>
        ) : (
          <>
            <h1 className="text-lg font-serif text-primary">授权 {name} 连接你的账户</h1>
            <p className="text-sm text-muted-foreground">
              {name} 将以你的身份读取已保存的预测档案。
            </p>
            <div className="flex gap-3">
              <Button disabled={busy} onClick={() => decide(true)}>同意</Button>
              <Button disabled={busy} variant="outline" onClick={() => decide(false)}>拒绝</Button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
