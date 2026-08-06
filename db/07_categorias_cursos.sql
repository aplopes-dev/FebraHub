-- ============================================================
-- FebraHub · Migration 07 — Categoria de curso
--
-- A coluna dim_cursos.tipo existia mas estava toda como 'Outro'.
-- Aqui ela recebe a categoria de negocio definida com a gestora:
--   GGB · CIS · Coaching Individual · Evento · Mentoria · Franquia · Bonus
--
-- IMPORTANTE: a categoria NAO e derivavel do nome do curso de forma
-- confiavel. INTELIGENCIA FINANCEIRA e GGB; FEBRACIS SELECT e
-- franquia -- nada no texto diz isso. Esta classificacao foi feita
-- por conhecimento de negocio, nao por algoritmo. As linhas com
-- "-- CONFIRMAR" sao palpites que a gestora deve revisar antes de rodar.
--
-- Cursos novos entram como 'Outro'. A view de receita por categoria
-- mostra quanto ha em 'Outro' para avisar quando classificar.
--
-- RESUMO desta classificacao:
--    57  GGB
--    19  Evento
--    14  CIS
--     8  Mentoria
--     3  Bônus
--     1  Coaching Individual
--     1  Franquia
--   103 cursos
--
-- REVISAR antes de rodar (classificacao incerta -- ajuste a categoria
-- na linha correspondente do INSERT abaixo se estiver errada):
--   [GGB]  REVOLUTION
--   [GGB]  LLPASS
--   [GGB]  SALA DO CONSELHO
--   [GGB]  LL NETWORKING BUSINESS
--   [Evento]  O PODER DA AÇÃO PARA MINISTRANTES
--   [GGB]  PLANOS 2023 ONLINE
--   [GGB]  CUSTOMER INTELLIGENCE E NEGÓCIOS DO FUTURO
--   [GGB]  REDES SOCIAIS E INFLUÊNCIA DIGITAL
--   [GGB]  MINDFULNESS
--   [Evento]  PODER E ALTA PERFORMANCE - MINISTRANTES
--   [GGB]  INTRODUÇÃO À TEORIA DOS PERFIS COMPORTAMENTAIS
--   [GGB]  MINISTRANTES DE SUCESSO
--   [GGB]  PERSUASÃO E INFLUÊNCIA
--   [Evento]  O PODER DA AÇÃO - MINISTRANTES
--   [GGB]  ANALISTA MINI MEGA ASSESSMENT
--   [GGB]  INTRODUÇÃO AO MINDFULNESS
--   [Evento]  15 ESTRATÉGIAS DO POVO JUDEU
-- ============================================================

begin;

