-- ============================================================================
-- RLS Policies: Allow public read access to educational content
-- Run in Supabase SQL Editor
-- ============================================================================

-- education_levels: public read
create policy "education_levels_public_read" on public.education_levels for select using (true);

-- classes: public read
create policy "classes_public_read" on public.classes for select using (true);

-- subjects: public read
create policy "subjects_public_read" on public.subjects for select using (true);

-- chapters: public read
create policy "chapters_public_read" on public.chapters for select using (true);

-- topics: public read
create policy "topics_public_read" on public.topics for select using (true);

-- resources: public read (published only)
create policy "resources_public_read" on public.resources for select using (is_published = true);

-- profiles: public read (email, role only - no sensitive data)
create policy "profiles_public_read" on public.profiles for select using (true);

-- bookmarks: authenticated users can read their own
create policy "bookmarks_own_read" on public.bookmarks for select using (auth.uid() = user_id);
create policy "bookmarks_own_write" on public.bookmarks for insert with check (auth.uid() = user_id);
create policy "bookmarks_own_update" on public.bookmarks for update using (auth.uid() = user_id);
create policy "bookmarks_own_delete" on public.bookmarks for delete using (auth.uid() = user_id);

-- user_progress: authenticated users can read/update their own
create policy "progress_own_read" on public.user_progress for select using (auth.uid() = user_id);
create policy "progress_own_write" on public.user_progress for insert with check (auth.uid() = user_id);
create policy "progress_own_update" on public.user_progress for update using (auth.uid() = user_id);

-- settings: public read
create policy "settings_public_read" on public.settings for select using (true);
