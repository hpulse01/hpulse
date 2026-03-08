/**
 * Super Admin detection hook
 * Server-side validated via RPC — never trust client state alone.
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useSuperAdmin() {
  const { user } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      if (!user?.id) {
        setIsSuperAdmin(false);
        setIsChecking(false);
        return;
      }
      try {
        const { data } = await supabase.rpc('is_super_admin', { _user_id: user.id });
        if (!cancelled) setIsSuperAdmin(data === true);
      } catch {
        if (!cancelled) setIsSuperAdmin(false);
      } finally {
        if (!cancelled) setIsChecking(false);
      }
    };
    setIsChecking(true);
    check();
    return () => { cancelled = true; };
  }, [user?.id]);

  return { isSuperAdmin, isChecking };
}
