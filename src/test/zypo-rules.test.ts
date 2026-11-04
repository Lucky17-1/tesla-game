import { describe, expect, it } from 'vitest';
import { conversationFilter, MEDIA_LIMIT, mediaError, storyActive, ZYPO_LOGIN_PROVIDERS } from '@/lib/zypo-rules';
describe('Zypo privacy and media', () => {
  it('does not offer Lovable as a login provider', () => {
    expect(ZYPO_LOGIN_PROVIDERS).toEqual(['email', 'google']);
    expect(ZYPO_LOGIN_PROVIDERS).not.toContain('lovable');
  });
  it('accepts photos and videos within the actual storage limit', () => {
    expect(mediaError({ type: 'image/jpeg', size: 4096 })).toBeNull();
    expect(mediaError({ type: 'video/mp4', size: MEDIA_LIMIT })).toBeNull();
    expect(mediaError({ type: 'video/mp4', size: MEDIA_LIMIT + 1 })).not.toBeNull();
    expect(mediaError({ type: 'text/html', size: 100 })).not.toBeNull();
  });
  it('limits stories to 24 hours in the feed', () => {
    const start = Date.parse('2026-11-04T00:00:00Z');
    expect(storyActive('2026-11-04T00:00:00Z', start + 86400000 - 1)).toBe(true);
    expect(storyActive('2026-11-04T00:00:00Z', start + 86400000)).toBe(false);
  });
  it('scopes conversation selection to both participants and rejects filter injection', () => {
    const a = '00000000-0000-4000-8000-000000000001', b = '00000000-0000-4000-8000-000000000002';
    expect(conversationFilter(a, b)).toBe(`and(sender_id.eq.${a},recipient_id.eq.${b}),and(sender_id.eq.${b},recipient_id.eq.${a})`);
    expect(() => conversationFilter(a, 'x),sender_id.neq.x')).toThrow();
  });
});