import { createFileRoute, Link, Outlet } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Bell, Bookmark, Clapperboard, Compass, Home, MessageCircle, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ZypoSession, useZypoSession } from '@/components/ZypoSession';
import { feedOptions } from '@/lib/zypo-data';

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
  component: () => <ZypoSession><ZypoShell /></ZypoSession>,
});

const NAV = [
  { to: '/zypo', label: 'Home', icon: Home },
  { to: '/zypo/explore', label: 'Explore', icon: Compass },
  { to: '/zypo/reels', label: 'Reels', icon: Clapperboard },
  { to: '/zypo/messages', label: 'Messages', icon: MessageCircle },
  { to: '/zypo/notifications', label: 'Activity', icon: Bell },
  { to: '/zypo/saved', label: 'Saved', icon: Bookmark },
] as const;

function ZypoShell() {
  const { user, ready } = useZypoSession();
  const { data: feed } = useQuery(feedOptions());
  const me = user ? feed?.profiles.find(p => p.id === user.id) : undefined;

  return (
    <div className="mx-auto max-w-xl px-4 pb-24 pt-6">
      <header className="mb-6 flex items-center justify-between gap-3">
        <Link to="/zypo" className="text-3xl font-bold text-primary">Zypo</Link>
        <nav aria-label="Zypo" className="hidden items-center gap-1 sm:flex">
          {NAV.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              activeProps={{ className: 'rounded-lg px-3 py-2 text-sm font-medium text-primary bg-muted' }}
            >
              {item.label}
            </Link>
          ))}
          {me && (
            <Link
              to="/zypo/profile/$username"
              params={{ username: me.username }}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              activeProps={{ className: 'rounded-lg px-3 py-2 text-sm font-medium text-primary bg-muted' }}
            >
              Profile
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-2">
          {user && (
            <button onClick={() => void supabase.auth.signOut()} className="text-sm text-muted-foreground underline">Sign out</button>
          )}
        </div>
      </header>

      {!ready && <p className="text-sm text-muted-foreground">Loading Zypo…</p>}
      <Outlet />

      <nav aria-label="Zypo mobile" className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur sm:hidden">
        <ul className="mx-auto flex max-w-xl items-center justify-around py-2">
          {NAV.map(item => (
            <li key={item.to}>
              <Link to={item.to} className="flex flex-col items-center gap-0.5 px-2 py-1 text-[11px] text-muted-foreground" activeProps={{ className: 'flex flex-col items-center gap-0.5 px-2 py-1 text-[11px] text-primary' }}>
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            </li>
          ))}
          {me && (
            <li>
              <Link
                to="/zypo/profile/$username"
                params={{ username: me.username }}
                className="flex flex-col items-center gap-0.5 px-2 py-1 text-[11px] text-muted-foreground"
                activeProps={{ className: 'flex flex-col items-center gap-0.5 px-2 py-1 text-[11px] text-primary' }}
              >
                <User className="h-5 w-5" />
                You
              </Link>
            </li>
          )}
        </ul>
      </nav>
    </div>
  );
}
