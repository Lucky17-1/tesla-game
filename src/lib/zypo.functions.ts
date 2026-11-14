import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { Database } from '@/integrations/supabase/types';

const STORY_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Public read path for the social feed. Uses the publishable key so it works on
 * any host (Lovable or an external deploy) without a user session.
 */
function publicClient() {
  const url = process.env['SUPABASE_URL'] || (import.meta.env['VITE_SUPABASE_URL'] as string | undefined);
  const key = process.env['SUPABASE_PUBLISHABLE_KEY'] || (import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] as string | undefined);
  if (!url || !key) throw new Error('Zypo is unavailable. Please try again.');
  const db = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
        headers.set('apikey', key);
        return fetch(input, { ...init, headers });
      },
    },
  });
  return { db, url };
}

async function signedMediaPaths(db: ReturnType<typeof publicClient>['db'], url: string, paths: string[]) {
  const browserUrl = import.meta.env['VITE_SUPABASE_URL'] as string | undefined;
  const media: Record<string, string> = {};
  const unique = [...new Set(paths.filter(Boolean))];
  for (let i = 0; i < unique.length; i += 50) {
    const { data } = await db.storage.from('zypo-media').createSignedUrls(unique.slice(i, i + 50), 3600);
    for (const item of data ?? []) {
      if (item.path && item.signedUrl) media[item.path] = browserUrl ? item.signedUrl.replace(url, browserUrl) : item.signedUrl;
    }
  }
  return media;
}

export const getZypoFeed = createServerFn({ method: 'GET' })
  .inputValidator((input: unknown) => z.object({ username: z.string().max(30).optional() }).parse(input ?? {}))
  .handler(async ({ data: input }) => {
    const { db, url } = publicClient();

    const { data: profiles, error: profileError } = await db
      .from('profiles')
      .select('id,username,display_name,bio,avatar_path,created_at')
      .order('created_at', { ascending: false })
      .limit(200);
    if (profileError) throw new Error('Profiles could not load. Please try again.');

    const profile = input.username ? profiles?.find(p => p.username === input.username) : null;
    const scoped = input.username ? (profile ? profile.id : null) : undefined;
    if (input.username && !profile) {
      return { posts: [], stories: [], reels: [], profiles: profiles ?? [], likes: [], comments: [], follows: [], media: {} };
    }

    const storyCutoff = new Date(Date.now() - STORY_WINDOW_MS).toISOString();
    const [posts, stories, reels, follows] = await Promise.all([
      db.from('zypo_posts')
        .select('id,user_id,caption,media_path,media_type,kind,created_at')
        .eq('kind', 'post').order('created_at', { ascending: false }).limit(60),
      db.from('zypo_posts')
        .select('id,user_id,caption,media_path,media_type,kind,created_at')
        .eq('kind', 'story').gte('created_at', storyCutoff).order('created_at', { ascending: true }).limit(60),
      db.from('zypo_posts')
        .select('id,user_id,caption,media_path,media_type,kind,created_at')
        .eq('kind', 'reel').order('created_at', { ascending: false }).limit(40),
      db.from('zypo_follows').select('follower_id,following_id'),
    ]);
    if (posts.error || stories.error || reels.error) throw new Error('Posts could not load. Please try again.');

    const inScope = <T extends { user_id: string }>(rows: T[] | null | undefined) =>
      (rows ?? []).filter(r => scoped === undefined || r.user_id === scoped);

    const postRows = inScope(posts.data);
    const storyRows = inScope(stories.data);
    const reelRows = inScope(reels.data);
    const rows = [...postRows, ...reelRows, ...storyRows];
    const ids = rows.map(p => p.id);

    const [likes, comments] = await Promise.all([
      ids.length ? db.from('zypo_likes').select('post_id,user_id').in('post_id', ids) : Promise.resolve({ data: [] }),
      ids.length
        ? db.from('zypo_comments').select('id,post_id,user_id,body,created_at').in('post_id', ids).order('created_at')
        : Promise.resolve({ data: [] }),
    ]);

    const media = await signedMediaPaths(
      db,
      url,
      [...rows.map(p => p.media_path), ...(profiles ?? []).map(p => p.avatar_path).filter((p): p is string => !!p)],
    );

    return {
      posts: postRows,
      stories: storyRows,
      reels: reelRows,
      profiles: profiles ?? [],
      likes: likes.data ?? [],
      comments: comments.data ?? [],
      follows: follows.data ?? [],
      media,
    };
  });

export type ZypoFeed = Awaited<ReturnType<typeof getZypoFeed>>;
export type ZypoPost = ZypoFeed['posts'][number];
export type ZypoProfile = ZypoFeed['profiles'][number];
