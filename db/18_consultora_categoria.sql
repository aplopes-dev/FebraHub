-- ============================================================
-- FebraHub · Migration 18 — Vínculo consultora × categoria + ranking
-- (A view do Sympla foi separada na 18c, pois usa outra tabela.)
--
-- DATAS DE LARGADA:
--   Marlany: 07/05/2025 — antes era o Danilo (779 vendas, R$4M, NÃO dela).
--   Jennifer: jan/2025 — só Sympla (tratada na 18c).
--   Demais: desde sempre.
-- ============================================================

create table if not exists public.consultora_categoria (
  consultor_id   text not null,
  categoria      text not null check (categoria in ('GGB','CIS','CI','Sympla')),
  largada        date,
  primary key (consultor_id, categoria)
);

delete from public.consultora_categoria;

insert into public.consultora_categoria (consultor_id, categoria, largada) values
  ('Alana Faleiro Coutinho',           'GGB', null),
  ('Beatriz Souza',                    'GGB', null),
  ('Beatriz Martins de Novaes',        'GGB', null),
  ('Alana Faleiro Coutinho',           'CI',  null),
  ('Beatriz Souza',                    'CI',  null),
  ('Beatriz Martins de Novaes',        'CI',  null),
  ('Cássia Romão Fernandes',           'CIS', null),
  ('Marlany Santos de Bona Fernandes', 'CIS', '2025-05-07');

grant select on public.consultora_categoria to authenticated;

-- ============================================================
-- RANKING POR CATEGORIA (GGB / CIS / CI)
-- ============================================================
drop view if exists public.vw_comercial_ranking_categoria cascade;
create view public.vw_comercial_ranking_categoria as
select
  vc.categoria,
  p.consultor_id,
  cons.nome                          as consultora,
  cons.foto_url,
  p.data_pagamento                   as data,
  case when cur.tipo = 'Coaching Individual'
       then p.valor * 0.5 else p.valor end as valor
from public.fato_pagamento_base p
join public.fato_base_alunos m on m.original_id_venda = p.original_id_venda
join public.dim_cursos cur       on cur.curso_id = m.curso_id
join public.consultora_categoria vc
     on vc.consultor_id = p.consultor_id
    and (
      (vc.categoria = 'GGB'  and cur.tipo = 'GGB') or
      (vc.categoria = 'CIS'  and cur.tipo = 'CIS') or
      (vc.categoria = 'CI'   and cur.tipo = 'Coaching Individual')
    )
join public.dim_consultores cons on cons.consultor_id = p.consultor_id
where p.tipo_matricula = 'Matrícula'
  and p.valor is not null
  and p.data_pagamento is not null
  and (vc.largada is null or p.data_pagamento >= vc.largada)
  and public.pode_ver('comercial');

grant select on public.vw_comercial_ranking_categoria to authenticated;
