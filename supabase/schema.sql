-- =============================================================================
-- Cove — complete Supabase / PostgreSQL setup
-- Paste this entire file into: Supabase Dashboard → SQL Editor → New query → Run
-- Safe to re-run on an existing project (IF NOT EXISTS / DROP POLICY IF EXISTS).
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- True when the signed-in user belongs to the conversation.
-- SECURITY DEFINER so RLS on conversation_members cannot recurse into itself.
create or replace function public.is_conversation_member(conv_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversation_members m
    where m.conversation_id = conv_id
      and m.user_id = auth.uid()
  );
$$;

revoke all on function public.is_conversation_member(uuid) from public;
grant execute on function public.is_conversation_member(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  display_name text not null,
  avatar_url text,
  bio text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  online_status boolean not null default false,
  show_online boolean not null default true,
  show_last_seen boolean not null default true,
  constraint profiles_username_format check (username ~ '^[A-Za-z][A-Za-z0-9_]{2,23}$'),
  constraint profiles_display_name_len check (char_length(trim(display_name)) between 2 and 80),
  constraint profiles_bio_len check (char_length(bio) <= 140)
);

create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username));

create index if not exists profiles_last_seen_idx
  on public.profiles (last_seen desc);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  -- Sorted "uuid:uuid" of the two members. Unique ⇒ no duplicate 1-to-1 chats.
  pair_key text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create index if not exists conversation_members_user_idx
  on public.conversation_members (user_id, conversation_id);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  content text not null default '',
  attachment_url text,
  attachment_name text,
  attachment_type text,
  created_at timestamptz not null default now(),
  delivered_at timestamptz,
  read_at timestamptz,
  constraint messages_has_body check (
    length(trim(content)) > 0 or attachment_url is not null
  )
);

create index if not exists messages_conversation_created_idx
  on public.messages (conversation_id, created_at desc);

create index if not exists messages_unread_idx
  on public.messages (conversation_id)
  where read_at is null;

-- -----------------------------------------------------------------------------
-- Triggers
-- -----------------------------------------------------------------------------

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists conversations_set_updated_at on public.conversations;
create trigger conversations_set_updated_at
  before update on public.conversations
  for each row execute function public.set_updated_at();

create or replace function public.touch_conversation_from_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set updated_at = new.created_at
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists messages_touch_conversation on public.messages;
create trigger messages_touch_conversation
  after insert on public.messages
  for each row execute function public.touch_conversation_from_message();

-- Recipients may only flip delivery / read timestamps — never rewrite content.
create or replace function public.prevent_message_content_tamper()
returns trigger
language plpgsql
as $$
begin
  if new.conversation_id is distinct from old.conversation_id
     or new.sender_id is distinct from old.sender_id
     or new.content is distinct from old.content
     or new.attachment_url is distinct from old.attachment_url
     or new.attachment_name is distinct from old.attachment_name
     or new.attachment_type is distinct from old.attachment_type
     or new.created_at is distinct from old.created_at then
    raise exception 'message content cannot be changed';
  end if;
  return new;
end;
$$;

drop trigger if exists messages_prevent_tamper on public.messages;
create trigger messages_prevent_tamper
  before update on public.messages
  for each row execute function public.prevent_message_content_tamper();

-- Auto-create a profile row when a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  final_username text;
  display text;
  suffix int := 0;
begin
  base_username := coalesce(nullif(trim(new.raw_user_meta_data->>'username'), ''), '');
  if base_username !~ '^[A-Za-z][A-Za-z0-9_]{2,23}$' then
    base_username := 'user_' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;
  final_username := base_username;

  display := coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'), ''), '');
  if char_length(display) < 2 then
    display := final_username;
  end if;

  loop
    begin
      insert into public.profiles (id, username, display_name)
      values (new.id, final_username, display);
      exit;
    exception
      when unique_violation then
        suffix := suffix + 1;
        final_username := substr(base_username, 1, 20) || '_' || suffix;
        if suffix > 20 then
          final_username := 'user_' || substr(replace(new.id::text, '-', ''), 1, 8);
          insert into public.profiles (id, username, display_name)
          values (new.id, final_username, display)
          on conflict (id) do nothing;
          exit;
        end if;
    end;
  end loop;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- RPCs used by the app
