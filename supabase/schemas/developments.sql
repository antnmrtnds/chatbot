create table public.developments (
  id serial not null,
  content text not null,
  embedding public.vector null,
  chunk_id text null,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  flat_id text null,
  price text null,
  constraint developments_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists developments_embedding_idx on public.developments using ivfflat (embedding vector_cosine_ops)
with
  (lists = '100') TABLESPACE pg_default;

create index IF not exists developments_embedding_idx1 on public.developments using ivfflat (embedding vector_cosine_ops)
with
  (lists = '100') TABLESPACE pg_default;

create trigger embedding_trigger
after INSERT
or
update OF content on developments for EACH row
execute FUNCTION handle_embedding_generation ();