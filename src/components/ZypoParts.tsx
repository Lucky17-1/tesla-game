import { useEffect, useState, type FormEvent } from 'react';
import { Link } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Bookmark, Heart, MessageCircle, Send, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { uploadMedia } from '@/lib/zypo-data';
import { commentSchema, mediaError, postSchema } from '@/lib/zypo-rules';
import type { ZypoFeed, ZypoPost, ZypoProfile } from '@/lib/zypo.functions';
import { useZypoSession } from '@/components/ZypoSession';

export function profileOf(feed: ZypoFeed, id: string | undefined) {
  return feed.profiles.find(p => p.id === id);
}

export function ZypoAvatar({ profile, media, size = 36 }: { profile?: ZypoProfile | undefined; media: Record<string, string>; size?: number | undefined }) {
  const src = profile?.avatar_path ? media[profile.avatar_path] : undefined;
  if (src) return <img src={src} alt="" width={size} height={size} className="rounded-full object-cover" style={{ width: size, height: size }} />;
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-primary/15 font-semibold text-primary"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {(profile?.username ?? profile?.display_name ?? '?').slice(0, 1).toUpperCase()}
    </span>
  );
}

export function ZypoMedia({ post, media, className = 'w-full' }: { post: ZypoPost; media: Record<string, string>; className?: string | undefined }) {
  const src = media[post.media_path];
  if (!src) return <div className={`${className} aspect-square bg-muted`} />;
  if (post.media_type === 'video') {
    return (
      <video
        src={src}
        controls
        playsInline
        muted={post.kind === 'reel'}
        loop={post.kind === 'reel'}
        className={`${className} bg-black`}
        style={post.kind === 'reel' ? { maxHeight: '78vh', objectFit: 'contain' } : undefined}
      />
    );
  }
  return <img src={src} alt={post.caption || 'Zypo post'} className={`${className} object-cover`} loading="lazy" />;
}

