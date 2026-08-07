# Hub Executivo

O painel da diretoria: visão consolidada da empresa, setor a setor, com metas,
esperado até a data, comparações honestas e projeção de fechamento — tudo
calculado no backend a partir das tabelas base VIVAS (nunca das views
congeladas em `snapshot.*`).

## Onde as coisas moram

| o quê | onde |
|---|---|
| Catálogo de indicadores (a ÚNICA fonte das fórmulas) | `apps/api/src/modules/executivo/indicadores.ts` |
| Motor de cálculo (puro, testado) | `apps/api/src/modules/executivo/calculos.ts` + `calculos.spec.ts` |
| Orquestração, cache e qualidade | `apps/api/src/modules/executivo/executivo.service.ts` |
| Alertas e destaques (regras) | `apps/api/src/modules/executivo/alertas.ts` |
| Metas (cadastro + trilha) | `apps/api/src/modules/executivo/metas.service.ts` |
| Telas | `apps/web/src/components/executivo/` + rotas `app/(app)/executivo/` |

## Rotas

- `/executivo` — visão geral (cards, ritmo da meta, atenção/avanços, setores,
  consolidado anual, fontes). Filtros na URL: `?mes=YYYY-MM&comparar=...`.
- `/executivo/indicadores/<codigo>` — tela analítica; herda os filtros pela URL.
- `/executivo/metas` — cadastro de metas (admin; gestor define as do próprio
  setor pela API).

API: `GET /api/executivo/resumo|anual/:c|ritmo/:c|indicadores/:c[/tabela|/exportar]`,
`GET|PUT /api/executivo/metas`, `GET|PUT /api/executivo/preferencias`,
`POST /api/executivo/atualizar`, `GET /api/executivo/exportar`.

## As regras que não se quebram

1. **Receita de cursos, de eventos e da loja nunca se somam** (DESCOBERTAS §1).
   Não existe card "receita total".
2. **Conta Azul não se soma com Salesforce** — é livro-caixa: inadimplência,
   recebido, a pagar. Por isso NÃO existe card de "lucro/resultado": receita
   (Salesforce, bruta) e despesa (Conta Azul, parcial) não fecham entre si.
3. **Mês parcial compara com o mesmo nº de dias** do mês anterior e do ano
   anterior (DESCOBERTAS §9) — nunca parcial contra cheio sem rótulo.
4. **Esperado até hoje ≠ meta/30×dia**: é a meta × a fração que os últimos 12
   meses fechados tinham realizado até este dia (fim de semana e concentração
   de boleto entram sozinhos). Fallback: dias úteis; depois, linear — e o card
   diz qual régua usou.
5. **Projeção nunca é certeza**: central + faixa provável (frações de cada mês
   histórico) + confiança (alta/média/baixa/insuficiente) + o método por
   escrito. Nos 2 primeiros dias do mês não há projeção.
6. **Sem meta cadastrada → "Sem meta definida"**. Nada é classificado contra
   meta inexistente, e nenhum número simulado entra no painel.
7. **Textos executivos nascem de regra sobre números calculados** — nunca de
   LLM (DIVIDAS §10). Alertas citam o número que os disparou; causas não
   comprovadas entram como "possíveis fatores a investigar".
8. **Permissão no backend, por indicador**: o resumo do gestor só traz os
   setores dele; indicador de outro setor responde 403 (mesma regra do
   módulo de dados).

## Fontes e vivacidade (o que o badge de qualidade mostra)

| fonte | tabelas | estado |
|---|---|---|
| Salesforce (e-mail/IMAP) | fato_pagamento_base, fato_base_alunos | vivo, 3×/dia |
| Omie (PDV) | fato_loja_* | vivo, diário |
| Sympla | fato_pedidos, fato_participantes | vivo, diário |
| CisPay | fato_liquidacao_cartao | vivo, diário |
| Planilhas da loja | fato_loja_meta_mes/curso, fechamento, extras | vivo, diário |
| Conta Azul | fato_contas_receber/pagar | OAuth pendente — badge crítico |
| Meta Ads | fato_meta_insights | OAuth pendente — badge crítico |
| Clint | fato_negocio_lead | sem ETL — dados congelados, badge crítico |

## Metas

`meta_indicador` (indicador, escopo mes|ano, competência, valor) — cadastro em
`/executivo/metas`. Precedência: **cadastro > planilha da loja**. Toda escrita
audita antes/depois em `auditoria_acesso`. Meta anual só vale se explícita
(escopo `ano`): somar mensais parciais enganaria.

## Cache e atualização

Séries ficam 5 min em memória por indicador (a permissão filtra na resposta,
então o cache é compartilhado sem vazar setor). "Atualizar dados" (`POST
/executivo/atualizar`) limpa tudo e audita. Escrever meta também invalida.

## Limitações conhecidas (por falta de dado, não de código)

- Sem filtro de unidade/filial: `unidade_geradora_venda` é constante
  ("FEBRACIS SALVADOR 2") — empresa de unidade única no dado atual.
- RH, Atendimento/CS, Projetos, Compras: nenhuma fonte no sistema — setores
  não aparecem (aparecer vazio seria pior que não aparecer).
- Conversão lead→matrícula não vira KPI: a ponte é telefone com 40% de
  cobertura (DESCOBERTAS §3) — número que enganaria mais do que informaria.
- Exportação: CSV (abre no Excel) e impressão do navegador para PDF; XLSX
  nativo e imagem de gráfico ficaram de fora desta fase.
