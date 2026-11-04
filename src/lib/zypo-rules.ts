import { z } from 'zod';

export const profileSchema = z.object({
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,30}$/, 'Use 3–30 letters, numbers or underscores.'),
  display_name: z.string().trim().max(80),
  bio: z.string().trim().max(300),
});
export const postSchema = z.object({ caption: z.string().max(2200), kind: z.enum(['post', 'story', 'reel']) });
export const commentSchema = z.string().trim().min(1).max(1000);
export const messageSchema = z.string().trim().min(1).max(2000);
export const MEDIA_LIMIT = 20 * 1024 * 1024;
export const MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime'];
export function mediaError(file: { size: number; type: string }) {
  if (!MEDIA_TYPES.includes(file.type)) return 'Choose a JPG, PNG, WebP, GIF, MP4, WebM or MOV file.';
  if (file.size > MEDIA_LIMIT) return 'Choose a file smaller than 20 MB.';
  if (!file.size) return 'This file is empty.';
  return null;
}
export function storyActive(createdAt: string, now: number) {
  return now - new Date(createdAt).getTime() < 24 * 60 * 60 * 1000;
}
export const ZYPO_LOGIN_PROVIDERS = ['email', 'google'] as const;
export function conversationFilter(userId: string, peerId: string) {
  if (!z.string().uuid().safeParse(userId).success || !z.string().uuid().safeParse(peerId).success) throw new Error('Invalid conversation.');
  return `and(sender_id.eq.${userId},recipient_id.eq.${peerId}),and(sender_id.eq.${peerId},recipient_id.eq.${userId})`;
}