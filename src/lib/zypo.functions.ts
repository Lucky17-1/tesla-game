import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { Database } from '@/integrations/supabase/types';

export const getZypoFeed = createServerFn({ method: 'GET' })
  .inputValidator((input: unknown) => z.object({ username: z.string().max(30).optional() }).parse(input ?? {}))
  .handler(async ({ data: input }) => {
    // Hosts like Vercel may only provide the public VITE_* values; fall back to them.
    const url = process.env['SUPABASE_URL'] || (import.meta.env['VITE_SUPABASE_URL'] as string | undefined);
    const key = process.env['SUPABASE_PUBLISHABLE_KEY'] || (import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] as string | undefined);
    if (!url || !key) throw new Error('Zypo is unavailable. Please try again.');
    const db = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
        headers.set('apikey', key);
        return fetch(input, { ...init, headers });
      } },
    });
    const { data: profiles, error: profileError } = await db.from('profiles').select('id,username,display_name,bio,avatar_path,created_at').order('created_at', { ascending: false }).limit(100);
    if (profileError) throw new Error('Profiles could not load. Please try again.');
    const profile = input.username ? profiles?.find(p => p.username === input.username) : null;
    let query = db.from('zypo_posts').select('id,user_id,caption,media_path,media_type,kind,created_at').order('created_at', { ascending: false }).limit(100);
    if (input.username && profile) query = query.eq('user_id', profile.id);
    const { data: posts, error } = await query;
    if (error) throw new Error('Posts could not load. Please try again.');
    const rows = input.username && !profile ? [] : posts ?? [];
    const ids = rows.map(p => p.id);
    const [likes, comments, follows] = await Promise.all([
      ids.length ? db.from('zypo_likes').select('post_id,user_id').in('post_id', ids) : Promise.resolve({ data: [] }),
      ids.length ? db.from('zypo_comments').select('id,post_id,user_id,body,created_at').in('post_id', ids).order('created_at') : Promise.resolve({ data: [] }),
      db.from('zypo_follows').select('follower_id,following_id'),
    ]);
    const paths = [...new Set([...rows.map(p => p.media_path), ...(profiles ?? []).map(p => p.avatar_path).filter((p): p is string => !!p)])];
    const signed = paths.length ? await db.storage.from('zypo-media').createSignedUrls(paths, 3600) : { data: [] };
    const media: Record<string, string> = {};
    const browserUrl = import.meta.env['VITE_SUPABASE_URL'] as string | undefined;
    for (const item of signed.data ?? []) if (item.path && item.signedUrl) media[item.path] = browserUrl ? item.signedUrl.replace(url, browserUrl) : item.signedUrl;
    return { posts: rows, profiles: profiles ?? [], likes: likes.data ?? [], comments: comments.data ?? [], follows: follows.data ?? [], media };
  });
export type ZypoFeed = Awaited<ReturnType<typeof getZypoFeed>>;
export type ZypoPost = ZypoFeed['posts'][number];
export type ZypoProfile = ZypoFeed['profiles'][number];