# FebraHub — Briefing

Contexto completo para retomar o projeto (ou passar ao Claude Code).
Leia junto com [`DESCOBERTAS.md`](DESCOBERTAS.md), [`DIVIDAS.md`](DIVIDAS.md) e
[`../AGENTS.md`](../AGENTS.md) (estado técnico vivo do workspace).

---

## O que é

**Sistema de gestão da unidade Febracis Salvador** — um ERP próprio, feito sob medida para
como *esta* unidade opera.

O escopo é a operação inteira, não um recorte: captar e matricular aluno, entregar turma,
vender no balcão, comprar e controlar estoque, emitir documento fiscal, fechar o caixa,
conciliar banco e adquirente, e mostrar à diretoria onde a unidade está ganhando e perdendo
dinheiro.

A diretora (**Dulce Mariano**) tem o **Hub Executivo**, com visão consolidada; cada setor
opera e enxerga o próprio módulo.

> [!NOTE]
> O que a Febracis vende, por qual funil, com qual estrutura de franquia e quais riscos —
> está pesquisado em [`pesquisa-febracis/`](pesquisa-febracis/febracis-moc.md).
> Toda feature nova deve nascer entendendo o negócio, não só o schema.

### Como chegamos aqui

O projeto começou como **portal de dashboards** substituindo o Power BI (fase React + Vite +
Supabase, hoje em `web/` — **legado, não usar**). O diagnóstico daquela fase segue valendo e
está em [`DESCOBERTAS.md`](DESCOBERTAS.md): os números eram inauditáveis porque **a operação
não tinha sistema** — o dado nascia em planilha, Sympla, CRM e maquininha, e ninguém
conseguia fechar.

A conclusão foi que medir bem exige **operar dentro do sistema**. Daí o FebraHub virou ERP:
o painel executivo passou a ler o que a própria operação registra, e não um ETL tentando
remontar a verdade depois do fato.

---

## Escopo — módulos

Fonte de verdade da navegação: `apps/web/src/lib/navigation.ts`.

| Módulo | O que resolve |
|---|---|
| **Início** | O que precisa de atenção hoje · Hub Executivo (metas, ritmo, projeção) |
| **Comercial** | Da captação ao fechamento da matrícula: clientes, campanhas, pedidos, contratos, promoções |
| **Pedagógico** | Turmas, alunos e secretaria |
| **Loja** | Balcão/PDV, fila de pedidos, cardápio e catálogo de produtos |
| **Suprimentos** | Compras, estoque, inventário, transferências, produção, fornecedores, transportadoras |
| **Financeiro** | Caixa, lançamentos, títulos, boletos, plano de contas, centro de custo, conciliação bancária e de cartões, apuração |
| **Fiscal** | NFC-e (mod. 65), NF-e, NFS-e, SAT-CFe, cupom não fiscal — ver `apps/api/FISCAL.md` |
| **Marketing** | Redes sociais, conteúdo e campanhas |
| **Organização** | Estrutura, processos e memória da unidade |
| **Administração** (rodapé) | Acessos e permissões · Conexões/integrações · Unidade |

**Multi-praça:** a mesma liderança opera Salvador **e Recife**
(ver [`pesquisa-febracis/unidade-salvador-bahia.md`](pesquisa-febracis/unidade-salvador-bahia.md)).
`unidade/praça` é dimensão de primeira classe — não filtro improvisado.

---

## Stack

**Monorepo pnpm.**

- **`apps/api/`** — NestJS + Prisma + Postgres. Auth por sessão JWT; permissões por
  `PerfilAcesso`/`PerfilSetor`. Storage MinIO.
- **`apps/web/`** — Next.js App Router. Navegação em rail + painel (`navigation.ts`).
- **`db/`** — SQL das views `vw_*` e das tabelas analíticas (`fato_*`/`dim_*`/`mv_*`).
- **`etl/`** — Python, ingestão das fontes externas.
- **`web/`** — ⚠️ **legado** Vite + Supabase. Não usar.

Detalhes de build, deploy, topologia (homolog × prod) e gotchas: [`../AGENTS.md`](../AGENTS.md).

