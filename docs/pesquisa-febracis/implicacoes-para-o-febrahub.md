---
title: Implicações para o FebraHub — de pesquisa a feature
tags: [febrahub, produto, features, roadmap]
criado: 2026-08-27
---

# Implicações para o FebraHub — de pesquisa a feature

> [!abstract] Como ler esta nota
> Cada bloco parte de **um fato do negócio** (com link para a nota que o sustenta) e termina em
> **o que isso exige do sistema**. Não é backlog aprovado — é matéria-prima para o backlog.
> As regras existentes em [`BRIEFING.md`](../BRIEFING.md), [`HUB_EXECUTIVO.md`](../HUB_EXECUTIVO.md)
> e [`DESCOBERTAS.md`](../DESCOBERTAS.md) mandam mais que qualquer coisa aqui.

> [!important] O escopo é gestão completa, não painel
> O FebraHub é o **ERP da unidade Febracis Salvador**: comercial, pedagógico, loja, suprimentos,
> financeiro, fiscal, marketing e organização ([`BRIEFING.md`](../BRIEFING.md)).
> Por isso cada implicação abaixo tem **duas faces**: o que precisa ser *registrado na operação*
> (tela, campo, fluxo de trabalho) e só depois o que vira *indicador*.
> Indicador que não tem origem num fluxo de trabalho da própria casa é ETL adivinhando —
> foi exatamente o que se provou insustentável na fase Power BI.

## 1. Modelagem: produto ≠ turma ≠ ingresso

**Fato:** um mesmo curso varia em modalidade, nível, categoria de ingresso, lote, turma e instrutor
([[catalogo-de-produtos]]).

**Exige:**
- Hierarquia `produto → edição/turma → categoria de ingresso → lote/preço`.
- Campo `instrutor/âncora` na edição — evento com [[paulo-vieira|âncora nacional]] não é comparável
  com edição local.
- `praça/unidade` como dimensão de primeira classe (Salvador **e** Recife — [[unidade-salvador-bahia]]).

## 2. Comercial: a métrica-mãe é conversão evento → curso

**Fato:** a conversão real é **2,9%**, não 9,1% (DESCOBERTAS §2), e a operação é dirigida a eventos
([[funil-comercial-e-jornada-do-aluno]]).

**Exige:**
- Funil por evento: **convidados → confirmados → check-in → oferta → matrícula**, com no-show explícito.
- Conversão sempre por **coorte de evento**, nunca média do mês.
- Origem do lead separando **indicação/convite de aluno** de **tráfego pago** (Clint × Salesforce).

## 3. Preço praticado, não preço de tabela

**Fato:** desconto agressivo e por tempo limitado é estrutural
([[metodo-cis-e-coaching-integral-sistemico]]).

**Exige:**
- **Ticket médio por lote e por categoria** como KPI, acima de "ingressos vendidos".
- Indicador de **desconto concedido** (R$ e %) por evento e por vendedor.
- Alerta quando o desconto médio de um lote foge da faixa histórica.

## 4. Financeiro: bruto, líquido e caixa são três números

**Fato:** Sympla 11,5%, cartão 3,10%, CisPay com risco de retenção
([[plataformas-e-pagamentos]]).

**Exige:**
- Toda receita exibida com as três camadas: **bruto → líquido de taxa → recebido em caixa**.
- Projeção 30/60/90 dias a partir da adquirente (já existe — manter como fonte de verdade do caixa).
- **Estorno, chargeback e reembolso** como linha de perda visível, por produto e por evento.

## 5. Passivo de entrega: aluno que comprou e não cursou

**Fato:** ticket vendido em evento pode ser cursado meses depois; há histórico de turma cancelada
por praça ([[reputacao-e-riscos]]).

**Exige:**
- Indicador de **backlog pedagógico**: matrículas pagas ainda não entregues, por produto e por idade.
- Isso é **obrigação**, não receita realizada — não pode ser somado como performance do mês.
- Ligação com o hub **Pedagógico** (turmas, salas, instrutor, frequência, conclusão).

## 6. Eventos: custo do evento inteiro, não só o ingresso

**Fato:** eventos têm auditório, montagem, lounge/alimentação para Black/Diamond, staff, gráfica
([[modelo-de-franquia-e-unidades]]).

**Exige:**
- **P&L por evento**: receita de ingresso + receita de matrícula gerada em sala − custos diretos.
- Sem isso, "evento lotado" e "evento lucrativo" continuam sendo confundidos.
- Custo por participante e **CAC por matrícula originada no evento**.