export function ZypoComposer({ userId, kind = 'post' }: { userId: string; kind?: 'post' | 'story' | 'reel' | undefined }) {
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const label = kind === 'story' ? 'Add to your story' : kind === 'reel' ? 'Share a reel' : 'Share a post';

  async function share(e: FormEvent) {
    e.preventDefault();
    if (!file) return setErr('Choose a photo or video.');
    const bad = mediaError(file);
    if (bad) return setErr(bad);
    const parsed = postSchema.safeParse({ caption: caption.slice(0, 2200), kind });
    if (!parsed.success) return setErr('That caption is too long.');
    setBusy(true);
    setErr('');
    try {
      const uploaded = await uploadMedia(file, userId);
      const { error } = await supabase.from('zypo_posts').insert({
        user_id: userId,
        caption: parsed.data.caption,
        media_path: uploaded.path,
        media_type: uploaded.type,
        kind: parsed.data.kind,
      });
      if (error) throw new Error('Could not publish.');
      setFile(null);
      setCaption('');
      await qc.invalidateQueries({ queryKey: ['zypo-feed'] });
    } catch {
      setErr('Could not publish. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={share} className="rounded-xl border border-border bg-card p-4 space-y-3">
      <Input type="file" accept="image/*,video/*" onChange={e => setFile(e.target.files?.[0] ?? null)} />
      {kind !== 'story' && <Textarea placeholder="Write a caption…" value={caption} onChange={e => setCaption(e.target.value)} maxLength={2200} />}
      {err && <p className="text-sm text-destructive">{err}</p>}
      <Button type="submit" disabled={busy} className="w-full">{busy ? 'Sharing…' : label}</Button>
    </form>
  );
}

export function ZypoPostCard({ post, feed }: { post: ZypoPost; feed: ZypoFeed }) {
  const { user } = useZypoSession();
  const qc = useQueryClient();
  const [text, setText] = useState('');
  const author = profileOf(feed, post.user_id);
  const likes = feed.likes.filter(l => l.post_id === post.id);
  const liked = !!user && likes.some(l => l.user_id === user.id);
  const comments = feed.comments.filter(c => c.post_id === post.id);
  const refresh = () => qc.invalidateQueries({ queryKey: ['zypo-feed'] });

  async function toggleLike() {
    if (!user) return;
    if (liked) await supabase.from('zypo_likes').delete().eq('post_id', post.id).eq('user_id', user.id);
    else await supabase.from('zypo_likes').insert({ post_id: post.id, user_id: user.id });
    await refresh();
  }

  async function comment(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    const body = commentSchema.safeParse(text);
    if (!body.success) return;
    await supabase.from('zypo_comments').insert({ post_id: post.id, user_id: user.id, body: body.data });
    setText('');
    await refresh();
  }

  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card">
      <header className="flex items-center gap-3 px-4 py-3">
        <ZypoAvatar profile={author} media={feed.media} />
        <Link to="/zypo/profile/$username" params={{ username: author?.username ?? '' }} className="font-semibold hover:text-primary">
          @{author?.username ?? 'user'}
        </Link>
      </header>
      <ZypoMedia post={post} media={feed.media} />
      <div className="space-y-2 p-4">
        <div className="flex items-center gap-4">
          <button onClick={toggleLike} disabled={!user} aria-pressed={liked} className="flex items-center gap-1 text-sm font-medium disabled:opacity-50">
            <Heart className={`h-5 w-5 ${liked ? 'fill-destructive text-destructive' : ''}`} /> {likes.length}
          </button>
          <span className="flex items-center gap-1 text-sm text-muted-foreground"><MessageCircle className="h-5 w-5" /> {comments.length}</span>
        </div>
        {post.caption && <p className="text-sm"><b>@{author?.username}</b> {post.caption}</p>}
        {comments.map(c => (
          <p key={c.id} className="text-sm"><b>@{profileOf(feed, c.user_id)?.username ?? 'user'}</b> {c.body}</p>
        ))}
        {user && (
          <form onSubmit={comment} className="flex gap-2">
            <Input placeholder="Add a comment…" value={text} onChange={e => setText(e.target.value)} />
            <Button type="submit" size="sm">Post</Button>
          </form>
        )}
      </div>
    </article>
  );
}

export function storyGroups(feed: ZypoFeed) {
  const byUser = new Map<string, ZypoPost[]>();
  for (const story of feed.stories) {
    const list = byUser.get(story.user_id) ?? [];
    list.push(story);
    byUser.set(story.user_id, list);
  }
  return [...byUser.entries()];
}

export function ZypoStoryBar({ feed, onOpen }: { feed: ZypoFeed; onOpen: (index: number) => void }) {
  const { user } = useZypoSession();
  const groups = storyGroups(feed);
  if (!groups.length) return null;
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {groups.map(([id, items], groupIndex) => {
        const profile = profileOf(feed, id);
        const isMine = user?.id === id;
        return (
          <button key={id} onClick={() => onOpen(groupIndex)} className="flex w-16 shrink-0 flex-col items-center gap-1">
            <span className={`rounded-full p-0.5 ring-2 ${isMine ? 'ring-primary' : 'ring-primary/40'}`}>
              <ZypoAvatar profile={profile} media={feed.media} size={56} />
            </span>
            <span className="w-full truncate text-center text-xs text-muted-foreground">
              {isMine ? 'You' : `@${profile?.username ?? 'user'}`} · {items.length}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function ZypoStoryViewer({ feed, groupIndex, onClose }: { feed: ZypoFeed; groupIndex: number; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const groups = storyGroups(feed);
  const group = groups[groupIndex] ?? groups[0];
  const authorId = group?.[0];
  const items = group?.[1] ?? [];
  const story = items[index];
  const author = profileOf(feed, authorId);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function advance() {
    if (index + 1 < items.length) setIndex(index + 1);
    else onClose();
  }

  useEffect(() => {
    if (!story || story.media_type === 'video') return;
    const timer = window.setTimeout(advance, 5000);
    return () => window.clearTimeout(timer);
  });

  if (!story) return null;
  const src = feed.media[story.media_path];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95">
      <div className="flex items-center gap-3 p-3 text-white">
        <ZypoAvatar profile={author} media={feed.media} size={32} />
        <span className="text-sm font-semibold">@{author?.username ?? 'user'}</span>
        <button onClick={onClose} aria-label="Close story" className="ml-auto rounded-full p-2 hover:bg-white/10"><X className="h-5 w-5" /></button>
      </div>
      <div className="flex gap-1 px-3">
        {items.map((_, i) => (
          <span key={i} className={`h-1 flex-1 rounded-full ${i <= index ? 'bg-white' : 'bg-white/30'}`} />
        ))}
      </div>
      <div className="relative flex-1 overflow-hidden bg-black">
        {story.media_type === 'video' ? (
          <video src={src} autoPlay playsInline controls onEnded={advance} className="h-full w-full object-contain" />
        ) : (
          <img src={src} alt={story.caption || 'Zypo story'} className="h-full w-full object-contain" />
        )}
        {story.media_type !== 'video' && (
          <button onClick={advance} aria-label="Next story" className="absolute inset-0 h-full w-full" />
        )}
      </div>
      {story.caption && <p className="p-3 text-center text-sm text-white">{story.caption}</p>}
    </div>
  );
}

export function ZypoSaveButton({ post, saved }: { post: ZypoPost; saved: boolean }) {
  const { user } = useZypoSession();
  const qc = useQueryClient();
  if (!user) return null;
  return (
    <button
      aria-pressed={saved}
      aria-label={saved ? 'Remove from saved' : 'Save post'}
      onClick={async () => {
        const result = saved
          ? await supabase.from('zypo_saves').delete().eq('user_id', user.id).eq('post_id', post.id)
          : await supabase.from('zypo_saves').insert({ user_id: user.id, post_id: post.id });
        if (result.error) return;
        await qc.invalidateQueries({ queryKey: ['zypo-private'] });
      }}
      className="text-sm font-medium"
    >
      <Bookmark className={`h-5 w-5 ${saved ? 'fill-primary text-primary' : ''}`} />
    </button>
  );
}

export function ZypoFollowButton({ me, targetId, following }: { me?: string | undefined; targetId: string; following: boolean }) {
  const qc = useQueryClient();
  if (!me || me === targetId) return null;
  return (
    <Button
      size="sm"
      variant={following ? 'outline' : 'default'}
      onClick={async () => {
        const result = following
          ? await supabase.from('zypo_follows').delete().eq('follower_id', me).eq('following_id', targetId)
          : await supabase.from('zypo_follows').insert({ follower_id: me, following_id: targetId });
        if (result.error) return;
        await qc.invalidateQueries({ queryKey: ['zypo-feed'] });
      }}
    >
      {following ? 'Following' : 'Follow'}
    </Button>
  );
}

export function ZypoMessageButton({ targetId, username }: { targetId: string; username: string }) {
  const { user } = useZypoSession();
  if (!user || user.id === targetId) return null;
  return (
    <Button size="sm" variant="ghost" asChild>
      <Link to="/zypo/chat/$peerId" params={{ peerId: targetId }}>
        <Send className="mr-1 h-4 w-4" /> Message @{username}
      </Link>
    </Button>
  );
}
