-- Área Mundo (tela "Mesa do mestre"), numa tabela só: public.mesa_conteudo.
-- Decisão do Lucas (03/11/2026): nada de tabela nova a cada recurso. Cada linha tem um "tipo":
--   'pagina' = lugar, PNJ ou sessão (categoria), com estado oculto/conhecido/visitado e o segredo do mestre;
--   'mapa'   = imagem de mapa (era a pasta <mesa>/mundo/; desde 04/11 é mundos/<mundo>/, ver o fim do arquivo).
-- Recurso novo da mesa (desenho do editor de mapas, marcadores, notas...) entra como TIPO NOVO aqui,
-- usando as colunas que servirem e "dados" (jsonb) para o resto.
-- O mestre lê e escreve direto; o jogador só recebe o mundo pela função mundo_jogador, já filtrado
-- (por isso o segredo pode morar na mesma linha: o jogador nunca lê a tabela).
-- Migração "mundo_tabela_unica".

create table public.mesa_conteudo (
  id uuid primary key default gen_random_uuid(),
  mesa_id uuid not null references public.mesas(id) on delete cascade,
  tipo text not null,                          -- 'pagina' | 'mapa' | (futuros)
  nome text not null,
  texto text not null default '',              -- página: o que os jogadores leem quando visitado
  segredo text not null default '',            -- página: só o mestre
  categoria text,                              -- página: Lugar, PNJ, Sessão...
  estado text check (estado in ('oculto','conhecido','visitado')),
  mapa_id uuid references public.mesa_conteudo(id) on delete set null,  -- página: em que mapa está o alfinete
  x real check (x between 0 and 1),
  y real check (y between 0 and 1),
  na_cena boolean not null default false,
  imagem text,                                 -- mapa: caminho no bucket mesas
  largura int check (largura > 0),
  altura int check (altura > 0),
  lugar_id uuid references public.mesa_conteudo(id) on delete cascade, -- mapa: página que o abre; vazio = mapa do mundo
  dados jsonb not null default '{}',           -- para os tipos futuros
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index on public.mesa_conteudo (mesa_id, tipo);
create index on public.mesa_conteudo (mapa_id);
create index on public.mesa_conteudo (lugar_id);

create trigger mesa_conteudo_atualizado before update on public.mesa_conteudo
  for each row execute function public.tocar_atualizado();

alter table public.mesa_conteudo enable row level security;
create policy "mesa_conteudo: só o mestre" on public.mesa_conteudo for all to authenticated
  using (privado.eh_mestre(mesa_id)) with check (privado.eh_mestre(mesa_id));

-- [[Nome]] de página que o jogador não pode ver vira [[?]], para o nome não vazar no texto
create function privado.mascarar_links(t text, nomes text[]) returns text
language plpgsql immutable set search_path to '' as $$
declare n text;
begin
  for n in select distinct (regexp_matches(t, '\[\[([^\]]+)\]\]', 'g'))[1] loop
    if not (lower(trim(n)) = any (nomes)) then t := replace(t, '[[' || n || ']]', '[[?]]'); end if;
  end loop;
  return t;
end $$;

-- o mundo como o jogador vê: sem ocultos, conhecido só com o nome, mapa só de lugar visitado
create function public.mundo_jogador(p_mesa uuid) returns jsonb
language plpgsql stable security definer set search_path to '' as $$
declare nomes text[]; r jsonb;
begin
  if not privado.esta_na_mesa(p_mesa) then raise exception 'Você não está nesta mesa'; end if;
  select coalesce(array_agg(lower(trim(nome))), '{}') into nomes
    from public.mesa_conteudo where mesa_id = p_mesa and tipo = 'pagina' and estado <> 'oculto';
  select jsonb_build_object(
    'paginas', coalesce((select jsonb_agg(jsonb_build_object(
        'id', p.id, 'tipo', p.categoria, 'nome', p.nome, 'estado', p.estado,
        'texto', case when p.estado = 'visitado' then privado.mascarar_links(p.texto, nomes) else '' end,
        'mapa_id', p.mapa_id, 'x', p.x, 'y', p.y, 'na_cena', false, 'atualizado_em', p.atualizado_em) order by p.nome)
      from public.mesa_conteudo p where p.mesa_id = p_mesa and p.tipo = 'pagina' and p.estado <> 'oculto'), '[]'),
    'mapas', coalesce((select jsonb_agg(jsonb_build_object(
        'id', m.id, 'nome', m.nome, 'imagem', m.imagem, 'largura', m.largura, 'altura', m.altura, 'lugar_id', m.lugar_id) order by m.criado_em)
      from public.mesa_conteudo m where m.mesa_id = p_mesa and m.tipo = 'mapa'
        and (m.lugar_id is null or exists (select 1 from public.mesa_conteudo l where l.id = m.lugar_id and l.estado = 'visitado'))), '[]')
  ) into r;
  return r;
end $$;
revoke execute on function public.mundo_jogador(uuid) from public, anon;
grant execute on function public.mundo_jogador(uuid) to authenticated;

-- imagem de mapa do mundo que o jogador pode baixar: mapa revelado, ou o que o mestre pôs na tela da sala
create function privado.mapa_visivel(c text) returns boolean
language sql stable security definer set search_path to '' as $$
  select exists (select 1 from public.mesa_conteudo m where m.tipo = 'mapa' and m.imagem = c and privado.esta_na_mesa(m.mesa_id)
                   and (m.lugar_id is null or exists (select 1 from public.mesa_conteudo l where l.id = m.lugar_id and l.estado = 'visitado')))
      or exists (select 1 from public.mesas s where s.imagem_atual = c and privado.esta_na_mesa(s.id))
$$;

create policy "mesas: mapas do mundo revelados" on storage.objects for select to authenticated
  using (bucket_id = 'mesas' and (storage.foldername(name))[2] = 'mundo' and privado.mapa_visivel(name));

drop policy "mesas: mestre envia" on storage.objects;
create policy "mesas: mestre envia" on storage.objects for insert to authenticated
  with check (bucket_id = 'mesas' and privado.eh_mestre_txt((storage.foldername(name))[1])
              and (storage.foldername(name))[2] = any (array['mapas','mestre','jogadores','mundo']));
drop policy "mesas: mestre muda" on storage.objects;
create policy "mesas: mestre muda" on storage.objects for update to authenticated
  using (bucket_id = 'mesas' and privado.eh_mestre_txt((storage.foldername(name))[1]))
  with check (bucket_id = 'mesas' and privado.eh_mestre_txt((storage.foldername(name))[1])
              and (storage.foldername(name))[2] = any (array['mapas','mestre','jogadores','mundo']));


-- ===================================================================================================
-- MUNDOS DO MESTRE (04/11/2026), na mesma tabela. Migrações mundos_1 a mundos_6.
-- O mundo é do mestre e serve a várias mesas; cada mesa tem as próprias descobertas.
--   'mundo'      = a linha-raiz, com dono_id (o mestre);
--   'pagina'     = lugar, PNJ ou sessão do mundo (mundo_id);
--   'mapa'       = mapa do mundo (mundo_id); com lugar_id é a planta daquele lugar; o desenho fica em dados.desenho;
--   'descoberta' = o que UMA mesa já sabe de um lugar (mesa_id + lugar_id, estado e na_cena).
-- Arquivos dos mundos no bucket mesas, pasta mundos/<mundo_id>/.
-- Testado em 04/11/2026: 25 checagens (2 mesas no mesmo mundo, intruso, apagar lugar e mundo), tudo OK.

-- mundos_1_colunas
alter table public.mesa_conteudo
  add column dono_id uuid references auth.users(id) on delete cascade,
  add column mundo_id uuid references public.mesa_conteudo(id) on delete cascade,
  alter column mesa_id drop not null,
  add constraint mesa_conteudo_dono_check check ((tipo = 'mundo' and dono_id is not null) or mundo_id is not null or mesa_id is not null);
create index on public.mesa_conteudo (mundo_id, tipo);
create index on public.mesa_conteudo (dono_id) where tipo = 'mundo';
create unique index mesa_conteudo_descoberta_unica on public.mesa_conteudo (mesa_id, lugar_id) where tipo = 'descoberta';

-- mundos_2_mesa_usa_mundo
alter table public.mesas add column mundo_id uuid references public.mesa_conteudo(id) on delete set null;

-- mundos_3_regras_de_acesso
create function privado.eh_dono_mundo(w uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.mesa_conteudo where id = w and tipo = 'mundo' and dono_id = (select auth.uid()))
$$;
create function privado.eh_dono_mundo_txt(w text) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.mesa_conteudo where id::text = w and tipo = 'mundo' and dono_id = (select auth.uid()))
$$;
create function privado.pode_mexer(t text, mesa uuid, mundo uuid, dono uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select case
    when t = 'mundo' then dono = (select auth.uid()) and mundo is null
    when mundo is not null then privado.eh_dono_mundo(mundo)
    else mesa is not null and privado.eh_mestre(mesa) end
$$;
alter policy "mesa_conteudo: só o mestre" on public.mesa_conteudo
  using (privado.pode_mexer(tipo, mesa_id, mundo_id, dono_id)) with check (privado.pode_mexer(tipo, mesa_id, mundo_id, dono_id));
alter policy "mesa_conteudo: só o mestre" on public.mesa_conteudo rename to "mesa_conteudo: dono do mundo ou mestre da mesa";
-- a mesa só usa mundo do próprio mestre
create function privado.mesa_usa_mundo_seu() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.mundo_id is not null and (tg_op = 'INSERT' or new.mundo_id is distinct from old.mundo_id) and not privado.eh_dono_mundo(new.mundo_id) then
    raise exception 'Este mundo não é seu';
  end if;
  return new;
end $$;
create trigger mesas_mundo_do_mestre before insert or update of mundo_id on public.mesas for each row execute function privado.mesa_usa_mundo_seu();

-- mundos_4_o_que_o_jogador_ve: o mundo da mesa, com o estado de cada lugar NESTA mesa (sem descoberta = oculto)
create or replace function public.mundo_jogador(p_mesa uuid) returns jsonb language sql stable security definer set search_path = '' as $$
  with w as (select mundo_id as id from public.mesas where id = p_mesa and privado.esta_na_mesa(p_mesa)),
  est as (
    select p.*, coalesce(d.estado, 'oculto') as est
    from public.mesa_conteudo p
    left join public.mesa_conteudo d on d.tipo = 'descoberta' and d.mesa_id = p_mesa and d.lugar_id = p.id
    where p.tipo = 'pagina' and p.mundo_id = (select id from w)),
  nomes as (select coalesce(array_agg(lower(trim(nome))), '{}') as n from est where est <> 'oculto')
  select case when not privado.esta_na_mesa(p_mesa) then null else jsonb_build_object(
    'mundo', (select jsonb_build_object('id', m.id, 'nome', m.nome) from public.mesa_conteudo m where m.id = (select id from w)),
    'paginas', coalesce((select jsonb_agg(jsonb_build_object(
        'id', e.id, 'tipo', e.categoria, 'nome', e.nome, 'estado', e.est,
        'texto', case when e.est = 'visitado' then privado.mascarar_links(e.texto, (select n from nomes)) else '' end,
        'mapa_id', e.mapa_id, 'x', e.x, 'y', e.y, 'na_cena', false, 'atualizado_em', e.atualizado_em) order by e.nome)
      from est e where e.est <> 'oculto'), '[]'),
    'mapas', coalesce((select jsonb_agg(jsonb_build_object(
        'id', m.id, 'nome', m.nome, 'imagem', m.imagem, 'largura', m.largura, 'altura', m.altura, 'lugar_id', m.lugar_id,
        'desenho', m.dados -> 'desenho') order by m.criado_em)
      from public.mesa_conteudo m where m.tipo = 'mapa' and m.mundo_id = (select id from w)
        and (m.lugar_id is null or exists (select 1 from est e where e.id = m.lugar_id and e.est = 'visitado'))), '[]')
  ) end
$$;
create or replace function privado.mapa_visivel(c text) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
      select 1 from public.mesa_conteudo m join public.mesas s on s.mundo_id = m.mundo_id
      where m.tipo = 'mapa' and m.imagem = c and privado.esta_na_mesa(s.id)
        and (m.lugar_id is null or exists (select 1 from public.mesa_conteudo d where d.tipo = 'descoberta' and d.mesa_id = s.id and d.lugar_id = m.lugar_id and d.estado = 'visitado')))
      or exists (select 1 from public.mesas s where s.imagem_atual = c and privado.esta_na_mesa(s.id))
