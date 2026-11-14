import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getZypoFeed } from './zypo.functions';
import { conversationFilter, mediaError, messageSchema } from './zypo-rules';

export const feedOptions = (username?: string) => queryOptions({
  queryKey: ['zypo-feed', username ?? 'all'],
  queryFn: () => getZypoFeed({ data: { username } }),
  staleTime: 30_000,
  refetchInterval: 60_000,
});

export const privateOptions = <T,>(key: string[], queryFn: () => Promise<T>) => queryOptions({
  queryKey: ['zypo-private', ...key],
  queryFn,
  staleTime: 15_000,
  refetchInterval: 30_000,
});

export async function uploadMedia(file: File, userId: string, onProgress?: (value: number) => void) {
  const error = mediaError(file);
  if (error) throw new Error(error);
  const suffix = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
  const path = `${userId}/${crypto.randomUUID()}.${suffix}`;
  onProgress?.(10);
  const result = await supabase.storage.from('zypo-media').upload(path, file, { contentType: file.type, cacheControl: '3600', upsert: false });
  if (result.error) throw new Error('Upload failed. Please check your connection and try again.');
  onProgress?.(90);
  return { path, type: file.type.startsWith('video/') ? 'video' as const : 'image' as const };
}

export async function signedMedia(path: string) {
  const { data, error } = await supabase.storage.from('zypo-media').createSignedUrl(path, 3600);
  if (error) throw new Error('Media could not load.');
  return data.signedUrl;
}

export function checkResult(result: { error: { message: string; code?: string } | null }) {
  if (result.error) throw new Error(result.error.code === '23505' ? 'Already exists. Please choose another username or try again.' : 'Could not save. Please try again.');
}

export type Conversation = { peerId: string; lastBody: string; lastAt: string; unread: number };

export async function listConversations(userId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('zypo_messages')
    .select('sender_id,recipient_id,body,created_at,media_path,media_type')
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw new Error('Messages could not load. Please try again.');
  const byPeer = new Map<string, Conversation>();
  for (const row of data ?? []) {
    const peerId = row.sender_id === userId ? row.recipient_id : row.sender_id;
    const existing = byPeer.get(peerId);
    const body = row.body || (row.media_type === 'video' ? 'Sent a video' : 'Sent a photo');
    if (!existing) byPeer.set(peerId, { peerId, lastBody: body, lastAt: row.created_at, unread: row.sender_id !== userId ? 1 : 0 });
    else if (row.sender_id !== userId) existing.unread += 1;
  }
  return [...byPeer.values()].sort((a, b) => b.lastAt.localeCompare(a.lastAt));
}

export async function readConversation(userId: string, peerId: string) {
  const { data, error } = await supabase
    .from('zypo_messages')
    .select('id,sender_id,recipient_id,body,created_at,media_path,media_type')
    .or(conversationFilter(userId, peerId))
    .order('created_at', { ascending: true })
    .limit(200);
  if (error) throw new Error('Messages could not load. Please try again.');
  return data ?? [];
}

export async function sendMessage(userId: string, peerId: string, text: string, file?: File | null) {
  const body = messageSchema.safeParse(text);
  if (!body.success) throw new Error('Write a message before sending.');
  let mediaPath: string | null = null;
  let mediaType: string | null = null;
  if (file) {
    const uploaded = await uploadMedia(file, userId);
    mediaPath = uploaded.path;
    mediaType = uploaded.type;
  }
  checkResult(await supabase.from('zypo_messages').insert({ sender_id: userId, recipient_id: peerId, body: body.data, media_path: mediaPath, media_type: mediaType }));
}

export async function listNotifications(userId: string) {
  const { data, error } = await supabase
    .from('zypo_notifications')
    .select('id,actor_id,kind,post_id,is_read,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(60);
  if (error) throw new Error('Activity could not load. Please try again.');
  return data ?? [];
}

export async function markNotificationsRead(userId: string) {
  checkResult(await supabase.from('zypo_notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false));
}

export async function listSavedPosts(userId: string) {
  const { data, error } = await supabase
    .from('zypo_saves')
    .select('post_id,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(60);
  if (error) throw new Error('Saved posts could not load. Please try again.');
  return data ?? [];
}

export async function toggleSave(userId: string, postId: string, saved: boolean) {
  const result = saved
    ? await supabase.from('zypo_saves').delete().eq('user_id', userId).eq('post_id', postId)
    : await supabase.from('zypo_saves').insert({ user_id: userId, post_id: postId });
  checkResult(result);
}

export async function toggleFollow(followerId: string, followingId: string, following: boolean) {
  const result = following
    ? await supabase.from('zypo_follows').delete().eq('follower_id', followerId).eq('following_id', followingId)
    : await supabase.from('zypo_follows').insert({ follower_id: followerId, following_id: followingId });
  checkResult(result);
}

export async function saveProfile(userId: string, patch: { display_name?: string; bio?: string; avatar_path?: string | null }) {
  checkResult(await supabase.from('profiles').update(patch).eq('id', userId));
}
