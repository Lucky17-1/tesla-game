import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

const SessionContext = createContext<{ user: User | null; ready: boolean }>({ user: null, ready: false });
export const useZypoSession = () => useContext(SessionContext);
export function ZypoSession({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const client = useQueryClient();
  const router = useRouter();
  useEffect(() => {
    let alive = true;
    void supabase.auth.getUser().then(({ data }) => { if (alive) { setUser(data.user); setReady(true); } }).catch(() => { if (alive) setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!['INITIAL_SESSION', 'SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED'].includes(event)) return;
      setUser(session?.user ?? null); setReady(true);
      if (event === 'SIGNED_OUT') { void client.cancelQueries(); client.removeQueries({ queryKey: ['zypo-private'] }); }
      if (event !== 'INITIAL_SESSION') { void router.invalidate(); if (event !== 'SIGNED_OUT') void client.invalidateQueries(); }
    });
    return () => { alive = false; data.subscription.unsubscribe(); };
  }, [client, router]);
  return <SessionContext.Provider value={{ user, ready }}>{children}</SessionContext.Provider>;
}