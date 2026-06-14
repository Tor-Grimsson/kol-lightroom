-- In-app publish: a public Storage bucket for web masters.
-- (MVP — ARCH §6 says bytes belong in B2; this is the zero-extra-credentials
-- path. Migrating the publish byte-path to B2 presigned uploads is a follow-up.)
insert into storage.buckets (id, name, public)
values ('published', 'published', true)
on conflict (id) do nothing;