-- -----------------------------------------------------------------------------

-- Create or reuse the unique 1-to-1 conversation between me and other_user_id.
-- SECURITY DEFINER: inserting the other member would fail under invoker RLS.
create or replace function public.get_or_create_direct_conversation(other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  conv_id uuid;
  key text;
begin
  if me is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if other_user_id is null or other_user_id = me then
    raise exception 'invalid peer' using errcode = '22023';
  end if;
  if not exists (select 1 from public.profiles p where p.id = other_user_id) then
    raise exception 'user not found' using errcode = 'P0002';
  end if;

  if me < other_user_id then
    key := me::text || ':' || other_user_id::text;
  else
    key := other_user_id::text || ':' || me::text;
  end if;

  select c.id into conv_id
  from public.conversations c
  where c.pair_key = key;

  if conv_id is not null then
    return conv_id;
  end if;

  begin
    insert into public.conversations (pair_key) values (key)
    returning id into conv_id;
    insert into public.conversation_members (conversation_id, user_id)
    values (conv_id, me), (conv_id, other_user_id);
  exception
    when unique_violation then
      select c.id into conv_id
      from public.conversations c
      where c.pair_key = key;
  end;

  return conv_id;
end;
$$;

revoke all on function public.get_or_create_direct_conversation(uuid) from public;
grant execute on function public.get_or_create_direct_conversation(uuid) to authenticated;

create or replace function public.list_my_conversations()
returns table (
  id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  other jsonb,
  last_message jsonb,
  unread bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    c.id,
    c.created_at,
    c.updated_at,
    jsonb_build_object(
      'id', p.id,
      'username', p.username,
      'displayName', p.display_name,
      'avatarUrl', coalesce(p.avatar_url, ''),
      'bio', coalesce(p.bio, ''),
      'lastSeen', (extract(epoch from p.last_seen) * 1000)::bigint,
      'showOnline', p.show_online,
      'showLastSeen', p.show_last_seen,
      'onlineStatus', p.online_status
    ) as other,
    (
      select jsonb_build_object(
        'id', m.id,
        'conversationId', m.conversation_id,
        'senderId', m.sender_id,
        'content', m.content,
        'attachmentUrl', m.attachment_url,
        'attachmentName', m.attachment_name,
        'attachmentType', m.attachment_type,
        'createdAt', (extract(epoch from m.created_at) * 1000)::bigint,
        'deliveredAt', case
          when m.delivered_at is null then null
          else (extract(epoch from m.delivered_at) * 1000)::bigint
        end,
        'readAt', case
          when m.read_at is null then null
          else (extract(epoch from m.read_at) * 1000)::bigint
        end
      )
      from public.messages m
      where m.conversation_id = c.id
      order by m.created_at desc
      limit 1
    ) as last_message,
    (
      select count(*)
      from public.messages m
      where m.conversation_id = c.id
        and m.sender_id <> auth.uid()
        and m.read_at is null
    ) as unread
  from public.conversations c
  join public.conversation_members mine
    on mine.conversation_id = c.id and mine.user_id = auth.uid()
  join public.conversation_members oth
    on oth.conversation_id = c.id and oth.user_id <> auth.uid()
  join public.profiles p on p.id = oth.user_id
  order by c.updated_at desc;
$$;

revoke all on function public.list_my_conversations() from public;
grant execute on function public.list_my_conversations() to authenticated;

create or replace function public.mark_conversation_read(conv_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not public.is_conversation_member(conv_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.messages
  set
    read_at = coalesce(read_at, now()),
    delivered_at = coalesce(delivered_at, now())
  where conversation_id = conv_id
    and sender_id <> auth.uid()
    and read_at is null;
end;
$$;

revoke all on function public.mark_conversation_read(uuid) from public;
grant execute on function public.mark_conversation_read(uuid) to authenticated;

create or replace function public.mark_conversation_delivered(conv_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not public.is_conversation_member(conv_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.messages
  set delivered_at = now()
  where conversation_id = conv_id
    and sender_id <> auth.uid()
    and delivered_at is null;
end;
$$;

revoke all on function public.mark_conversation_delivered(uuid) from public;
grant execute on function public.mark_conversation_delivered(uuid) to authenticated;

create or replace function public.touch_presence(is_online boolean)
returns void
language sql
security invoker
set search_path = public
as $$
  update public.profiles
  set
    online_status = coalesce(is_online, false),
    last_seen = now()
  where id = auth.uid();
$$;

revoke all on function public.touch_presence(boolean) from public;
grant execute on function public.touch_presence(boolean) to authenticated;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

-- Profiles: any signed-in user can search people. Email lives in auth.users,
-- not here. Only the owner may insert/update their row.
drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Conversations: members only. Inserts go through get_or_create_direct_conversation.
drop policy if exists "conversations_select_member" on public.conversations;
create policy "conversations_select_member"
  on public.conversations for select
  to authenticated
  using (public.is_conversation_member(id));

drop policy if exists "conversations_update_member" on public.conversations;
create policy "conversations_update_member"
  on public.conversations for update
  to authenticated
  using (public.is_conversation_member(id))
  with check (public.is_conversation_member(id));

-- Members: visible only inside conversations you belong to. No client inserts.
drop policy if exists "members_select_own_conversations" on public.conversation_members;
create policy "members_select_own_conversations"
  on public.conversation_members for select
  to authenticated
  using (public.is_conversation_member(conversation_id));

-- Messages
drop policy if exists "messages_select_member" on public.messages;
create policy "messages_select_member"
  on public.messages for select
  to authenticated
  using (public.is_conversation_member(conversation_id));

drop policy if exists "messages_insert_self" on public.messages;
create policy "messages_insert_self"
  on public.messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and public.is_conversation_member(conversation_id)
  );

drop policy if exists "messages_update_status" on public.messages;
create policy "messages_update_status"
  on public.messages for update
  to authenticated
  using (
    public.is_conversation_member(conversation_id)
    and sender_id <> auth.uid()
  )
  with check (
    public.is_conversation_member(conversation_id)
    and sender_id <> auth.uid()
  );

-- -----------------------------------------------------------------------------
-- Grants
-- -----------------------------------------------------------------------------

grant usage on schema public to postgres, anon, authenticated, service_role;

grant select, insert, update on public.profiles to authenticated;
grant select, update on public.conversations to authenticated;
grant select on public.conversation_members to authenticated;
grant select, insert, update on public.messages to authenticated;

-- -----------------------------------------------------------------------------
-- Realtime
-- -----------------------------------------------------------------------------

alter table public.profiles replica identity full;
alter table public.conversations replica identity full;
alter table public.conversation_members replica identity full;
alter table public.messages replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    execute 'alter publication supabase_realtime add table public.messages';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'conversations'
  ) then
    execute 'alter publication supabase_realtime add table public.conversations';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'conversation_members'
  ) then
    execute 'alter publication supabase_realtime add table public.conversation_members';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profiles'
  ) then
    execute 'alter publication supabase_realtime add table public.profiles';
  end if;
end
$$;

-- -----------------------------------------------------------------------------
-- Storage buckets + policies
-- -----------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'avatars',
    'avatars',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
  ),
  (
    'attachments',
    'attachments',
    false,
    4194304,
    array[
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'application/pdf', 'text/plain', 'application/zip'
    ]::text[]
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Avatars: public read, owner write. Path: {user_id}/avatar.jpg
drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars_owner_insert" on storage.objects;
create policy "avatars_owner_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars_owner_update" on storage.objects;
create policy "avatars_owner_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars_owner_delete" on storage.objects;
create policy "avatars_owner_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Attachments: private. Path: {conversation_id}/{user_id}/{filename}
drop policy if exists "attachments_member_read" on storage.objects;
create policy "attachments_member_read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'attachments'
    and public.is_conversation_member(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "attachments_owner_insert" on storage.objects;
create policy "attachments_owner_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'attachments'
    and auth.uid()::text = (storage.foldername(name))[2]
    and public.is_conversation_member(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "attachments_owner_delete" on storage.objects;
create policy "attachments_owner_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'attachments'
    and auth.uid()::text = (storage.foldername(name))[2]
  );
