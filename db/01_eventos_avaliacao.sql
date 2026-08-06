-- ============================================================
-- EVENTOS, CARTEIRA DE PALESTRAS E FORMULÁRIO DE AVALIAÇÃO
-- Hub Pedagógico — FebraHub
--
-- Aplicado no Supabase em 06/08/2026.
-- Arquivo já aplicado não se edita: mudança vira arquivo novo com o
-- número seguinte. Ver 02_eventos_sympla_id.sql.
--
-- O que cria:
--   palestras            a carteira — uma linha por palestra que existe como produto
--   eventos              uma edição, com data, token e janela do link
--   evento_perguntas     perguntas do formulário: as da Elis + o núcleo fixo
--   evento_respostas     um formulário enviado (anônimo)
--   evento_resposta_itens  resposta a cada pergunta
--
-- Permissão: usa `pode_ver(setor)` e `meu_papel()`, que já existem
-- neste banco. Todo evento carrega o setor dono (padrão 'pedagogico'),
-- então a mesma regra serve se amanhã o Comercial quiser eventos.
--
-- Escrita passa por função `security definer` — não existe policy de
-- insert nessas tabelas. Só `evento_abrir` e `evento_responder` são
-- executáveis por `anon`.
--
-- Pressupõe: perfis(id uuid, nome, setor, papel) ligada a auth.users.
-- ============================================================

-- ------------------------------------------------------------
-- TIPOS
-- ------------------------------------------------------------
create type tipo_evento as enum ('palestra','workshop','mentoria','curso');

create type tipo_pergunta as enum
  ('escala_0_10','escala_1_5','sim_nao','escolha_unica','texto_livre');

create type status_carteira as enum ('ativa','em_observacao','aposentada');


-- ------------------------------------------------------------
-- CARTEIRA
-- Separada de `eventos` porque a decisão que interessa
-- ("esta palestra continua?") é sobre a palestra, não sobre a noite.
-- ------------------------------------------------------------
create table palestras (
  id            bigserial primary key,
  titulo        text not null,
  tema          text,
  setor         text not null default 'pedagogico',
  status        status_carteira not null default 'ativa',
  status_em     timestamptz,
  status_motivo text,
  criado_em     timestamptz not null default now()
);

-- Palestra repetida precisa cair na MESMA linha, senão o NPS
-- acumulado se parte em duas e não decide nada.
create unique index palestras_titulo_unico on palestras (lower(btrim(titulo)));


-- ------------------------------------------------------------
-- EDIÇÕES
-- O token nasce com o evento e NUNCA muda: a Elis gera o QR code
-- fora do sistema, às vezes na véspera. Regenerar token mataria
-- material já impresso sem ninguém perceber.
-- ------------------------------------------------------------
create table eventos (
  id            bigserial primary key,
  codigo        text unique not null,
  tipo          tipo_evento not null,
  setor         text not null default 'pedagogico',
  palestra_id   bigint references palestras(id),      -- nulo em evento avulso
  titulo        text not null,
  objetivo      text,                                 -- orienta as perguntas e abre o formulário
  data_evento   date not null,
  local         text,
  responsavel_id uuid references perfis(id),          -- quem apresenta
  token         text unique not null default replace(gen_random_uuid()::text, '-', ''),
  abre_em       timestamptz not null,
  fecha_em      timestamptz not null,
  travado_em    timestamptz,                          -- marcado na 1ª resposta
  criado_em     timestamptz not null default now(),
  check (fecha_em > abre_em)
);

create index eventos_palestra on eventos (palestra_id, data_evento desc);
create index eventos_setor    on eventos (setor, data_evento desc);


-- ------------------------------------------------------------
-- PERGUNTAS
-- Ordem de exibição é sempre `order by nucleo, ordem`:
-- false < true no Postgres, então as perguntas da Elis saem
-- primeiro e o núcleo fecha o formulário. Por isso a chave única
-- inclui `nucleo` — os dois blocos começam em 1.
-- ------------------------------------------------------------
create table evento_perguntas (
  id          bigserial primary key,
  evento_id   bigint not null references eventos(id) on delete cascade,
  ordem       int    not null,
  texto       text   not null,
  tipo        tipo_pergunta not null,
  obrigatoria boolean not null default true,
  nucleo      boolean not null default false,
  opcoes      text[],
  unique (evento_id, nucleo, ordem),
  check (tipo <> 'escolha_unica' or array_length(opcoes, 1) >= 2)
);


