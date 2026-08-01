-- ============================================================================
-- FebraHub · índices das tabelas de negócio
--
-- O dump do Supabase trouxe dados e PKs. Não trouxe índice nenhum, e não
-- trouxe nem a coluna gerada `fato_negocio_lead.data_criacao_dia` que os
-- índices antigos usavam. Este arquivo reconstrói o que as consultas dos hubs
-- pedem, a partir das colunas que existem HOJE (conferidas no catálogo).
--
-- Critérios:
--   * Nada redundante com PK. Índice que repete prefixo de PK só ocupa espaço
--     e atrasa INSERT. Por isso fato_meta_insights ganha (campanha_id, data) e
--     não (data, ...): a PK já começa em `data`.
--   * Coluna de data quase sempre no fim de índice composto — todo filtro dos
--     hubs é "esta dimensão, neste período".
--   * CONCURRENTLY não aparece aqui: migration roda em transação e as duas
--     coisas são incompatíveis. As tabelas maiores têm 66 mil linhas; o lock
--     dura frações de segundo. Se um dia uma delas passar de milhões, crie o
--     índice novo à mão, fora de migration, com CONCURRENTLY.
--   * Tabela pequena e estática (dim_cursos 158, dim_eventos 79, dim_calendario
--     2.557) fica sem índice extra de propósito: o planner faz seq scan e
--     acerta. Índice ali é enfeite.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- COMERCIAL
-- ----------------------------------------------------------------------------

-- fato_negocio_lead (59.613) — funil, ranking e série mensal.
-- data_criacao é timestamp sem fuso; o filtro por período é range nela mesma,
-- porque a coluna gerada data_criacao_dia não sobreviveu ao import.
CREATE INDEX IF NOT EXISTS ix_negocio_data
    ON public.fato_negocio_lead (data_criacao);
CREATE INDEX IF NOT EXISTS ix_negocio_consultor_data
    ON public.fato_negocio_lead (consultor_id, data_criacao);
CREATE INDEX IF NOT EXISTS ix_negocio_origem_data
    ON public.fato_negocio_lead (origem_id, data_criacao);
CREATE INDEX IF NOT EXISTS ix_negocio_etapa_data
    ON public.fato_negocio_lead (etapa_funil, data_criacao);
CREATE INDEX IF NOT EXISTS ix_negocio_status
    ON public.fato_negocio_lead (status_negocio);
CREATE INDEX IF NOT EXISTS ix_negocio_lead
    ON public.fato_negocio_lead (lead_id);
CREATE INDEX IF NOT EXISTS ix_negocio_campanha
    ON public.fato_negocio_lead (nome_campanha);

-- fato_base_alunos (20.100) — matrícula.
-- original_id_venda é a chave de receita (84% de cobertura); aluno_id NÃO é,
-- porque 42,6% dos alunos fizeram mais de um curso e cruzar por ele duplica
-- dinheiro. Os dois têm índice: o primeiro para somar, o segundo para a ficha
-- do aluno.
CREATE INDEX IF NOT EXISTS ix_matricula_venda
    ON public.fato_base_alunos (original_id_venda);
CREATE INDEX IF NOT EXISTS ix_matricula_aluno
    ON public.fato_base_alunos (aluno_id);
CREATE INDEX IF NOT EXISTS ix_matricula_data
    ON public.fato_base_alunos (data_matricula);
CREATE INDEX IF NOT EXISTS ix_matricula_curso_data
    ON public.fato_base_alunos (curso_id, data_matricula);
CREATE INDEX IF NOT EXISTS ix_matricula_consultor_data
    ON public.fato_base_alunos (consultor_id, data_matricula);
CREATE INDEX IF NOT EXISTS ix_matricula_turma
    ON public.fato_base_alunos (turma);
CREATE INDEX IF NOT EXISTS ix_matricula_fechamento
    ON public.fato_base_alunos (data_fechamento_venda);
-- Parcial: a taxa de conclusão só olha quem concluiu, e a maioria não concluiu.
CREATE INDEX IF NOT EXISTS ix_matricula_conclusao
    ON public.fato_base_alunos (data_conclusao)
    WHERE data_conclusao IS NOT NULL;


-- ----------------------------------------------------------------------------
-- FINANCEIRO
-- ----------------------------------------------------------------------------

-- fato_pagamento_base (12.348) — receita de curso.
CREATE INDEX IF NOT EXISTS ix_pagamento_data
    ON public.fato_pagamento_base (data_pagamento);
