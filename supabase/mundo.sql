-- Área Mundo (tela "Mesa do mestre"), numa tabela só: public.mesa_conteudo.
-- Decisão do Lucas (03/11/2026): nada de tabela nova a cada recurso. Cada linha tem um "tipo":
--   'pagina' = lugar, PNJ ou sessão (categoria), com estado oculto/conhecido/visitado e o segredo do mestre;
--   'mapa'   = imagem de mapa (no bucket mesas, pasta <mesa>/mundo/).
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