### Integrações

| Sistema | Papel |
|---|---|
| **Salesforce** | CRM — oportunidade, matrícula, receita bruta |
| **Clint** | Captação e cadência comercial |
| **Sympla** | Ingressos de evento — **taxa de 11,5%** |
| **CisPay / Stone / Asaas** | Adquirência e recebíveis — **custo real de maquininha 3,10%** |
| **Omie / Conta Azul** | Livro-caixa: despesa, a pagar, inadimplência |

---

## Números que a Febracis não tinha

Levantados na fase de diagnóstico e ainda válidos como linha de base:

| KPI | valor |
|---|---|
| Fluxo de caixa projetado (30/60/90d) | direto da adquirente |
| Custo de maquininha | **3,10%** — validado contra o extrato bancário |
| Taxa do Sympla | 11,5% — R$ 17.280 |
| Receita por curso | 84% de cobertura, soma fechando em R$ 47,17M |
| Conversão real evento → curso | **2,9%** (não 9,1% — ver DESCOBERTAS §2) |
| Estornos e chargebacks | perdas nunca contabilizadas |

> **Cielo:** comercialmente é CisPay, mas 0/408 têm liquidação na `fato_liquidacao_cartao`.
> Provavelmente cobranças por link direto, cujo fluxo a API `schedules-ex` não retorna
> (mesma causa do `cod_salesforce` órfão). Consequência: os ~408 pagamentos Cielo entram
> como bruto, sem a taxa de 3,10% medida. **Não estimar a taxa** — mostrar como bruto e
> sinalizar cobertura.

---

## Princípios — valem para toda decisão

**1. Fail loud, never silent.**
O bug dos 66 mil NULLs existiu porque o pipeline "funcionava". Todo ETL aborta se um
campo obrigatório vier abaixo de 50%. Vale igual para importação e integração.

**2. Segurança no servidor, não na tela.**
Se depende de o front esconder o botão, não é segurança. Permissão se decide na API
(guard + `PerfilAcesso`) e no banco; a tela só reflete.

**3. Toda métrica de ponte exibe sua cobertura.**
Nenhuma ponte chega a 100%. Um número sem rótulo de cobertura é um número que a Dulce
desconfia uma vez e nunca mais usa.

**4. Bruto ≠ líquido ≠ recebido.**
Sympla come 11,5%. Cartão come 3,10%. Isso aparecia como receita no Power BI e nunca
entrou no caixa.

**5. Não somar unidades de negócio diferentes.**
R$ 46 (evento) e R$ 6.138 (curso) não são a mesma coisa. Um total conjunto não significa
nada. Não existe card "receita total".

**6. Agregue antes de juntar, nunca depois.**
Fan-out já inflou a receita duas vezes. Se um número parecer bom demais, suspeite disso
primeiro.

**7. Use o último mês fechado.**
Comparar 14 dias contra o mês inteiro produz "-99%". Correto e enganoso.

**8. Nunca invente o que não existe.**
Sem metas no banco → sem KPI de meta. Sem IA → sem "gerado pela IA". Prometer o que não
existe é o jeito mais rápido de perder a confiança da diretoria.

**9. Quem opera registra; quem mede lê o registro.**
Agora que a operação roda aqui dentro, indicador novo nasce do que a tela já grava —
não de um ETL remontando a verdade depois. Se o número não tem origem no fluxo de
trabalho, o problema é o fluxo, não o dashboard.

---

## Onde continuar

- **Pendências e dívidas técnicas:** [`DIVIDAS.md`](DIVIDAS.md)
- **Diagnóstico dos dados (por que cada número é o que é):** [`DESCOBERTAS.md`](DESCOBERTAS.md)
- **Estado técnico vivo, deploy e gotchas:** [`../AGENTS.md`](../AGENTS.md)
- **Regras do painel executivo:** [`HUB_EXECUTIVO.md`](HUB_EXECUTIVO.md)
- **Contexto de negócio da Febracis:** [`pesquisa-febracis/`](pesquisa-febracis/febracis-moc.md)
