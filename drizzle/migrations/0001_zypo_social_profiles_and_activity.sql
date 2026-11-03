CREATE TABLE public.profiles (
 id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 username text NOT NULL UNIQUE CHECK (username ~ '^[a-z0-9_]{3,30}$'),
 display_name text NOT NULL DEFAULT '' CHECK (length(display_name) <= 80),
 bio text NOT NULL DEFAULT '' CHECK (length(bio) <= 300),
 avatar_path text,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public social profiles" ON public.profiles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Edit own social profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE FUNCTION public.create_zypo_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 INSERT INTO public.profiles (id, username, display_name) VALUES (new.id, 'z_' || replace(new.id::text, '-', ''), left(coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', ''),80)) ON CONFLICT (id) DO NOTHING;
 RETURN new;
END; $$;
CREATE TRIGGER on_auth_zypo_profile AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.create_zypo_profile();
INSERT INTO public.profiles (id, username, display_name) SELECT id, 'z_' || left(replace(id::text, '-', ''),28), left(coalesce(raw_user_meta_data->>'display_name', raw_user_meta_data->>'full_name', ''),80) FROM auth.users ON CONFLICT (id) DO NOTHING;
CREATE OR REPLACE FUNCTION public.create_zypo_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 INSERT INTO public.profiles (id, username, display_name) VALUES (new.id, 'z_' || left(replace(new.id::text, '-', ''),28), left(coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', ''),80)) ON CONFLICT (id) DO NOTHING;
 RETURN new;
END; $$;
CREATE TABLE public.zypo_posts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 caption text NOT NULL DEFAULT '' CHECK (length(caption) <= 2200),
 media_path text NOT NULL,
 media_type text NOT NULL CHECK (media_type IN ('image','video')),
 kind text NOT NULL DEFAULT 'post' CHECK (kind IN ('post','story','reel')),
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.zypo_posts TO anon;
GRANT SELECT, INSERT, DELETE ON public.zypo_posts TO authenticated;
GRANT ALL ON public.zypo_posts TO service_role;
ALTER TABLE public.zypo_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public social posts" ON public.zypo_posts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Create own post" ON public.zypo_posts FOR INSERT TO authenticated WITH CHECK (user_id=auth.uid() AND media_path LIKE auth.uid()::text || '/%');
CREATE POLICY "Delete own post" ON public.zypo_posts FOR DELETE TO authenticated USING (user_id=auth.uid());
CREATE INDEX zypo_posts_created ON public.zypo_posts(created_at DESC);
CREATE TABLE public.zypo_likes (user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, post_id uuid NOT NULL REFERENCES public.zypo_posts(id) ON DELETE CASCADE, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,post_id));
GRANT SELECT ON public.zypo_likes TO anon;
GRANT SELECT, INSERT, DELETE ON public.zypo_likes TO authenticated;
GRANT ALL ON public.zypo_likes TO service_role;
ALTER TABLE public.zypo_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public like counts" ON public.zypo_likes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Like as yourself" ON public.zypo_likes FOR INSERT TO authenticated WITH CHECK (user_id=auth.uid());
CREATE POLICY "Unlike as yourself" ON public.zypo_likes FOR DELETE TO authenticated USING (user_id=auth.uid());
CREATE TABLE public.zypo_comments (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, post_id uuid NOT NULL REFERENCES public.zypo_posts(id) ON DELETE CASCADE, body text NOT NULL CHECK (length(trim(body)) BETWEEN 1 AND 1000), created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.zypo_comments TO anon;
GRANT SELECT, INSERT, DELETE ON public.zypo_comments TO authenticated;
GRANT ALL ON public.zypo_comments TO service_role;
ALTER TABLE public.zypo_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public comments" ON public.zypo_comments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Comment as yourself" ON public.zypo_comments FOR INSERT TO authenticated WITH CHECK (user_id=auth.uid());
CREATE POLICY "Delete own comment" ON public.zypo_comments FOR DELETE TO authenticated USING (user_id=auth.uid());
CREATE TABLE public.zypo_follows (follower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, following_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(follower_id,following_id), CHECK(follower_id <> following_id));
GRANT SELECT ON public.zypo_follows TO anon;
GRANT SELECT, INSERT, DELETE ON public.zypo_follows TO authenticated;
GRANT ALL ON public.zypo_follows TO service_role;
ALTER TABLE public.zypo_follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public follower graph" ON public.zypo_follows FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Follow as yourself" ON public.zypo_follows FOR INSERT TO authenticated WITH CHECK (follower_id=auth.uid());
CREATE POLICY "Unfollow as yourself" ON public.zypo_follows FOR DELETE TO authenticated USING (follower_id=auth.uid());
CREATE TABLE public.zypo_saves (user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, post_id uuid NOT NULL REFERENCES public.zypo_posts(id) ON DELETE CASCADE, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,post_id));
GRANT SELECT, INSERT, DELETE ON public.zypo_saves TO authenticated;
GRANT ALL ON public.zypo_saves TO service_role;
ALTER TABLE public.zypo_saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own saved posts" ON public.zypo_saves FOR SELECT TO authenticated USING (user_id=auth.uid());
CREATE POLICY "Save as yourself" ON public.zypo_saves FOR INSERT TO authenticated WITH CHECK (user_id=auth.uid());
CREATE POLICY "Unsave as yourself" ON public.zypo_saves FOR DELETE TO authenticated USING (user_id=auth.uid());
CREATE TABLE public.zypo_messages (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, body text NOT NULL CHECK (length(trim(body)) BETWEEN 1 AND 2000), created_at timestamptz NOT NULL DEFAULT now(), CHECK(sender_id <> recipient_id));
GRANT SELECT, INSERT ON public.zypo_messages TO authenticated;
GRANT ALL ON public.zypo_messages TO service_role;
ALTER TABLE public.zypo_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants read messages" ON public.zypo_messages FOR SELECT TO authenticated USING (auth.uid() IN (sender_id,recipient_id));
CREATE POLICY "Send as yourself" ON public.zypo_messages FOR INSERT TO authenticated WITH CHECK (sender_id=auth.uid());
CREATE INDEX zypo_messages_recipient ON public.zypo_messages(recipient_id,created_at DESC);
CREATE TABLE public.zypo_notifications (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, actor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, kind text NOT NULL CHECK (kind IN ('like','comment','follow')), post_id uuid REFERENCES public.zypo_posts(id) ON DELETE CASCADE, is_read boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.zypo_notifications TO authenticated;
GRANT UPDATE (is_read) ON public.zypo_notifications TO authenticated;
GRANT ALL ON public.zypo_notifications TO service_role;
ALTER TABLE public.zypo_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own notifications" ON public.zypo_notifications FOR SELECT TO authenticated USING (user_id=auth.uid());
CREATE POLICY "Mark own notification read" ON public.zypo_notifications FOR UPDATE TO authenticated USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid());
CREATE FUNCTION public.zypo_notify() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE target uuid; actor uuid; post uuid; activity text;
BEGIN
 IF TG_TABLE_NAME='zypo_follows' THEN target:=new.following_id; actor:=new.follower_id; activity:='follow';
 ELSE SELECT user_id INTO target FROM public.zypo_posts WHERE id=new.post_id; actor:=new.user_id; post:=new.post_id; activity:=CASE WHEN TG_TABLE_NAME='zypo_likes' THEN 'like' ELSE 'comment' END; END IF;
 IF target IS NOT NULL AND target<>actor THEN INSERT INTO public.zypo_notifications(user_id,actor_id,kind,post_id) VALUES(target,actor,activity,post); END IF;
 RETURN new;
END; $$;
CREATE TRIGGER zypo_like_notification AFTER INSERT ON public.zypo_likes FOR EACH ROW EXECUTE FUNCTION public.zypo_notify();
CREATE TRIGGER zypo_comment_notification AFTER INSERT ON public.zypo_comments FOR EACH ROW EXECUTE FUNCTION public.zypo_notify();
CREATE TRIGGER zypo_follow_notification AFTER INSERT ON public.zypo_follows FOR EACH ROW EXECUTE FUNCTION public.zypo_notify();
CREATE TABLE public.zypo_reports (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, post_id uuid NOT NULL REFERENCES public.zypo_posts(id) ON DELETE CASCADE, reason text NOT NULL CHECK (length(trim(reason)) BETWEEN 1 AND 500), created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(reporter_id,post_id));
GRANT SELECT, INSERT ON public.zypo_reports TO authenticated;
GRANT ALL ON public.zypo_reports TO service_role;
ALTER TABLE public.zypo_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own reports" ON public.zypo_reports FOR SELECT TO authenticated USING (reporter_id=auth.uid());
CREATE POLICY "Report as yourself" ON public.zypo_reports FOR INSERT TO authenticated WITH CHECK (reporter_id=auth.uid());
CREATE POLICY "Read published Zypo media" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id='zypo-media' AND (EXISTS(SELECT 1 FROM public.zypo_posts WHERE media_path=name) OR EXISTS(SELECT 1 FROM public.profiles WHERE avatar_path=name) OR (storage.foldername(name))[1]=auth.uid()::text));
CREATE POLICY "Upload own Zypo media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='zypo-media' AND (storage.foldername(name))[1]=auth.uid()::text);
CREATE POLICY "Delete own Zypo media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id='zypo-media' AND (storage.foldername(name))[1]=auth.uid()::text);
REVOKE ALL ON FUNCTION public.create_zypo_profile() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.zypo_notify() FROM PUBLIC;