CREATE INDEX IF NOT EXISTS ix_pagamento_venda
    ON public.fato_pagamento_base (original_id_venda);
CREATE INDEX IF NOT EXISTS ix_pagamento_aluno
    ON public.fato_pagamento_base (aluno_id);
CREATE INDEX IF NOT EXISTS ix_pagamento_curso_data
    ON public.fato_pagamento_base (curso_id, data_pagamento);
CREATE INDEX IF NOT EXISTS ix_pagamento_consultor_data
    ON public.fato_pagamento_base (consultor_id, data_pagamento);
-- Inadimplência agrupa por status dentro do mês. 15% das linhas têm status
-- NULL (docs/DIVIDAS.md §1) — o índice as inclui, e é bom que inclua: elas
-- precisam aparecer no card de cobertura.
CREATE INDEX IF NOT EXISTS ix_pagamento_status_data
    ON public.fato_pagamento_base (status_pagamento, data_pagamento);
CREATE INDEX IF NOT EXISTS ix_pagamento_unidade_data
    ON public.fato_pagamento_base (unidade_geradora_venda, data_pagamento);
CREATE INDEX IF NOT EXISTS ix_pagamento_aprovacao
    ON public.fato_pagamento_base (data_aprovacao);

-- mv_venda_curso (25.420) — ponte pagamento → curso, veio SEM PK.
-- Sem índice aqui todo relatório de receita por curso faz seq scan em 25 mil
-- linhas para cada junção.
CREATE INDEX IF NOT EXISTS ix_venda_curso_venda
    ON public.mv_venda_curso (original_id_venda);
CREATE INDEX IF NOT EXISTS ix_venda_curso_curso
    ON public.mv_venda_curso (curso_id);

-- fato_contas_receber (12.929) e fato_contas_pagar (10.511) — Conta Azul.
-- O horizonte de caixa filtra por vencimento; o realizado, por pagamento; o
-- resultado por competência. São três datas diferentes e três índices.
CREATE INDEX IF NOT EXISTS ix_receber_vencimento
    ON public.fato_contas_receber (data_vencimento);
CREATE INDEX IF NOT EXISTS ix_receber_pagamento
    ON public.fato_contas_receber (data_pagamento);
CREATE INDEX IF NOT EXISTS ix_receber_competencia
    ON public.fato_contas_receber (data_competencia);
CREATE INDEX IF NOT EXISTS ix_receber_status_vencimento
    ON public.fato_contas_receber (status, data_vencimento);
CREATE INDEX IF NOT EXISTS ix_receber_categoria_competencia
    ON public.fato_contas_receber (categoria, data_competencia);
CREATE INDEX IF NOT EXISTS ix_receber_evento
    ON public.fato_contas_receber (evento_id);

CREATE INDEX IF NOT EXISTS ix_pagar_vencimento
    ON public.fato_contas_pagar (data_vencimento);
CREATE INDEX IF NOT EXISTS ix_pagar_pagamento
    ON public.fato_contas_pagar (data_pagamento);
CREATE INDEX IF NOT EXISTS ix_pagar_competencia
    ON public.fato_contas_pagar (data_competencia);
CREATE INDEX IF NOT EXISTS ix_pagar_status_vencimento
    ON public.fato_contas_pagar (status, data_vencimento);
CREATE INDEX IF NOT EXISTS ix_pagar_categoria_competencia
    ON public.fato_contas_pagar (categoria, data_competencia);
CREATE INDEX IF NOT EXISTS ix_pagar_centro_custo
    ON public.fato_contas_pagar (centro_custo);
CREATE INDEX IF NOT EXISTS ix_pagar_evento
    ON public.fato_contas_pagar (evento_id);

-- fato_liquidacao_cartao (24.890) — CisPay. Fluxo de caixa projetado e MDR.
CREATE INDEX IF NOT EXISTS ix_cartao_liquidacao
    ON public.fato_liquidacao_cartao (data_liquidacao);
CREATE INDEX IF NOT EXISTS ix_cartao_venda
    ON public.fato_liquidacao_cartao (data_venda);
CREATE INDEX IF NOT EXISTS ix_cartao_subseller_liquidacao
    ON public.fato_liquidacao_cartao (subseller_id, data_liquidacao);
CREATE INDEX IF NOT EXISTS ix_cartao_forma_liquidacao
    ON public.fato_liquidacao_cartao (forma_pagamento, data_liquidacao);
CREATE INDEX IF NOT EXISTS ix_cartao_bandeira
    ON public.fato_liquidacao_cartao (bandeira);
