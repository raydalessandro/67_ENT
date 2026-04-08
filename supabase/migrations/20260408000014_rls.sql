-- 67 Hub V2 — RLS Policies

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guideline_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guideline_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guideline_item_artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guideline_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_daily_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select" ON public.users FOR SELECT USING (true);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (id = auth.uid());

CREATE POLICY "artists_select" ON public.artists FOR SELECT USING (true);
CREATE POLICY "artists_insert_staff" ON public.artists FOR INSERT WITH CHECK (is_staff());
CREATE POLICY "artists_update_staff" ON public.artists FOR UPDATE USING (is_staff());
CREATE POLICY "artists_delete_staff" ON public.artists FOR DELETE USING (is_staff());

CREATE POLICY "posts_select" ON public.posts FOR SELECT USING (
  is_staff() OR artist_id = get_artist_id()
);
CREATE POLICY "posts_insert_staff" ON public.posts FOR INSERT WITH CHECK (is_staff());
CREATE POLICY "posts_update_staff" ON public.posts FOR UPDATE USING (
  is_staff() OR (artist_id = get_artist_id() AND status = 'in_review')
);

CREATE POLICY "post_media_select" ON public.post_media FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.posts WHERE id = post_media.post_id AND (is_staff() OR artist_id = get_artist_id()))
);
CREATE POLICY "post_media_insert_staff" ON public.post_media FOR INSERT WITH CHECK (is_staff());
CREATE POLICY "post_media_delete_staff" ON public.post_media FOR DELETE USING (is_staff());

CREATE POLICY "post_comments_select" ON public.post_comments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.posts WHERE id = post_comments.post_id AND (is_staff() OR artist_id = get_artist_id()))
);
CREATE POLICY "post_comments_insert" ON public.post_comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "post_comments_delete_own" ON public.post_comments FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "post_history_select_staff" ON public.post_history FOR SELECT USING (is_staff());

CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "push_select_own" ON public.push_subscriptions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "push_insert_own" ON public.push_subscriptions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "push_delete_own" ON public.push_subscriptions FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "sections_select" ON public.guideline_sections FOR SELECT USING (true);
CREATE POLICY "sections_insert_staff" ON public.guideline_sections FOR INSERT WITH CHECK (is_staff());
CREATE POLICY "sections_update_staff" ON public.guideline_sections FOR UPDATE USING (is_staff());
CREATE POLICY "sections_delete_staff" ON public.guideline_sections FOR DELETE USING (is_staff());

CREATE POLICY "items_select" ON public.guideline_items FOR SELECT USING (true);
CREATE POLICY "items_insert_staff" ON public.guideline_items FOR INSERT WITH CHECK (is_staff());
CREATE POLICY "items_update_staff" ON public.guideline_items FOR UPDATE USING (is_staff());
CREATE POLICY "items_delete_staff" ON public.guideline_items FOR DELETE USING (is_staff());

CREATE POLICY "item_artists_select" ON public.guideline_item_artists FOR SELECT USING (true);
CREATE POLICY "item_artists_insert_staff" ON public.guideline_item_artists FOR INSERT WITH CHECK (is_staff());
CREATE POLICY "item_artists_delete_staff" ON public.guideline_item_artists FOR DELETE USING (is_staff());

CREATE POLICY "reads_select_own" ON public.guideline_reads FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "reads_insert_own" ON public.guideline_reads FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "ai_config_select_staff" ON public.ai_agent_configs FOR SELECT USING (is_staff());
CREATE POLICY "ai_config_update_staff" ON public.ai_agent_configs FOR UPDATE USING (is_staff());

CREATE POLICY "chat_select_own" ON public.ai_chat_messages FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "chat_insert" ON public.ai_chat_messages FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "usage_select_own" ON public.ai_daily_usage FOR SELECT USING (user_id = auth.uid());
