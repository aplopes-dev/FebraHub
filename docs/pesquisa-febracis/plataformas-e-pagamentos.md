---
title: Plataformas, sistemas e pagamentos
tags: [febracis, integracao, pagamentos, sistemas]
criado: 2026-08-27
---

# Plataformas, sistemas e pagamentos

## O que a rede usa publicamente

| Plataforma | Papel |
|---|---|
| **Sympla** | Venda de ingressos e gestão de eventos. Cada unidade tem página de produtor (ex.: `sympla.com.br/produtor/febracisbahia`) |
| **Hotmart** | Venda de turmas e produtos digitais (ex.: "Método CIS Turma 248") |
| **Landing pages próprias** | `lp.febracis.com`, `go.febracis.com`, `go.metodocis.com`, `ed.febracis.com` — cada campanha com sua LP |
| **CisPay Pagamentos Ltda** | Braço de pagamentos do ecossistema. Fortaleza/CE, fundada em 12/10/2018, CNPJ 32.230.678/0001-57. Cartão em até 12x, Pix, transferência |
| **SCIS / SCIS App** | Sistema para os coaches formados pela rede |
| **CIS Assessment** | Plataforma própria de perfil comportamental ([[cis-assessment]]) |
| **Suporte** | `suporte.febracis.com.br` (Zendesk) — central de ajuda para alunos |

## O que a unidade de Salvador já tem integrado no FebraHub

Do [`BRIEFING.md`](../BRIEFING.md): **Salesforce, Clint, Sympla e CisPay** (schedules-ex + extrato),
mais Conta Azul/Omie no financeiro.

| Sistema | Onde entra no funil |
|---|---|
| **Clint** | Topo/meio de funil — captação e cadência comercial |
| **Salesforce** | CRM — oportunidade, matrícula, receita bruta |
| **Sympla** | Ingressos de evento (com **taxa de 11,5%**) |
| **CisPay** | Recebíveis da adquirente — **custo real de maquininha 3,10%**, validado contra extrato |
| **Conta Azul / Omie** | Livro-caixa — despesa, a pagar, inadimplência |

> [!important] O ponto crítico já documentado
> **Bruto ≠ líquido.** Sympla come 11,5%, cartão come 3,10%, e isso aparecia como receita no Power BI
> sem nunca ter entrado no caixa. Qualquer feature nova que toque receita herda essa regra.

## Riscos de integração conhecidos

1. **Múltiplas fontes para o mesmo fato** — uma matrícula pode existir no Sympla (ingresso), no
   Salesforce (oportunidade) e no CisPay (recebível). Sem chave de conciliação, o fan-out infla
   receita — erro que o BRIEFING já registra ter acontecido duas vezes.
2. **Plataformas nacionais fora do controle da unidade** — se a venda de uma turma nacional roda em
   Hotmart pela franqueadora, a unidade pode **não ter o dado bruto**, só o repasse.
   → toda métrica precisa declarar cobertura.
3. **CisPay é parte do grupo** — não é uma adquirente neutra de mercado. Prazos e retenções são
   decisão do ecossistema, e há reclamações públicas sobre retenção de valores
   ([[reputacao-e-riscos]]). Isso é **risco de fluxo de caixa**, e justifica o painel de
   projeção 30/60/90 dias direto da adquirente.

---
Relacionados: [[funil-comercial-e-jornada-do-aluno]] · [[implicacoes-para-o-febrahub]] · [[reputacao-e-riscos]]