-- doc_norm (CPF só com dígitos) é o que ainda liga cartão a pessoa.
CREATE INDEX IF NOT EXISTS ix_cartao_doc
    ON public.fato_liquidacao_cartao (doc_norm);
-- cod_salesforce casa com só 2,7% das vendas e caiu para 0% em 2026
-- (docs/DESCOBERTAS.md §5). O índice serve a view de conciliação, que existe
-- justamente para medir esse buraco — não para atribuir receita.
CREATE INDEX IF NOT EXISTS ix_cartao_cod_salesforce
    ON public.fato_liquidacao_cartao (cod_salesforce);

-- fato_extrato_cispay (172) — pequena hoje, cresce um lote por mês.
CREATE INDEX IF NOT EXISTS ix_extrato_lancamento
    ON public.fato_extrato_cispay (data_lancamento);


-- ----------------------------------------------------------------------------
-- MARKETING
-- ----------------------------------------------------------------------------

-- fato_meta_insights (46.031) — PK é (data, campanha_id, anuncio_key).
-- Filtro por data sozinho já usa a PK; o que falta é entrar por campanha,
-- conjunto ou anúncio.
CREATE INDEX IF NOT EXISTS ix_meta_campanha_data
    ON public.fato_meta_insights (campanha_id, data);
CREATE INDEX IF NOT EXISTS ix_meta_adset_data
    ON public.fato_meta_insights (adset_id, data);
CREATE INDEX IF NOT EXISTS ix_meta_anuncio_data
    ON public.fato_meta_insights (anuncio_id, data);


-- ----------------------------------------------------------------------------
-- EVENTOS
-- ----------------------------------------------------------------------------

-- fato_pedidos (3.266) e fato_participantes (3.862) — Sympla.
CREATE INDEX IF NOT EXISTS ix_pedido_evento_data
    ON public.fato_pedidos (evento_id, data_pedido_dia);
CREATE INDEX IF NOT EXISTS ix_pedido_data
    ON public.fato_pedidos (data_pedido_dia);
CREATE INDEX IF NOT EXISTS ix_pedido_status
    ON public.fato_pedidos (status_pedido);
CREATE INDEX IF NOT EXISTS ix_pedido_campanha
    ON public.fato_pedidos (utm_campaign);
-- doc_norm e email_comprador_norm são as duas pontes comprador → aluno
-- (CPF cobre 74%, e-mail bem menos). Sem índice, o cruzamento vira produto
-- cartesiano contra 13.738 alunos.
CREATE INDEX IF NOT EXISTS ix_pedido_doc
    ON public.fato_pedidos (doc_norm);
CREATE INDEX IF NOT EXISTS ix_pedido_email
    ON public.fato_pedidos (email_comprador_norm);

CREATE INDEX IF NOT EXISTS ix_participante_evento_data
    ON public.fato_participantes (evento_id, data_pedido_dia);
CREATE INDEX IF NOT EXISTS ix_participante_pedido
    ON public.fato_participantes (pedido_id);
CREATE INDEX IF NOT EXISTS ix_participante_email
    ON public.fato_participantes (email_norm);


-- ----------------------------------------------------------------------------
-- PEDAGÓGICO
-- ----------------------------------------------------------------------------

-- fato_credenciamento (13.976) — PK é (aluno_id, curso_norm, turma), então
-- entrada por aluno já está servida. Falta entrar por turma e por período.
CREATE INDEX IF NOT EXISTS ix_credenciamento_turma
    ON public.fato_credenciamento (turma);
CREATE INDEX IF NOT EXISTS ix_credenciamento_curso
    ON public.fato_credenciamento (curso_id);
CREATE INDEX IF NOT EXISTS ix_credenciamento_data
    ON public.fato_credenciamento (data_credenciamento);

-- As quatro tabelas abaixo estão quase vazias, mas são justamente as que o
-- próprio portal ESCREVE (avaliação, retenção, envio pedagógico). Criar o
-- índice agora custa nada; criar depois, com a tela em uso, custa lock.
CREATE INDEX IF NOT EXISTS ix_avaliacao_data
    ON public.fato_avaliacao (data_curso);
CREATE INDEX IF NOT EXISTS ix_avaliacao_curso_data
    ON public.fato_avaliacao (curso, data_curso);
CREATE INDEX IF NOT EXISTS ix_avaliacao_treinador
    ON public.fato_avaliacao (treinador);
CREATE INDEX IF NOT EXISTS ix_avaliacao_turma
    ON public.fato_avaliacao (turma);

