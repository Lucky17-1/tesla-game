-- Automatic activity alerts for likes, comments and follows.
CREATE OR REPLACE FUNCTION public.zypo_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor uuid;
  target uuid;
  pk uuid;
  kind text;
BEGIN
  IF TG_TABLE_NAME = 'zypo_likes' THEN
    actor := NEW.user_id;
    SELECT user_id INTO target FROM public.zypo_posts WHERE id = NEW.post_id;
    pk := NEW.post_id;
    kind := 'like';
  ELSIF TG_TABLE_NAME = 'zypo_follows' THEN
    actor := NEW.follower_id;
    target := NEW.following_id;
    pk := NULL;
    kind := 'follow';
  ELSIF TG_TABLE_NAME = 'zypo_comments' THEN
    actor := NEW.user_id;
    SELECT user_id INTO target FROM public.zypo_posts WHERE id = NEW.post_id;
    pk := NEW.post_id;
    kind := 'comment';
  END IF;

  IF target IS NULL OR target = actor THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.zypo_notifications (user_id, actor_id, kind, post_id)
  VALUES (target, actor, kind, pk)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS zypo_like_notify ON public.zypo_likes;
CREATE TRIGGER zypo_like_notify AFTER INSERT ON public.zypo_likes
  FOR EACH ROW EXECUTE FUNCTION public.zypo_notify();

DROP TRIGGER IF EXISTS zypo_follow_notify ON public.zypo_follows;
CREATE TRIGGER zypo_follow_notify AFTER INSERT ON public.zypo_follows
  FOR EACH ROW EXECUTE FUNCTION public.zypo_notify();

DROP TRIGGER IF EXISTS zypo_comment_notify ON public.zypo_comments;
CREATE TRIGGER zypo_comment_notify AFTER INSERT ON public.zypo_comments
  FOR EACH ROW EXECUTE FUNCTION public.zypo_notify();

-- Stories expire after 24 hours: drop story rows that are no longer visible.
DELETE FROM public.zypo_posts WHERE kind = 'story' AND created_at < now() - interval '24 hours';

CREATE INDEX IF NOT EXISTS zypo_posts_kind_created_idx
  ON public.zypo_posts (kind, created_at DESC);