## 7. Loja e estoque: o varejo da unidade é real

**Fato:** a sede tem livraria/loja e materiais; o depósito já tem 218 produtos de apostilas e
materiais mapeados ([[unidade-salvador-bahia]], AGENTS.md).

**Exige:**
- Consumo de material **vinculado à turma** (cada aluno consome kit/apostila) → previsão de compra a
  partir da agenda pedagógica, não do histórico de venda.
- Ruptura de apostila antes de turma é falha operacional visível — merece alerta.

## 8. CIS Assessment como custo variável e como dado sensível

**Fato:** aplicações vêm embutidas em ingressos e são vendidas avulso; são dados comportamentais
([[cis-assessment]]).

**Exige:**
- Contagem de **aplicações consumidas por turma/evento** → custo variável por aluno na margem real.
- **Nunca** expor resultado individual em view de hub. RLS no banco, sem PII.

## 9. Marketing: campanha por LP, não por "mês"

**Fato:** a rede opera por landing pages e campanhas por produto/edição
([[plataformas-e-pagamentos]]).

**Exige:**
- Custo de mídia atribuído à **edição do evento**, não ao mês calendário.
- CPL → CPA → CAC amarrados na mesma coorte usada no item 2.

## 10. Executivo: nada disso se soma

**Fato:** receita de curso, de evento e de loja são unidades de negócio diferentes (regra 5 do
BRIEFING; regra 1 do HUB_EXECUTIVO).

**Exige:** manter a proibição do card "receita total". A pesquisa **confirma** a regra: um ingresso de
R$ 46 e uma formação de R$ 6.138 pertencem a etapas distintas da mesma escada — somá-los apaga
justamente a informação que interessa (onde a escada está quebrando).

## 11. Matrícula é contrato, não evento pontual

**Fato:** ticket alto, parcelamento longo, decisão tomada em sala, entrega meses depois
([[funil-comercial-e-jornada-do-aluno]]).

**Exige (operação):** cadastro de **contrato de venda** com produto, turma prevista, condição de
pagamento, desconto concedido e vendedor — vinculado ao cliente.
**Exige (indicador):** receita reconhecida × recebida × a entregar saem do mesmo registro, sem
reconciliação manual.

## 12. Secretaria pedagógica é o outro lado do caixa

**Fato:** a unidade tem salas de coaching, turmas e instrutores ([[unidade-salvador-bahia]]).

**Exige (operação):** turma com data, local, instrutor, capacidade e lista de presença; a matrícula
do item 11 aponta para ela.
**Exige (indicador):** backlog de entrega (item 5), ocupação de turma e custo de instrutor por aluno
— nenhum deles é obtenível sem a tela de secretaria existir.

## 13. Fiscal e loja: o varejo da unidade é regulado

**Fato:** a sede vende livros, kits e apostilas no balcão ([[catalogo-de-produtos]]).

**Exige:** NFC-e/cupom por venda de balcão, e **parâmetro fiscal por produto** (NCM/CFOP/CST) —
hoje ainda em default. Curso é serviço (NFS-e), material é mercadoria (NFC-e/NF-e): **naturezas
fiscais distintas dentro do mesmo cliente**, e o sistema precisa separar isso na origem.

## 14. Permissão espelha o organograma da unidade

**Fato:** setores com interesses distintos operam a mesma base (comercial, pedagógico, financeiro,
loja) e a diretoria vê tudo.

**Exige:** perfil por setor decidido na API, não na tela (princípio 2 do BRIEFING). Dado
comportamental e relato pessoal ([[cis-assessment]], [[reputacao-e-riscos]]) não circulam entre
setores só porque estão no mesmo banco.

---

## Perguntas que a pesquisa pública **não** respondeu

Ficam como pauta para validar internamente com a Dulce/diretoria:

1. Qual o **repasse/royalty** efetivo da unidade para a franqueadora, por produto? (define margem real)
2. Quais produtos a unidade vende **por conta própria** e quais são **venda nacional com repasse**?
   (define o que existe no dado bruto local)
3. Como funciona o modelo de **staff/voluntariado** em evento — há custo, há vínculo?
4. Qual a política oficial de **reembolso e cancelamento**, por canal de venda?
5. Prazos e regras de **retenção do CisPay** — o que é contrato e o que é exceção?
6. **Recife** entra no FebraHub? Se sim, quando — e o modelo de dados já precisa nascer multi-praça.

---
Volta ao índice: [[febracis-moc]]