update public.dim_cursos c
set tipo = m.categoria
from (values
  ('COACHING INDIVIDUAL', 'Coaching Individual'),
  ('FORMAÇÃO INTERNACIONAL EM COACHING INTEGRAL SISTÊMICO', 'GGB'),
  ('TEAM COACHING BUSINESS', 'GGB'),
  ('INTELIGÊNCIA FINANCEIRA', 'GGB'),
  ('MÉTODO CIS - INTELIGÊNCIA EMOCIONAL', 'CIS'),
  ('FORMAÇÃO PROFISSIONAL EM BUSINESS COACHING - ML5', 'GGB'),
  ('BUSINESS EVOLUTION', 'GGB'),
  ('FEBRACIS SELECT', 'Franquia'),
  ('METODO CIS GLOBAL HOLDING', 'CIS'),
  ('MASTER COACHING', 'GGB'),
  ('MAESTRIA', 'GGB'),
  ('FORMAÇÃO EM PERFORMANCE E COMPORTAMENTO HUMANO', 'GGB'),
  ('TEAM COACHING LIFE', 'GGB'),
  ('MÉTODO CIS GLOBAL - INTELIGÊNCIA EMOCIONAL', 'CIS'),
  ('BUSINESS HIGH PERFORMANCE', 'GGB'),
  ('Formação de Oradores e Palestrantes no Mundo Business', 'Evento'),
  ('VIVA SUA REAL IDENTIDADE COM CAMILA VIEIRA', 'Evento'),
  ('CIS EVOLUTION', 'CIS'),
  ('PALESTRA IN COMPANY', 'Evento'),
  ('O PODER DA AÇÃO COM PAULO VIEIRA', 'Evento'),
  ('TÉCNICAS DE VENDAS', 'GGB'),
  ('FORMAÇÃO PROFISSIONAL EM BUSINESS COACHING - ML5 C/PV GLOBAL', 'GGB'),
  ('MENTORIA BUSINESS', 'Mentoria'),
  ('PODER E ALTA PERFORMANCE: WORKSHOP DE 8HR', 'Evento'),
  ('REVOLUTION', 'GGB'),
  ('MULHERES EM ALTA PERFORMANCE', 'Evento'),
  ('INTERCOACHING', 'GGB'),
  ('CRIPTOINVESTIDOR DE SUCESSO - SUA INDEPENDENCIA FINANCEIRA', 'GGB'),
  ('FORMAÇÃO INTER. EM COACHING INTEGRAL SISTÊMICO COM PV - GLOBAL', 'GGB'),
  ('LLPASS', 'GGB'),
  ('SALA DO CONSELHO', 'GGB'),
  ('CISPASS-GL', 'CIS'),
  ('FORMAÇÃO PROFISSIONAL EM BUSINESS COACHING - ML5 C/PV', 'GGB'),
  ('LL NETWORKING BUSINESS', 'GGB'),
  ('CIS EVOLUTION COM PAULO VIEIRA', 'CIS'),
  ('PLANEJAMENTO ESTRATÉGICO NA PRATICA', 'GGB'),
  ('MENTORIA PAULO E CAMILA VIEIRA', 'Mentoria'),
  ('FORMAÇÃO INTERNACIONAL EM COACHING INTEGRAL SISTÊMICO - PAULO VIEIRA', 'GGB'),
  ('GROWTH', 'GGB'),
  ('CRIAÇÃO DE RIQUEZAS COM PV', 'GGB'),
  ('CIS ASSESSMENT IN COMPANY', 'CIS'),
  ('MENTORIA JORNADA DA PLENITUDE', 'Mentoria'),
  ('CONFERÊNCIA DE MULHERES PLENITUDE', 'Evento'),
  ('PASS ANUAL MCIS', 'CIS'),
  ('CISPASS', 'CIS'),
  ('O PODER DA ALTA PERFORMANCE', 'Evento'),
  ('PÓS-GRADUAÇÃO EM NEUROCIÊNCIA E PERFORMANCE HUMANA', 'GGB'),
  ('FORMAÇÃO EM PLANEJADOR FINANCEIRO', 'GGB'),
  ('PÓS-GRADUAÇÃO EM INTELIGÊNCIA EMOCIONAL', 'GGB'),
  ('O PODER DA AÇÃO EXPERIENCE', 'Evento'),
  ('ALTA PERFORMANCE EM SAUDE', 'GGB'),
  ('LIVRÃO MÉTODO CIS', 'CIS'),
  ('FOCO NA PRÁTICA', 'GGB'),
  ('COMUNICAÇÃO EFICAZ', 'GGB'),
  ('CRIAÇÃO DE RIQUEZAS COM PV GLOBAL', 'GGB'),
  ('TOUR CRESCIMENTO EMPRESARIAL', 'Evento'),
  ('METODO CIS FAMILIA - INTELIGENCIA EMOCIONAL', 'CIS'),
  ('INTELIGÊNCIA FINANCEIRA - ON-LINE', 'GGB'),
  ('FORMAÇÃO DE ORADORES E PALESTRANTES - COMUNICAÇÃO AVANÇADA - ON-LINE', 'Evento'),
  ('MENTORIA EVA', 'Mentoria'),
  ('O PODER E ALTA PERFORMANCE - PÚBLICO GERAL', 'Evento'),
  ('FORMAÇÃO EM COACHING DE CARREIRA ON-LINE', 'GGB'),
  ('FORMAÇÃO EM COACHING - TAXA', 'GGB'),
  ('METAS E OBJETIVOS COM PAULO VIEIRA', 'GGB'),
  ('FORMAÇÃO EM GESTÃO DE PERFIL COMPORTAMENTAL - ON-LINE', 'GGB'),
  ('METODO CIS GLOBAL', 'CIS'),
  ('CONFERÊNCIA DE MULHERES PLENITUDE ONLINE', 'Evento'),
  ('MENTORIA JULIA SARAIVA VIEIRA', 'Mentoria'),
  ('METAS E OBJETIVOS COM PAULO VIEIRA - ONLINE', 'GGB'),
  ('O PODER DA AÇÃO PARA MINISTRANTES', 'Evento'),
  ('FORMAÇÃO EM MASTER COACHING - TAXA', 'GGB'),
  ('MENTORIA PAULO E CAMILA VIEIRA GLOBAL', 'Mentoria'),
  ('O PODER DA AÇÃO COM PAULO VIEIRA - ON LINE', 'Evento'),
  ('PLANOS 2023 ONLINE', 'GGB'),
  ('METAS E OBJETIVOS COM PAULO VIEIRA - VIP', 'GGB'),
  ('CUSTOMER INTELLIGENCE E NEGÓCIOS DO FUTURO', 'GGB'),
  ('REDES SOCIAIS E INFLUÊNCIA DIGITAL', 'GGB'),
  ('INTELIGÊNCIA EMOCIONAL PARA JOVENS ACIMA DE 60 ANOS', 'GGB'),
  ('GESTÃO FINANCEIRA EMPRESARIAL', 'GGB'),
  ('BÔNUS: PRODUTIVIDADE MÁXIMA', 'Bônus'),
  ('MENTORIA EM BUSINESS', 'Mentoria'),
  ('MINDFULNESS', 'GGB'),
  ('PODER E ALTA PERFORMANCE - MINISTRANTES', 'Evento'),
  ('INTRODUÇÃO À TEORIA DOS PERFIS COMPORTAMENTAIS', 'GGB'),
  ('MINISTRANTES DE SUCESSO', 'GGB'),
  ('PERSUASÃO E INFLUÊNCIA', 'GGB'),
  ('MOVIMENTO EVA', 'Evento'),
  ('AULA INAUGURAL - CIS', 'CIS'),
  ('O PODER DA AÇÃO - MINISTRANTES', 'Evento'),
  ('CRIAÇÃO DE RIQUEZA ON-LINE', 'GGB'),
  ('ANALISTA MINI MEGA ASSESSMENT', 'GGB'),
  ('INTRODUÇÃO AO MINDFULNESS', 'GGB'),
  ('MENTORIA EM FINANCEIRO', 'Mentoria'),
  ('FORMAÇÃO PROFISSIONAL EM BUSINESS COACHING - ML5 C/PV ON-LINE', 'GGB'),
  ('COACHING PARA METAS', 'GGB'),
  ('ARMADILHAS DA RIQUEZA - ONLINE', 'GGB'),
  ('BÔNUS: METAS E OBJETIVOS', 'Bônus'),
  ('METODO CIS FAMILIA GLOBAL', 'CIS'),
  ('BUSINESS HIGH PERFORMANCE COM PAULO VIEIRA - ON LINE', 'GGB'),
  ('BÔNUS: ENTRANDO NO JOGO COM PODER E ALTA PERFORMANCE', 'Bônus'),
  ('15 ESTRATÉGIAS DO POVO JUDEU', 'Evento'),
  ('ADVANCED EXECUTIVE COACHING', 'GGB'),
  ('ADVANCED EXECUTIVE COACHING ON-LINE', 'GGB')
) as m(nome_curso, categoria)
where upper(trim(c.nome_curso)) = upper(trim(m.nome_curso));

update public.dim_cursos
set tipo = 'Outro'
where tipo is null or tipo = '';

commit;

-- Conferencia: categorias e o tamanho do balde 'Outro'.
select c.tipo as categoria,
       count(distinct c.curso_id) as cursos,
       count(m.*)                 as matriculas
from public.dim_cursos c
left join public.fato_base_alunos m on m.curso_id = c.curso_id
group by 1 order by 3 desc nulls last;
