import { createFileRoute } from '@tanstack/react-router';
import { queryOptions, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { ZypoSession, useZypoSession } from '@/components/ZypoSession';
import { getZypoFeed, type ZypoPost } from '@/lib/zypo.functions';
import { commentSchema, mediaError, profileSchema } from '@/lib/zypo-rules';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const feedQuery = queryOptions({ queryKey: ['zypo-feed'], queryFn: () => getZypoFeed({ data: {} }) });

export const Route = createFileRoute('/zypo')({
  head: () => ({
    meta: [
      { title: 'Zypo — share photos and videos' },
      { name: 'description', content: 'Zypo: share photos and videos, like, comment and follow friends.' },
      { property: 'og:title', content: 'Zypo — share photos and videos' },
      { property: 'og:description', content: 'Share photos and videos, like, comment and follow friends on Zypo.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
    ],
    links: [{ rel: 'manifest', href: '/manifest.webmanifest' }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(feedQuery),
  component: () => <ZypoSession><ZypoApp /></ZypoSession>,
});

function ZypoApp() {
  const { user, ready } = useZypoSession();
  const { data } = useSuspenseQuery(feedQuery);
  const me = user ? data.profiles.find(p => p.id === user.id) : undefined;
  return (
    <main className="mx-auto max-w-xl px-4 py-8 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary">Zypo</h1>
        {user && <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()}>Sign out</Button>}
      </header>
      {ready && !user && <AuthBox />}
      {user && !me && <ProfileSetup userId={user.id} />}
      {user && me && <Composer userId={user.id} />}
      <section className="space-y-6">
        {data.posts.length === 0 && <p className="text-muted-foreground text-center py-10">No posts yet. Be the first to share!</p>}
        {data.posts.map(p => <PostCard key={p.id} post={p} />)}
      </section>
    </main>
  );
}

function AuthBox() {
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState(''); const [pw, setPw] = useState('');
  const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setMsg('');
    const res = mode === 'in'
      ? await supabase.auth.signInWithPassword({ email, password: pw })
      : await supabase.auth.signUp({ email, password: pw, options: { emailRedirectTo: `${window.location.origin}/zypo` } });
    setBusy(false);
    if (res.error) setMsg(res.error.message);
    else if (mode === 'up' && !res.data.session) setMsg('Check your email to confirm your account.');
  }
  return (
    <form onSubmit={submit} className="rounded-xl border border-border bg-card p-5 space-y-3">
      <h2 className="font-semibold">{mode === 'in' ? 'Log in to Zypo' : 'Create your Zypo account'}</h2>
      <Input type="email" required placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <Input type="password" required minLength={6} placeholder="Password" value={pw} onChange={e => setPw(e.target.value)} />
      <Button type="submit" className="w-full" disabled={busy}>{mode === 'in' ? 'Log in' : 'Sign up'}</Button>
      <Button type="button" variant="outline" className="w-full" onClick={() => lovable.auth.signInWithOAuth('google', { redirect_uri: `${window.location.origin}/zypo` })}>Continue with Google</Button>
      {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
      <button type="button" className="text-sm text-primary underline" onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>
        {mode === 'in' ? 'New here? Sign up' : 'Have an account? Log in'}
      </button>
    </form>
  );
}

function ProfileSetup({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const [username, setUsername] = useState(''); const [name, setName] = useState(''); const [err, setErr] = useState('');
  async function save(e: FormEvent) {
    e.preventDefault();
    const parsed = profileSchema.safeParse({ username, display_name: name, bio: '' });
    if (!parsed.success) return setErr(parsed.error.issues[0]?.message ?? 'Invalid');
    const { error } = await supabase.from('profiles').insert({ id: userId, ...parsed.data });
    if (error) return setErr(error.message.includes('duplicate') ? 'That username is taken.' : 'Could not save profile.');
    await qc.invalidateQueries({ queryKey: ['zypo-feed'] });
  }
  return (
    <form onSubmit={save} className="rounded-xl border border-border bg-card p-5 space-y-3">
      <h2 className="font-semibold">Choose your username</h2>
      <Input placeholder="username" value={username} onChange={e => setUsername(e.target.value)} />
      <Input placeholder="Display name" value={name} onChange={e => setName(e.target.value)} />
      {err && <p className="text-sm text-destructive">{err}</p>}
      <Button type="submit">Save</Button>
    </form>
  );
}

function Composer({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null); const [caption, setCaption] = useState('');
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  async function share(e: FormEvent) {
    e.preventDefault(); if (!file) return setErr('Choose a photo or video.');
    const bad = mediaError(file); if (bad) return setErr(bad);
    setBusy(true); setErr('');
    const path = `${userId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const up = await supabase.storage.from('zypo-media').upload(path, file, { contentType: file.type });
    if (up.error) { setBusy(false); return setErr('Upload failed. Please try again.'); }
    const { error } = await supabase.from('zypo_posts').insert({ user_id: userId, caption: caption.slice(0, 2200), media_path: path, media_type: file.type.startsWith('video') ? 'video' : 'image', kind: 'post' });
    setBusy(false);
    if (error) return setErr('Could not publish post.');
    setFile(null); setCaption(''); await qc.invalidateQueries({ queryKey: ['zypo-feed'] });
  }
  return (
    <form onSubmit={share} className="rounded-xl border border-border bg-card p-4 space-y-3">
      <Input type="file" accept="image/*,video/*" onChange={e => setFile(e.target.files?.[0] ?? null)} />
      <Textarea placeholder="Write a caption…" value={caption} onChange={e => setCaption(e.target.value)} maxLength={2200} />
      {err && <p className="text-sm text-destructive">{err}</p>}
      <Button type="submit" disabled={busy}>{busy ? 'Sharing…' : 'Share'}</Button>
    </form>
  );
}

function PostCard({ post }: { post: ZypoPost }) {
  const { data } = useSuspenseQuery(feedQuery);
  const { user } = useZypoSession();
  const qc = useQueryClient();
  const [text, setText] = useState('');
  const author = data.profiles.find(p => p.id === post.user_id);
  const likes = data.likes.filter(l => l.post_id === post.id);
  const liked = !!user && likes.some(l => l.user_id === user.id);
  const comments = data.comments.filter(c => c.post_id === post.id);
  const src = data.media[post.media_path];
  const refresh = () => qc.invalidateQueries({ queryKey: ['zypo-feed'] });
  async function toggleLike() {
    if (!user) return;
    if (liked) await supabase.from('zypo_likes').delete().eq('post_id', post.id).eq('user_id', user.id);
    else await supabase.from('zypo_likes').insert({ post_id: post.id, user_id: user.id });
    await refresh();
  }
  async function comment(e: FormEvent) {
    e.preventDefault(); if (!user) return;
    const body = commentSchema.safeParse(text); if (!body.success) return;
    await supabase.from('zypo_comments').insert({ post_id: post.id, user_id: user.id, body: body.data });
    setText(''); await refresh();
  }
  return (
    <article className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 font-semibold">@{author?.username ?? 'user'}</div>
      {src && (post.media_type === 'video'
        ? <video src={src} controls playsInline className="w-full bg-muted" />
        : <img src={src} alt={post.caption || 'Zypo post'} className="w-full object-cover" loading="lazy" />)}
      <div className="p-4 space-y-2">
        <button onClick={toggleLike} disabled={!user} className="text-sm font-medium">{liked ? '♥' : '♡'} {likes.length} likes</button>
        {post.caption && <p className="text-sm"><b>@{author?.username}</b> {post.caption}</p>}
        {comments.map(c => <p key={c.id} className="text-sm"><b>@{data.profiles.find(p => p.id === c.user_id)?.username ?? 'user'}</b> {c.body}</p>)}
        {user && <form onSubmit={comment} className="flex gap-2"><Input placeholder="Add a comment…" value={text} onChange={e => setText(e.target.value)} /><Button type="submit" size="sm">Post</Button></form>}
      </div>
    </article>
  );
}
