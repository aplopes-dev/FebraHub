---
title: Reputação, críticas e riscos
tags: [febracis, risco, compliance, reputacao]
criado: 2026-08-27
---

# Reputação, críticas e riscos

> [!warning] Por que isso está na pesquisa
> Não é fofoca: reclamação recorrente é **sinal de processo**. Cada padrão de reclamação abaixo
> aponta um ponto onde a operação sangra dinheiro, tempo de atendimento ou risco jurídico — e
> portanto, um lugar onde o [[implicacoes-para-o-febrahub|FebraHub]] pode medir algo útil.

## Padrões de reclamação pública (Reclame Aqui)

| Padrão | Descrição | O que revela operacionalmente |
|---|---|---|
| **Propaganda enganosa** | Divergência entre o que foi vendido e o que foi entregue | Falha de expectativa na venda em sala; risco de reembolso |
| **Conteúdo religioso não anunciado** | Curso vendido como "inteligência emocional com base científica"; alunos relatam forte conteúdo evangélico/apostólico | Descasamento entre promessa e produto; principal gerador de pedido de reembolso |
| **Pressão emocional e exposição** | Relatos de obrigação de compartilhar traumas com estranhos, dinâmicas obrigatórias e monitoramento por staff | Risco reputacional e de saúde do participante |
| **Venda agressiva dentro do curso** | Relatos de incentivo a pegar dinheiro emprestado para comprar mais cursos | Ticket alto com risco de arrependimento → inadimplência e chargeback |
| **Curso presencial cancelado/mudado de praça** | Aluno paga em uma cidade e o curso deixa de existir ali | Passivo de crédito de aluno; obrigação de entrega futura |
| **Retenção de valores / CisPay** | Reclamações sobre repasse e retenção | Risco de fluxo de caixa ([[plataformas-e-pagamentos]]) |

## Questionamento à base científica

A empresa afirma fundamento em neurociência, PNL, psicologia positiva e "física quântica".
Críticos e participantes contestam a validade dessa afirmação. **PNL e "física quântica" aplicada a
comportamento não têm respaldo científico estabelecido** — é um ponto de fragilidade conhecido do
setor de coaching como um todo, não só da Febracis.

## Investigação noticiada

Foi noticiada apuração do **Ministério Público do Ceará** sobre denúncia de prática discriminatória
em treinamento interno de recrutadores (slide indicando não contratar pessoas de determinada
orientação política ou religião), a partir de denúncia de ex-funcionária.
⚠️ **Não confirmei desfecho.** Registrar como *noticiado*, não como *julgado*.

## Riscos que se traduzem em requisito

1. **Reembolso e arrependimento (CDC)** — venda em evento presencial e venda online têm regras
   distintas de direito de arrependimento. A unidade precisa saber **quanto perde por reembolso, por
   produto e por evento**.
2. **Inadimplência e chargeback** — ticket alto, parcelamento longo, decisão emocional em sala.
   O BRIEFING já aponta que estornos e chargebacks eram perdas nunca contabilizadas.
3. **Passivo de entrega** — aluno que comprou e ainda não cursou é **obrigação**, não receita
   realizada. Turma cancelada vira crédito a honrar.
4. **LGPD** — dado comportamental ([[cis-assessment]]), relatos pessoais em sala, base de leads.
   Reforça a regra do BRIEFING: **views por hub, sem PII**, RLS no banco e não no React.
5. **Risco de marca concentrado no fundador** ([[paulo-vieira]]) e nas polêmicas nacionais — a
   unidade local absorve o impacto sem controlar a causa.

> [!note] Postura recomendada para o produto
> O FebraHub é **interno**. Ele não precisa opinar sobre a metodologia — precisa **medir a operação
> com honestidade**, inclusive as perdas. Textos executivos nascem de regra sobre número calculado,
> nunca de LLM (regra 7 do [`HUB_EXECUTIVO.md`](../HUB_EXECUTIVO.md)) — e isso vale em dobro num
> assunto sensível como este.

---
Relacionados: [[febracis-visao-geral]] · [[funil-comercial-e-jornada-do-aluno]] · [[fontes]]
