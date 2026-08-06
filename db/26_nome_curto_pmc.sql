-- ============================================================
-- FebraHub · Migration 26 — Nome curto dos cursos, PMC01 e hover no Geral
--
-- 1) dim_cursos ganha nome_curto (abreviação para o hover do ranking).
--    Ajuste livremente: é só texto de exibição, não afeta cálculo.
-- 2) PMC (Programa Multiplicador de Crescimento) vira Evento. Não tem
--    matrícula na base de alunos, então categoria e nome do curso são
--    resolvidos pelo código do nome_venda, não pela dim_cursos.
-- 3) O hover de cursos passa a funcionar também no modo Geral (todas as
--    categorias), não só GGB.
-- 4) REVOLUTION (CIS Revolution) entra com receita zero para a unidade,
--    como o METODO CIS GLOBAL HOLDING: a venda fica com a consultora
--    (bruto no Comercial), mas o valor é integralmente repassado.
-- ============================================================

alter table public.dim_cursos add column if not exists nome_curto text;

-- ATENÇÃO: o bloco que gerava as abreviações automaticamente foi REMOVIDO.
-- Ele sobrescrevia as siglas oficiais definidas manualmente (FCIS, BHP, IF,
-- TV, MASTER, ML5, FGPC, FOP, TCE, PE, Growth) toda vez que a migration
-- rodava de novo. As abreviações agora são mantidas só por update manual.

-- fallback: quem ficou sem abreviação usa o nome completo
update public.dim_cursos set nome_curto = curso_id where nome_curto is null;

-- ------------------------------------------------------------
-- vw_venda_faturamento: categoria por código do nome_venda quando
-- a venda não tem matrícula (órfãs). Hoje só PMC01 -> Evento.
-- ------------------------------------------------------------
drop view if exists public.vw_venda_faturamento cascade;
create view public.vw_venda_faturamento as
with venda_valor as (
  select
    p.original_id_venda,
    max(p.consultor_id)   as consultor_id,
    max(p.data_pagamento) as data_pagamento,
    max(p.valor)          as valor,
    max(p.tipo_matricula) as tipo_matricula,
    max(p.nome_venda)     as nome_venda
  from public.fato_pagamento_base p
  where p.tipo_matricula in ('Matrícula','COMPRADOR DE VAGAS','MAT. RETROATIVA')
    and p.valor is not null
    and p.data_pagamento is not null
  group by p.original_id_venda
),
matricula_da_venda as (
  select distinct on (original_id_venda) original_id_venda, curso_id
  from public.fato_base_alunos
  where curso_id is not null
  order by original_id_venda, valor desc nulls last
),
base as (
  select
    vv.original_id_venda, vv.consultor_id, vv.data_pagamento,
    vv.tipo_matricula, vv.nome_venda,
    cur.curso_id, cur.tipo as tipo_curso, cur.nome_curso, cur.nome_curto,
    vv.valor as valor_bruto
  from venda_valor vv
  left join matricula_da_venda m on m.original_id_venda = vv.original_id_venda
  left join public.dim_cursos cur on cur.curso_id = m.curso_id
)
select
  b.original_id_venda,
  b.consultor_id,
  b.data_pagamento,
  b.tipo_matricula,
  -- categoria: da dim_cursos; se órfã, tenta pelo código do nome_venda
  coalesce(
    b.tipo_curso,
    case when split_part(b.nome_venda,' - ',2) like 'PMC%' then 'Evento' end,
    'Sem categoria'
  )                                            as categoria_curso,
  coalesce(
    b.nome_curso,
    case when split_part(b.nome_venda,' - ',2) like 'PMC%'
         then 'Programa Multiplicador de Crescimento' end,
    'Sem vínculo'
  )                                            as curso,
  coalesce(
    b.nome_curto, b.nome_curso,
    case when split_part(b.nome_venda,' - ',2) like 'PMC%' then 'PMC' end,
    'Sem vínculo'
  )                                            as curso_curto,
  case
    when b.curso_id in ('METODO CIS GLOBAL HOLDING','REVOLUTION') then 0.0
    when b.curso_id in ('METODO CIS GLOBAL',
                        'METODO CIS GLOBAL - INTELIGÊNCIA EMOCIONAL',
                        'MÉTODO CIS GLOBAL - INTELIGÊNCIA EMOCIONAL',
                        'MÉTODO CIS GLOBAL- INTELIGÊNCIA EMOCIONAL') then
         case when b.data_pagamento < '2023-01-01' then 0.20
              when b.data_pagamento < '2026-06-01' then 0.50
              else 0.80 end
    when b.curso_id in ('TEAM COACHING BUSINESS','TEAM COACHING LIFE') then 0.50
    when b.tipo_curso = 'Coaching Individual'                  then 0.50
    else 1.0
  end                                          as pct_unidade,
  b.valor_bruto,
  b.valor_bruto *
  case
    when b.curso_id in ('METODO CIS GLOBAL HOLDING','REVOLUTION') then 0.0
    when b.curso_id in ('METODO CIS GLOBAL',
                        'METODO CIS GLOBAL - INTELIGÊNCIA EMOCIONAL',
                        'MÉTODO CIS GLOBAL - INTELIGÊNCIA EMOCIONAL',
                        'MÉTODO CIS GLOBAL- INTELIGÊNCIA EMOCIONAL') then
         case when b.data_pagamento < '2023-01-01' then 0.20
              when b.data_pagamento < '2026-06-01' then 0.50
              else 0.80 end
    when b.curso_id in ('TEAM COACHING BUSINESS','TEAM COACHING LIFE') then 0.50
    when b.tipo_curso = 'Coaching Individual'                  then 0.50
    else 1.0
  end                                          as valor
from base b;

grant select on public.vw_venda_faturamento to authenticated;

-- ------------------------------------------------------------
-- Hover de cursos: todas as categorias (funciona também no Geral)
-- ------------------------------------------------------------
drop view if exists public.vw_comercial_cursos_por_consultora cascade;
create view public.vw_comercial_cursos_por_consultora as
select
  case f.categoria_curso
    when 'Coaching Individual' then 'CI'
    else f.categoria_curso
  end              as categoria,
  case
    when f.consultor_id = 'Marlany Santos de Bona Fernandes'
         and f.data_pagamento < '2025-05-07' then 'Danilo'
    else coalesce(cons.nome, f.consultor_id)
  end              as consultora,
  f.curso,
  f.curso_curto,
  f.data_pagamento as data,
  f.valor_bruto,
  f.valor
from public.vw_venda_faturamento f
left join public.dim_consultores cons on cons.consultor_id = f.consultor_id
where public.pode_ver('comercial');

grant select on public.vw_comercial_cursos_por_consultora to authenticated;
