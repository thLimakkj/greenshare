-- LIMPEZA: permite rodar este arquivo várias vezes sem erro.
-- Atenção: apaga as tabelas do GreenShare e os dados que estiverem nelas.
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.reservar_doacao(uuid);
drop function if exists public.cancelar_reserva(uuid);
drop function if exists public.concluir_entrega(uuid);
drop table if exists public.interacoes cascade;
drop table if exists public.doacoes cascade;
drop table if exists public.perfis cascade;
drop policy if exists "imagens_leitura" on storage.objects;
drop policy if exists "imagens_upload" on storage.objects;
drop policy if exists "imagens_delete" on storage.objects;

-- GreenShare: rode este arquivo no SQL Editor do projeto Supabase (organização GreenShare).
-- Nomes sem acento (perfis, doacoes, interacoes) para evitar problemas com PostgREST/TypeScript.

create table public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  telefone text,
  endereco text,
  admin boolean not null default false,
  criado_em timestamptz not null default now()
);

create table public.doacoes (
  id uuid primary key default gen_random_uuid(),
  id_doador uuid not null references public.perfis(id) on delete cascade,
  titulo text not null,
  descricao text,
  categoria text not null check (categoria in ('Pratos prontos','Hortifruti','Grãos e cereais','Panificadoras','Outros')),
  quantidade text not null,
  url_imagem text,
  status text not null default 'Disponível' check (status in ('Disponível','Reservado','Entregue')),
  id_receptor uuid references public.perfis(id) on delete set null,
  criada_em timestamptz not null default now(),
  constraint doador_diferente_receptor check (id_receptor is null or id_receptor <> id_doador)
);

create table public.interacoes (
  id uuid primary key default gen_random_uuid(),
  id_doacao uuid not null references public.doacoes(id) on delete cascade,
  id_usuario uuid not null references public.perfis(id) on delete cascade,
  acao text not null check (acao in ('reservou','cancelou_reserva','concluiu_entrega')),
  criada_em timestamptz not null default now()
);

create index on public.doacoes (status, criada_em desc);
create index on public.doacoes (id_doador);
create index on public.doacoes (id_receptor);

-- Perfil criado automaticamente no cadastro. Todo usuário pode doar E receber.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfis (id, nome)
  values (new.id, coalesce(nullif(new.raw_user_meta_data->>'nome',''), split_part(new.email,'@',1)));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.perfis enable row level security;
alter table public.doacoes enable row level security;
alter table public.interacoes enable row level security;

create policy "perfis_select" on public.perfis for select to authenticated using (true);
create policy "perfis_update_proprio" on public.perfis for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid() and admin = (select p.admin from public.perfis p where p.id = auth.uid()));

create policy "doacoes_select" on public.doacoes for select to authenticated using (true);
create policy "doacoes_insert" on public.doacoes for insert to authenticated
  with check (id_doador = auth.uid() and status = 'Disponível' and id_receptor is null);
create policy "doacoes_update_doador" on public.doacoes for update to authenticated
  using (id_doador = auth.uid()) with check (id_doador = auth.uid());
create policy "doacoes_delete_doador" on public.doacoes for delete to authenticated
  using (id_doador = auth.uid() and status = 'Disponível');

create policy "interacoes_select" on public.interacoes for select to authenticated
  using (id_usuario = auth.uid() or exists (select 1 from public.doacoes d where d.id = id_doacao and d.id_doador = auth.uid()));

-- Mudanças de status passam por funções (atômicas, com validação e histórico)
create function public.reservar_doacao(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update doacoes set status='Reservado', id_receptor=auth.uid()
   where id=p_id and status='Disponível' and id_doador<>auth.uid();
  if not found then raise exception 'Doação indisponível para reserva'; end if;
  insert into interacoes(id_doacao,id_usuario,acao) values (p_id,auth.uid(),'reservou');
end $$;

create function public.cancelar_reserva(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update doacoes set status='Disponível', id_receptor=null
   where id=p_id and status='Reservado' and (id_doador=auth.uid() or id_receptor=auth.uid());
  if not found then raise exception 'Reserva não encontrada'; end if;
  insert into interacoes(id_doacao,id_usuario,acao) values (p_id,auth.uid(),'cancelou_reserva');
end $$;

create function public.concluir_entrega(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update doacoes set status='Entregue'
   where id=p_id and status='Reservado' and id_doador=auth.uid();
  if not found then raise exception 'Entrega não pode ser concluída'; end if;
  insert into interacoes(id_doacao,id_usuario,acao) values (p_id,auth.uid(),'concluiu_entrega');
end $$;

revoke all on function public.reservar_doacao, public.cancelar_reserva, public.concluir_entrega from public, anon;
grant execute on function public.reservar_doacao, public.cancelar_reserva, public.concluir_entrega to authenticated;

-- Realtime
alter publication supabase_realtime add table public.doacoes;

-- Storage (bucket público)
insert into storage.buckets (id, name, public) values ('imagens-doacoes','imagens-doacoes',true) on conflict do nothing;
create policy "imagens_leitura" on storage.objects for select using (bucket_id='imagens-doacoes');
create policy "imagens_upload" on storage.objects for insert to authenticated
  with check (bucket_id='imagens-doacoes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "imagens_delete" on storage.objects for delete to authenticated
  using (bucket_id='imagens-doacoes' and (storage.foldername(name))[1] = auth.uid()::text);

-- Permissões da Data API (projetos novos do Supabase não expõem tabelas automaticamente).
-- O RLS acima continua limitando o que cada usuário pode ver e alterar.
grant usage on schema public to authenticated;
grant select on public.perfis to authenticated;
grant update (nome, telefone, endereco) on public.perfis to authenticated;
grant select, insert, update, delete on public.doacoes to authenticated;
grant select on public.interacoes to authenticated;
