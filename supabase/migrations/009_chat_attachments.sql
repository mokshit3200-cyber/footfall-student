-- Drop the old type constraint on messages table if it exists
alter table messages drop constraint if exists messages_type_check;

-- Add a new check constraint supporting text, image, video, and file message types
alter table messages add constraint messages_type_check check (type in ('text', 'image', 'video', 'file'));

-- Ensure the 'chat-attachments' bucket exists in Supabase Storage
insert into storage.buckets (id, name, public)
values ('chat-attachments', 'chat-attachments', true)
on conflict (id) do nothing;

-- Drop old policies if they exist to prevent name collisions
drop policy if exists "Public Upload" on storage.objects;
drop policy if exists "Public Select" on storage.objects;

-- Create storage policies to allow upload and retrieval of attachments
create policy "Public Upload"
  on storage.objects for insert
  with check (bucket_id = 'chat-attachments');

create policy "Public Select"
  on storage.objects for select
  using (bucket_id = 'chat-attachments');