$$;

-- mundos_5_arquivos_dos_mundos (pasta mundos/<mundo_id>/)
create policy "mundos: dono e mesa revelada veem" on storage.objects for select to authenticated
  using (bucket_id = 'mesas' and (storage.foldername(name))[1] = 'mundos' and (privado.eh_dono_mundo_txt((storage.foldername(name))[2]) or privado.mapa_visivel(name)));
create policy "mundos: dono envia" on storage.objects for insert to authenticated
  with check (bucket_id = 'mesas' and (storage.foldername(name))[1] = 'mundos' and privado.eh_dono_mundo_txt((storage.foldername(name))[2]));
create policy "mundos: dono muda" on storage.objects for update to authenticated
  using (bucket_id = 'mesas' and (storage.foldername(name))[1] = 'mundos' and privado.eh_dono_mundo_txt((storage.foldername(name))[2]))
  with check (bucket_id = 'mesas' and (storage.foldername(name))[1] = 'mundos' and privado.eh_dono_mundo_txt((storage.foldername(name))[2]));
create policy "mundos: dono apaga" on storage.objects for delete to authenticated
  using (bucket_id = 'mesas' and (storage.foldername(name))[1] = 'mundos' and privado.eh_dono_mundo_txt((storage.foldername(name))[2]));

-- mundos_6_limpa_regras_antigas_storage: some a pasta antiga <mesa>/mundo/
drop policy "mesas: mapas do mundo revelados" on storage.objects;
drop policy "mesas: mestre envia" on storage.objects;
drop policy "mesas: mestre muda" on storage.objects;
create policy "mesas: mestre envia" on storage.objects for insert to authenticated
  with check (bucket_id = 'mesas' and privado.eh_mestre_txt((storage.foldername(name))[1]) and (storage.foldername(name))[2] = any (array['mapas','mestre','jogadores']));
create policy "mesas: mestre muda" on storage.objects for update to authenticated
  using (bucket_id = 'mesas' and privado.eh_mestre_txt((storage.foldername(name))[1]))
  with check (bucket_id = 'mesas' and privado.eh_mestre_txt((storage.foldername(name))[1]) and (storage.foldername(name))[2] = any (array['mapas','mestre','jogadores']));
