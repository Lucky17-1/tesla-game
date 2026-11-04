import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getZypoFeed } from './zypo.functions';
import { mediaError } from './zypo-rules';

export const feedOptions = (username?: string) => queryOptions({
  queryKey: ['zypo-feed', username ?? 'all'],
  queryFn: () => getZypoFeed({ data: { username } }),
  staleTime: 30_000,
  refetchInterval: 60_000,
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