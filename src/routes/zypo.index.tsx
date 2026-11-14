import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ZypoAuth } from '@/components/ZypoAuth';
import { useZypoSession } from '@/components/ZypoSession';
import { ZypoComposer, ZypoPostCard, ZypoStoryBar, ZypoStoryViewer } from '@/components/ZypoParts';
import { feedOptions } from '@/lib/zypo-data';

export const Route = createFileRoute('/zypo/')({
  loader: ({ context }) => context.queryClient.ensureQueryData(feedOptions()),
  head: () => ({
    meta: [
      { title: 'Zypo — your feed' },
      { name: 'description', content: 'See the latest photos and videos shared by people on Zypo.' },
      { property: 'og:title', content: 'Zypo — your feed' },
      { property: 'og:description', content: 'Photos, videos and stories from people on Zypo.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
    ],
  }),
  component: ZypoHome,
});

function ZypoHome() {
  const { user, ready } = useZypoSession();
  const { data: feed } = useSuspenseQuery(feedOptions());
  const [storyGroup, setStoryGroup] = useState<number | null>(null);
  const me = user ? feed.profiles.find(p => p.id === user.id) : undefined;

  return (
    <main className="space-y-6">
      <ZypoStoryBar feed={feed} onOpen={setStoryGroup} />
      {ready && !user && <ZypoAuth />}
      {user && !me && <ProfileSetup userId={user.id} />}
      {user && me && <ZypoComposer userId={user.id} kind="post" />}
      <section className="space-y-6">
        {feed.posts.length === 0 && <p className="py-10 text-center text-muted-foreground">No posts yet. Be the first to share!</p>}
        {feed.posts.map(post => <ZypoPostCard key={post.id} post={post} feed={feed} />)}
      </section>
      {storyGroup !== null && <ZypoStoryViewer feed={feed} groupIndex={storyGroup} onClose={() => setStoryGroup(null)} />}
    </main>
  );
}

function ProfileSetup({ userId }: { userId: string }) {
  const { data: feed } = useSuspenseQuery(feedOptions());
  void feed;
  return <ProfileSetupInner userId={userId} />;
}

function ProfileSetupInner({ userId }: { userId: string }) {
  return <ProfileForm userId={userId} />;
}

function ProfileForm({ userId }: { userId: string }) {
  const { qc } = { qc: undefined };
  void qc;
  void userId;
  return null;
}
