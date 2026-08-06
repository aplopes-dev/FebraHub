-- ============================================================
-- FebraHub · Migration 07b — classifica os cursos restantes
-- (os 47 que estavam em 'Outro' após a 07)
--
-- Rode DEPOIS da 07. Corrige também o resquício "GGB:CIS Assessment".
-- Linhas duvidosas comentadas com CONFIRMAR no bloco de revisão abaixo.
--
-- REVISAR:
--   [Evento?]  COMBO — pacote de produtos, 86 matrículas. Categoria própria?
--   [Evento?]  CABINE DUPLA VARANDA — evento em cruzeiro? 6 matrículas
--   [GGB?]     GREEN BELT / GOLDEN BELT — níveis de certificação?
--   [GGB?]     POWER BUSINESS / JOGOS EMPRESARIAIS
--   [Evento?]  CERTIFICAÇÃO / DEVOLUTIVA — 1-3 matrículas, resíduo
-- ============================================================

begin;

-- Corrige o resquício da 07 (tipo tinha lixo antes, não foi sobrescrito)
update public.dim_cursos
set tipo = 'CIS'
where nome_curso ilike '%CIS ASSESSMENT%';

update public.dim_cursos c
set tipo = m.categoria
from (values
  ('EDUCAR - AMAR E DAR LIMITES - MINISTRANTES ONLINE', 'GGB'),
  ('COACHING FOR MONEY', 'GGB'),
  ('COMO VENDER TUDO COM MARKETING DIGITAL', 'GGB'),
  ('COMBO', 'GGB'),
  ('VIVA SUA REAL IDENTIDADE PARA MINISTRANTES', 'Evento'),
  ('BÔNUS: MENTORIA S1', 'Bônus'),
  ('PODER E ALTA PERFORMANCE PARA MINISTRANTES', 'Evento'),
  ('O PODER DA AUTORRESPONSABILIDADE PARA MINISTRANTES', 'Evento'),
  ('FORMAÇÃO INTERNACIONAL EM COACHING ON-LINE', 'GGB'),
  ('JOGOS EMPRESARIAIS', 'GGB'),
  ('INTELIGÊNCIA FINANCEIRA COM PAULO VIEIRA E CAMILA VIEIRA - ON-LINE', 'GGB'),
  ('GREEN BELT', 'GGB'),
  ('POWER BUSINESS', 'GGB'),
  ('MENTORIA EM RELACIONAMENTO', 'Mentoria'),
  ('FOCO NA PRÁTICA PARA MINISTRANTES', 'Evento'),
  ('AUTORRESPONSABILIDADE - MINISTRANTES', 'Evento'),
  ('FORMAÇÃO INTERNACIONAL EM COACHING INTEGRAL SISTÊMICO - AULA PRÁTICA', 'GGB'),
  ('LIDERE E INFLUENCIE PESSOAS NO MUNDO BUSINESS - ON LINE', 'GGB'),
  ('GOLDEN BELT', 'GGB'),
  ('CIS ASSESSMENT ON-LINE', 'CIS'),
  ('O PODER DA AÇÃO - MINISTRANTE', 'Evento'),
  ('INTERCOACHING CONFERENCE', 'Evento'),
  ('BÔNUS INTELIGÊNCIA FINANCEIRA PARA CASAIS', 'Bônus'),
  ('BÔNUS A CIÊNCIA DE FICAR RICO', 'Bônus'),
  ('BÔNUS: VENDA 3X MAIS', 'Bônus'),
  ('CABINE DUPLA VARANDA', 'Evento'),
  ('BUSINESS HIGH PERFORMANCE ON-LINE', 'GGB'),
  ('BÔNUS: E-BOOK: AS 6 CHAVES PARA CONQUISTAR SUAS METAS', 'Bônus'),
  ('MENTORIA PAULO E CAMILA VIEIRA - ONLINE', 'Mentoria'),
  ('VIVA SUA REAL IDENTIDADE COM CAMILA VIEIRA - ONLINE', 'Evento'),
  ('FORMAÇÃO INTER. EM COACHING INTEGRAL SISTÊMICO COM PV - ON-LINE', 'GGB'),
  ('MINDFULNESS ON-LINE', 'GGB'),
  ('MENTORIA JOGO DE GENTE GRANDE - EAD', 'Mentoria'),
  ('DEVOLUTIVA', 'Outro'),
  ('INTELIGÊNCIA FINANCEIRA COM PAULO E CAMILA VIEIRA - BONUS FCIS', 'GGB'),
  ('IMERSAO - IDENTIDADE - PROPOSITO E UM FUTURO', 'Evento'),
  ('FORMAÇÃO EM COACHING INTEGRAL SISTÊMICO', 'GGB'),
  ('COACHING FOR MONEY ON-LINE', 'GGB'),
  ('PERFORMANCE FAMILIAR ONLINE', 'GGB'),
  ('NEUROCIÊNCIA E INTELIGÊNCIA EMOCIONAL APLICADA A ALTA PERFORMANCE EM SAÚDE', 'GGB'),
  ('RELACIONAMENTO DURADOUROS COM PV E CV', 'GGB'),
  ('FORMAÇÃO EM COACHING DE CARREIRA - EAD', 'GGB'),
  ('CISPASS - RENOVAÇÃO GLOBAL', 'CIS'),
  ('FORMAÇÃO EM PERFORMANCE E COMPORTAMENTO HUMANO - ON-LINE', 'GGB'),
  ('INTELIGÊNCIA FINANCEIRA COM PAULO VIEIRA E CAMILA VIEIRA', 'GGB'),
  ('CRIAÇÃO DE RIQUEZA COM PAULO VIEIRA ONLINE', 'GGB'),
  ('CERTIFICAÇÃO', 'Outro')
) as m(nome_curso, categoria)
where upper(trim(c.nome_curso)) = upper(trim(m.nome_curso));

commit;

-- Conferência final: agora 'Outro' deve ser mínimo (só DEVOLUTIVA e CERTIFICAÇÃO).
select c.tipo as categoria,
       count(distinct c.curso_id) as cursos,
       count(m.*)                 as matriculas
from public.dim_cursos c
left join public.fato_base_alunos m on m.curso_id = c.curso_id
group by 1 order by 3 desc nulls last;
