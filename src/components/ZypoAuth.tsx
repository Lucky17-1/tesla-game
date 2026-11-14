import { useState, type FormEvent } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ZypoAuth({ title = 'Log in to Zypo' }: { title?: string }) {
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    const res = mode === 'in'
      ? await supabase.auth.signInWithPassword({ email, password: pw })
      : await supabase.auth.signUp({ email, password: pw, options: { emailRedirectTo: `${window.location.origin}/zypo` } });
    setBusy(false);
    if (res.error) setMsg(res.error.message);
    else if (mode === 'up' && !res.data.session) setMsg('Check your email to confirm your account.');
  }

  async function google() {
    setMsg('');
    const res = await lovable.auth.signInWithOAuth('google', { redirect_uri: `${window.location.origin}/zypo` });
    if (res?.error) setMsg('Google login failed. Please try again or use email.');
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-border bg-card p-5 space-y-3">
      <h2 className="font-semibold">{mode === 'in' ? title : 'Create your Zypo account'}</h2>
      <Input type="email" required placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <Input type="password" required minLength={6} placeholder="Password" value={pw} onChange={e => setPw(e.target.value)} />
      <Button type="submit" className="w-full" disabled={busy}>{busy ? 'Please wait…' : mode === 'in' ? 'Log in' : 'Sign up'}</Button>
      <Button type="button" variant="outline" className="w-full" onClick={google}>Continue with Google</Button>
      {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
      <button type="button" className="text-sm text-primary underline" onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>
        {mode === 'in' ? 'New here? Sign up' : 'Have an account? Log in'}
      </button>
    </form>
  );
}