CREATE INDEX IF NOT EXISTS ix_avaliacao_evento_data
    ON public.fato_avaliacao_evento (data_evento);
CREATE INDEX IF NOT EXISTS ix_avaliacao_evento_nome
    ON public.fato_avaliacao_evento (evento);

CREATE INDEX IF NOT EXISTS ix_retencao_data
    ON public.fato_retencao (data_ligacao);
CREATE INDEX IF NOT EXISTS ix_retencao_desfecho
    ON public.fato_retencao (desfecho);

-- pedagogico_envios: PK é (aluno_id, turma_id, tipo); a fila do pedagógico
-- entra por turma e por status, não por aluno.
CREATE INDEX IF NOT EXISTS ix_envio_turma_status
    ON public.pedagogico_envios (turma_id, status);


-- ----------------------------------------------------------------------------
-- LOJA (Centro Conceito)
-- ----------------------------------------------------------------------------

-- fato_loja_cupom (12.541), item (19.110) e pagamento (12.728).
-- Item e pagamento têm PK (cupom_id, seq_item): entrada por cupom já resolvida.
CREATE INDEX IF NOT EXISTS ix_loja_cupom_data
    ON public.fato_loja_cupom (data_emissao);
CREATE INDEX IF NOT EXISTS ix_loja_cupom_cliente
    ON public.fato_loja_cupom (cliente_id);
CREATE INDEX IF NOT EXISTS ix_loja_cupom_vendedor
    ON public.fato_loja_cupom (vendedor_id);

CREATE INDEX IF NOT EXISTS ix_loja_item_produto
    ON public.fato_loja_item (produto_id);

CREATE INDEX IF NOT EXISTS ix_loja_pagamento_data
    ON public.fato_loja_pagamento (data_transacao);
CREATE INDEX IF NOT EXISTS ix_loja_pagamento_forma
    ON public.fato_loja_pagamento (forma);

CREATE INDEX IF NOT EXISTS ix_loja_estoque_codigo
    ON public.fato_loja_estoque (codigo);

-- mes_ref é a chave de todo painel mensal da loja.
CREATE INDEX IF NOT EXISTS ix_loja_curso_mes
    ON public.fato_loja_curso (mes_ref);
CREATE INDEX IF NOT EXISTS ix_loja_receita_extra_mes
    ON public.fato_loja_receita_extra (mes_ref);
CREATE INDEX IF NOT EXISTS ix_loja_receita_extra_data
    ON public.fato_loja_receita_extra (data_venda);


-- ----------------------------------------------------------------------------
-- DIMENSÕES — só as pontes entre sistemas
-- ----------------------------------------------------------------------------

-- dim_alunos (13.738). doc_norm é o CPF só com dígitos: a ponte de 74% entre
-- comprador de evento e aluno.
CREATE INDEX IF NOT EXISTS ix_aluno_doc
    ON public.dim_alunos (doc_norm);
CREATE INDEX IF NOT EXISTS ix_aluno_email
    ON public.dim_alunos (email);
CREATE INDEX IF NOT EXISTS ix_aluno_unidade
    ON public.dim_alunos (unidade);
-- Índice de EXPRESSÃO: a ponte lead → aluno casa pelos ÚLTIMOS 8 DÍGITOS do
-- telefone (40% de cobertura; por e-mail dá 3% e não serve). Sem isto, o
-- cruzamento é 66.394 × 13.738 com função em cima da coluna, o que descarta
-- qualquer índice comum. right() é imutável, então pode ser indexada.
CREATE INDEX IF NOT EXISTS ix_aluno_tel8
    ON public.dim_alunos (right(telefone, 8));

-- dim_leads (66.394) — o outro lado da mesma ponte.
-- data_criacao NÃO ganha índice: está 100% NULL (docs/DIVIDAS.md §4). Quando o
-- ETL do Clint for consertado, crie o índice na mesma hora.
CREATE INDEX IF NOT EXISTS ix_lead_tel8
    ON public.dim_leads (right(telefone_completo, 8));
CREATE INDEX IF NOT EXISTS ix_lead_email
    ON public.dim_leads (email);

-- dim_turmas (234): pequena, mas sf_turma_id é chave de junção com o
-- Salesforce e curso+data_inicio é como o pedagógico lista turma.
CREATE INDEX IF NOT EXISTS ix_turma_sf
    ON public.dim_turmas (sf_turma_id);
CREATE INDEX IF NOT EXISTS ix_turma_curso_inicio
    ON public.dim_turmas (curso, data_inicio);
