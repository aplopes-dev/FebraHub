-- ============================================================
-- FebraHub · Migration 29 — Status de atualização das integrações
--
-- Cada ETL grava aqui ao terminar. O hub lê e mostra "Atualizado
-- hoje / há N dias", para ninguém tomar decisão com dado velho
-- sem saber que é velho.
-- ============================================================

create table if not exists public.integracao_status (
  fonte             text primary key,   -- 'conta_azul', 'cispay', 'salesforce', 'sympla', 'omie', 'sheets', 'smart_notas'
  nome_exibicao     text not null,
  ultima_sync       timestamptz,
  registros         integer,
  status            text default 'ok',  -- 'ok' | 'erro' | 'parcial'
  mensagem          text,
  duracao_segundos  numeric,
  atualizado_em     timestamptz default now()
);

-- Cadastro inicial das fontes (sem sync ainda)
insert into public.integracao_status (fonte, nome_exibicao) values
  ('salesforce',  'Salesforce'),
  ('conta_azul',  'Conta Azul'),
  ('cispay',      'CisPay'),
  ('sympla',      'Sympla'),
  ('omie',        'Omie'),
  ('sheets',      'Google Sheets'),
  ('smart_notas', 'Smart Notas')
on conflict (fonte) do nothing;

grant select on public.integracao_status to authenticated;

-- View com o frescor já calculado, pronta para a tela
create or replace view public.vw_integracao_status as
select
  fonte,
  nome_exibicao,
  ultima_sync,
  registros,
  status,
  mensagem,
  case
    when ultima_sync is null then null
    else extract(epoch from (now() - ultima_sync))/3600
  end                                   as horas_atras,
  case
    when ultima_sync is null                              then 'nunca'
    when now() - ultima_sync < interval '24 hours'        then 'hoje'
    when now() - ultima_sync < interval '48 hours'        then 'ontem'
    else 'ha_dias'
  end                                   as frescor,
  case
    when ultima_sync is null                              then 'Nunca sincronizado'
    when now() - ultima_sync < interval '1 hour'          then 'Atualizado agora'
    when now() - ultima_sync < interval '24 hours'        then 'Atualizado hoje'
    when now() - ultima_sync < interval '48 hours'        then 'Atualizado ontem'
    else 'Atualizado há ' || floor(extract(epoch from (now() - ultima_sync))/86400)::int || ' dias'
  end                                   as rotulo
from public.integracao_status;

grant select on public.vw_integracao_status to authenticated;