-- ------------------------------------------------------------
-- RESPOSTAS
-- Anônimas. Não existe coluna que ligue a resposta a uma pessoa,
-- e é de propósito: o formulário promete isso na tela.
-- ------------------------------------------------------------
create table evento_respostas (
  id         bigserial primary key,
  evento_id  bigint not null references eventos(id) on delete cascade,
  enviado_em timestamptz not null default now()
);

create index evento_respostas_evento on evento_respostas (evento_id);

create table evento_resposta_itens (
  resposta_id bigint not null references evento_respostas(id) on delete cascade,
  pergunta_id bigint not null references evento_perguntas(id),
  valor_num   numeric,
  valor_texto text,
  primary key (resposta_id, pergunta_id),
  check (valor_num is not null or nullif(btrim(valor_texto), '') is not null)
);

create index evento_resposta_itens_pergunta on evento_resposta_itens (pergunta_id);


-- ============================================================
-- TRAVA: pergunta não muda depois da primeira resposta
--
-- Sem isso, editar uma pergunta no meio do evento deixa as
-- respostas anteriores penduradas numa pergunta que aquelas
-- pessoas não viram. A média vira mentira e ninguém percebe.
-- ============================================================
create or replace function evento_travar_na_primeira_resposta()
returns trigger language plpgsql
set search_path = public as $$
begin
  update eventos
     set travado_em = now()
   where id = new.evento_id
     and travado_em is null;
  return new;
end $$;

create trigger trg_evento_travar
after insert on evento_respostas
for each row execute function evento_travar_na_primeira_resposta();


create or replace function evento_pergunta_imutavel()
returns trigger language plpgsql
set search_path = public as $$
declare
  v_evento bigint := coalesce(new.evento_id, old.evento_id);
begin
  if exists (select 1 from eventos where id = v_evento and travado_em is not null) then
    raise exception 'Este evento já recebeu respostas. As perguntas não podem mais mudar.';
  end if;
  return coalesce(new, old);
end $$;

create trigger trg_pergunta_imutavel
before insert or update or delete on evento_perguntas
for each row execute function evento_pergunta_imutavel();


-- ============================================================
-- FUNÇÕES DE ESCRITA (usuário logado)
-- ============================================================

-- ------------------------------------------------------------
-- criar_evento
-- Cria a edição, gera código e token, reaproveita a palestra da
-- carteira se o título já existir, e insere o núcleo fixo.
--
-- Janela padrão: abre à meia-noite do dia do evento e fecha três
-- dias depois — para uma palestra à noite, dá as ~48h combinadas.
-- ------------------------------------------------------------
create or replace function criar_evento(
  p_tipo          tipo_evento,
  p_titulo        text,
  p_data_evento   date,
  p_objetivo      text default null,
  p_local         text default null,
  p_responsavel_id uuid default null,
  p_tema          text default null,
  p_setor         text default 'pedagogico',
  p_abre_em       timestamptz default null,
  p_fecha_em      timestamptz default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_palestra      bigint;
  v_codigo        text;
  v_prefixo       text;
  v_ano           text := to_char(p_data_evento, 'YYYY');
  v_seq           int;
  v_abre          timestamptz;
  v_fecha         timestamptz;
  v_evento        bigint;
  v_token         text;
  v_responsavel   uuid;
  v_nova_carteira boolean := false;
begin
  if auth.uid() is null then
    raise exception 'Faça login para criar evento';
  end if;

  if not pode_ver(p_setor) then
    raise exception 'Sem permissão para criar evento no setor %', p_setor;
  end if;

  if coalesce(btrim(p_titulo), '') = '' then
    raise exception 'Informe o título do evento';
  end if;

  if p_data_evento is null then
    raise exception 'Informe a data do evento';
  end if;

  -- ---------- quem apresenta ----------
  v_responsavel := coalesce(p_responsavel_id, auth.uid());

  if not exists (select 1 from perfis where id = v_responsavel) then
    raise exception 'Responsável não encontrado';
  end if;

  -- membro só coloca a si mesmo como responsável
  if meu_papel() <> 'admin' and v_responsavel <> auth.uid() then
    raise exception 'Só a coordenação define outro responsável';
  end if;

  -- ---------- carteira: reaproveita antes de duplicar ----------
  if p_tipo = 'palestra' then
    select id into v_palestra
      from palestras
     where lower(btrim(titulo)) = lower(btrim(p_titulo));

    if v_palestra is null then
      insert into palestras (titulo, tema, setor)
      values (btrim(p_titulo), nullif(btrim(coalesce(p_tema, '')), ''), p_setor)
      returning id into v_palestra;
      v_nova_carteira := true;
    end if;
  end if;

  -- ---------- código ----------
  v_prefixo := case p_tipo
                 when 'palestra' then 'PAL'
                 when 'workshop' then 'WKS'
                 when 'mentoria' then 'MTG'
                 else 'CUR'
               end;

  select coalesce(max(substring(codigo from '\d+$')::int), 0) + 1
    into v_seq
    from eventos
   where codigo like v_prefixo || '-' || v_ano || '-%';

  v_codigo := v_prefixo || '-' || v_ano || '-' || lpad(v_seq::text, 3, '0');

  -- ---------- janela do link ----------
  v_abre  := coalesce(p_abre_em,  (p_data_evento::timestamp at time zone 'America/Bahia'));
  v_fecha := coalesce(p_fecha_em, v_abre + interval '3 days');

  insert into eventos (codigo, tipo, setor, palestra_id, titulo, objetivo,
                       data_evento, local, responsavel_id, abre_em, fecha_em)
  values (v_codigo, p_tipo, p_setor, v_palestra, btrim(p_titulo),
          nullif(btrim(coalesce(p_objetivo, '')), ''),
          p_data_evento,
          nullif(btrim(coalesce(p_local, '')), ''),
          v_responsavel, v_abre, v_fecha)
  returning id, token into v_evento, v_token;

  -- ---------- núcleo fixo ----------
  -- Não editáveis, sempre no fim do formulário. O NPS é o primeiro
  -- dos três de propósito: quem abandona no meio não pode levar
  -- embora justamente o número da decisão de carteira.
  insert into evento_perguntas (evento_id, ordem, texto, tipo, obrigatoria, nucleo) values
    (v_evento, 1, 'De 0 a 10, quanto você recomendaria esta palestra a um colega?',
     'escala_0_10', true,  true),
    (v_evento, 2, 'O que você mudaria nesta palestra?',
     'texto_livre', false, true),
    (v_evento, 3, 'Qual tema você gostaria de ver numa próxima palestra?',
     'texto_livre', false, true);

  return jsonb_build_object(
    'id',               v_evento,
    'codigo',           v_codigo,
    'token',            v_token,
    'palestra_id',      v_palestra,
    'nova_na_carteira', v_nova_carteira,
    'abre_em',          v_abre,
    'fecha_em',         v_fecha
  );
end $$;

revoke execute on function criar_evento from anon;


-- ------------------------------------------------------------
-- salvar_perguntas
-- Substitui o bloco de perguntas da Elis. O núcleo nunca é tocado.
-- Formato esperado:
--   [{"texto":"...","tipo":"escala_1_5","obrigatoria":true,"opcoes":null}, ...]
-- ------------------------------------------------------------
create or replace function salvar_perguntas(
  p_evento_id bigint,
  p_perguntas jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_setor text;
  v_item  jsonb;
  v_ordem int := 0;
  v_total int;
begin
  select setor into v_setor from eventos where id = p_evento_id;

  if v_setor is null then
    raise exception 'Evento não encontrado';
  end if;

  if not pode_ver(v_setor) then
    raise exception 'Sem permissão para editar este evento';
  end if;

  if exists (select 1 from eventos where id = p_evento_id and travado_em is not null) then
    raise exception 'Este evento já recebeu respostas. As perguntas não podem mais mudar.';
  end if;

  if jsonb_typeof(p_perguntas) <> 'array' then
    raise exception 'Formato inválido: envie uma lista de perguntas';
  end if;

  delete from evento_perguntas where evento_id = p_evento_id and not nucleo;

  for v_item in select * from jsonb_array_elements(p_perguntas)
  loop
    v_ordem := v_ordem + 1;

    if coalesce(btrim(v_item->>'texto'), '') = '' then
      raise exception 'A pergunta % está sem texto', v_ordem;
    end if;

    insert into evento_perguntas (evento_id, ordem, texto, tipo, obrigatoria, nucleo, opcoes)
    values (
      p_evento_id,
      v_ordem,
      btrim(v_item->>'texto'),
      (v_item->>'tipo')::tipo_pergunta,
      coalesce((v_item->>'obrigatoria')::boolean, true),
      false,
      case when v_item ? 'opcoes' and jsonb_typeof(v_item->'opcoes') = 'array'
           then array(select jsonb_array_elements_text(v_item->'opcoes'))
           end
    );
  end loop;

  select count(*) into v_total from evento_perguntas where evento_id = p_evento_id;

  return jsonb_build_object('perguntas_da_elis', v_ordem, 'total_no_formulario', v_total);
end $$;

revoke execute on function salvar_perguntas from anon;


-- ------------------------------------------------------------
-- definir_status_carteira
-- Mudar status exige motivo escrito. Aposentar palestra sem
-- registrar por quê é como não ter aposentado.
-- ------------------------------------------------------------
create or replace function definir_status_carteira(
  p_palestra_id bigint,
  p_status      status_carteira,
  p_motivo      text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_setor text;
begin
  select setor into v_setor from palestras where id = p_palestra_id;

  if v_setor is null then
    raise exception 'Palestra não encontrada';
  end if;

  if not pode_ver(v_setor) then
    raise exception 'Sem permissão para alterar a carteira';
  end if;

  if coalesce(btrim(p_motivo), '') = '' then
    raise exception 'Escreva o motivo da mudança de status';
  end if;

  update palestras
     set status = p_status,
         status_em = now(),
         status_motivo = btrim(p_motivo)
   where id = p_palestra_id;

  return jsonb_build_object('id', p_palestra_id, 'status', p_status);
end $$;

revoke execute on function definir_status_carteira from anon;


-- ============================================================
-- FUNÇÕES PÚBLICAS (anon) — as duas únicas
-- Não dependem de perfis nem de setor: quem responde não tem login.
-- ============================================================

-- ------------------------------------------------------------
-- evento_abrir
-- Responde desde a criação do evento, não só na janela: a Elis
-- gera o QR na véspera e alguém sempre aponta o celular antes da
-- hora. Quem chega cedo ou tarde vê o que está acontecendo, não
-- um erro.
-- ------------------------------------------------------------
create or replace function evento_abrir(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_e         eventos;
  v_estado    text;
  v_perguntas jsonb;
begin
  select * into v_e from eventos where token = p_token;

  if not found then
    return jsonb_build_object('estado', 'inexistente');
  end if;

  v_estado := case
                when now() < v_e.abre_em  then 'aguardando'
                when now() > v_e.fecha_em then 'encerrada'
                else 'aberta'
              end;

  if v_estado = 'aberta' then
    select coalesce(jsonb_agg(to_jsonb(p) order by p.nucleo, p.ordem), '[]'::jsonb)
      into v_perguntas
      from (
        select id, texto, tipo, obrigatoria, opcoes, nucleo, ordem
          from evento_perguntas
         where evento_id = v_e.id
      ) p;
  end if;

  return jsonb_build_object(
    'estado',    v_estado,
    'titulo',    v_e.titulo,
    'objetivo',  v_e.objetivo,
    'data',      v_e.data_evento,
    'abre_em',   v_e.abre_em,
    'fecha_em',  v_e.fecha_em,
    'perguntas', coalesce(v_perguntas, '[]'::jsonb)
  );
end $$;

grant execute on function evento_abrir(text) to anon, authenticated;


-- ------------------------------------------------------------
-- evento_responder
-- Grava o formulário inteiro numa transação.
-- Formato esperado:
--   [{"pergunta_id":12,"valor_num":9},
--    {"pergunta_id":13,"valor_texto":"mais exercícios"}]
--
-- Link público não impede resposta repetida — e não tem como.
-- O controle aqui é a janela de tempo. Para avaliação de palestra
-- isso é aceitável; está escrito no roadmap para não virar
-- surpresa depois.
-- ------------------------------------------------------------
create or replace function evento_responder(
  p_token     text,
  p_respostas jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_e        eventos;
  v_resposta bigint;
  v_item     jsonb;
  v_p        evento_perguntas;
  v_num      numeric;
  v_txt      text;
  v_gravadas int := 0;
  v_faltando text;
begin
  select * into v_e from eventos where token = p_token;

  if not found then
    raise exception 'Avaliação não encontrada';
  end if;

  if now() < v_e.abre_em then
    raise exception 'Esta avaliação ainda não está aberta';
  end if;

  if now() > v_e.fecha_em then
    raise exception 'Esta avaliação foi encerrada';
  end if;

  if jsonb_typeof(p_respostas) <> 'array' then
    raise exception 'Formato inválido';
  end if;

  insert into evento_respostas (evento_id) values (v_e.id) returning id into v_resposta;

  for v_item in select * from jsonb_array_elements(p_respostas)
  loop
    select * into v_p
      from evento_perguntas
     where id = (v_item->>'pergunta_id')::bigint
       and evento_id = v_e.id;

    if not found then
      raise exception 'Pergunta fora deste formulário';
    end if;

    v_num := nullif(v_item->>'valor_num', '')::numeric;
    v_txt := nullif(btrim(coalesce(v_item->>'valor_texto', '')), '');

    if v_p.tipo = 'escala_0_10' and v_num is not null
       and (v_num < 0 or v_num > 10) then
      raise exception 'Nota fora da escala de 0 a 10';
    end if;

    if v_p.tipo = 'escala_1_5' and v_num is not null
       and (v_num < 1 or v_num > 5) then
      raise exception 'Nota fora da escala de 1 a 5';
    end if;

    if v_p.tipo = 'escolha_unica' and v_txt is not null
       and not (v_txt = any(v_p.opcoes)) then
      raise exception 'Opção inválida';
    end if;

    if v_num is null and v_txt is null then
      continue;                      -- pergunta pulada
    end if;

    insert into evento_resposta_itens (resposta_id, pergunta_id, valor_num, valor_texto)
    values (v_resposta, v_p.id, v_num, v_txt);

    v_gravadas := v_gravadas + 1;
  end loop;

  -- obrigatórias
  select string_agg(p.texto, ' · ')
    into v_faltando
    from evento_perguntas p
   where p.evento_id = v_e.id
     and p.obrigatoria
     and not exists (
       select 1 from evento_resposta_itens i
        where i.resposta_id = v_resposta and i.pergunta_id = p.id
     );

  if v_faltando is not null then
    raise exception 'Responda antes: %', v_faltando;
  end if;

  if v_gravadas = 0 then
    raise exception 'Nenhuma resposta foi preenchida';
  end if;

  return jsonb_build_object('ok', true, 'respostas', v_gravadas);
end $$;

grant execute on function evento_responder(text, jsonb) to anon, authenticated;


-- ============================================================
-- RLS
-- Leitura por setor, usando a função que já existe no banco.
-- Escrita só pelas funções acima. Resposta crua ninguém lê.
-- ============================================================
alter table palestras             enable row level security;
alter table eventos               enable row level security;
alter table evento_perguntas      enable row level security;
alter table evento_respostas      enable row level security;
alter table evento_resposta_itens enable row level security;

create policy "le carteira do setor"
  on palestras for select to authenticated
  using (pode_ver(setor));

create policy "le eventos do setor"
  on eventos for select to authenticated
  using (pode_ver(setor));

create policy "le perguntas do setor"
  on evento_perguntas for select to authenticated
  using (exists (
    select 1 from eventos e where e.id = evento_id and pode_ver(e.setor)
  ));

-- evento_respostas e evento_resposta_itens ficam SEM policy de select,
-- de propósito: ninguém lê linha crua de resposta. Só as views abaixo.


-- ============================================================
-- VIEWS DE LEITURA
-- Mínimo de 5 respostas para exibir número.
-- ============================================================

-- NPS por edição. A contagem vem sempre junto: com 12 respostas,
-- um único detrator move o índice em 8 pontos.
create view vw_evento_nps as
select
  e.id          as evento_id,
  e.codigo,
  e.titulo,
  e.setor,
  e.palestra_id,
  e.data_evento,
  count(i.*)                                          as respostas,
  count(*) filter (where i.valor_num >= 9)            as promotores,
  count(*) filter (where i.valor_num between 7 and 8) as neutros,
  count(*) filter (where i.valor_num <= 6)            as detratores,
  case when count(i.*) >= 5 then
    round(
      100.0 * (count(*) filter (where i.valor_num >= 9)
             - count(*) filter (where i.valor_num <= 6)) / count(i.*)
    )
  end as nps
from eventos e
left join evento_perguntas p
       on p.evento_id = e.id and p.nucleo and p.tipo = 'escala_0_10'
left join evento_resposta_itens i
       on i.pergunta_id = p.id
group by e.id;

-- Nota média por pergunta numérica.
create view vw_evento_notas as
select
  p.evento_id,
  p.id    as pergunta_id,
  p.texto,
  p.tipo,
  p.nucleo,
  p.ordem,
  count(i.*) as respostas,
  case when count(i.*) >= 5 then round(avg(i.valor_num), 1) end as media
from evento_perguntas p
left join evento_resposta_itens i on i.pergunta_id = p.id
where p.tipo in ('escala_0_10','escala_1_5')
group by p.id;

-- Texto livre. Vai para a coordenação E para quem apresentou — o
-- "o que você mudaria" só serve se chegar em quem vai mudar. A tela
-- da avaliação precisa dizer isso.
create view vw_evento_textos as
select
  p.evento_id,
  p.id    as pergunta_id,
  p.texto as pergunta,
  p.nucleo,
  i.valor_texto as resposta,
  r.enviado_em
from evento_perguntas p
join evento_resposta_itens i on i.pergunta_id = p.id
join evento_respostas r      on r.id = i.resposta_id
where p.tipo = 'texto_livre'
  and nullif(btrim(i.valor_texto), '') is not null;

-- A carteira com o acumulado de todas as edições. É desta view que
-- sai a decisão de manter ou aposentar — nunca de uma noite só.
create view vw_carteira as
select
  pl.id as palestra_id,
  pl.titulo,
  pl.tema,
  pl.setor,
  pl.status,
  pl.status_motivo,
  count(distinct e.id) as edicoes,
  max(e.data_evento)   as ultima_edicao,
  coalesce(sum(n.respostas), 0) as respostas_total,
  case when sum(n.respostas) >= 5 then
    round(
      100.0 * (sum(n.promotores) - sum(n.detratores)) / nullif(sum(n.respostas), 0)
    )
  end as nps_acumulado
from palestras pl
left join eventos e       on e.palestra_id = pl.id
left join vw_evento_nps n on n.evento_id = e.id
group by pl.id;

grant select on vw_evento_nps, vw_evento_notas, vw_evento_textos, vw_carteira
  to authenticated;


-- ============================================================
-- SEED — primeiro evento, para testar a Fase 2 sem tela de cadastro
-- Rode LOGADO no app (as funções usam auth.uid()); pelo SQL editor
-- do Supabase auth.uid() vem nulo e criar_evento vai recusar.
-- ============================================================
-- select criar_evento(
--   'palestra',
--   'Liderança que Sustenta Resultado',
--   current_date,
--   'Mostrar como o líder sustenta resultado sem microgerenciar a equipe'
-- );
--
-- select salvar_perguntas(
--   (select id from eventos order by id desc limit 1),
--   '[
--     {"texto":"O conteúdo ficou claro?","tipo":"escala_1_5","obrigatoria":true},
--     {"texto":"O exercício da roda ajudou a fixar?","tipo":"sim_nao","obrigatoria":true},
--     {"texto":"O tempo de palestra foi adequado?","tipo":"escolha_unica","obrigatoria":true,
--      "opcoes":["Curto demais","Adequado","Longo demais"]}
--   ]'::jsonb
-- );
--
-- select codigo, token, abre_em, fecha_em from eventos order by id desc limit 1;
