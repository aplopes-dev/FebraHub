# Comercial — roteiro de testes manuais

Pré-requisito: `pnpm --filter @febrahub/web dev` → <http://127.0.0.1:3107>.
Os dados vêm do `src/lib/mock-db` (memória do processo): recarregar a página
mantém, reiniciar o servidor volta à semente.

## Funil (`/comercial/funil`)

1. Arrastar um card entre etapas abertas — o card fica na coluna nova.
2. Arrastar para **Perdida** — a caixa de motivo abre e o card **volta** se
   você cancelar.
3. Confirmar o motivo — o card vai para Perdida.
4. Clicar nos recortes rápidos (Paradas, Follow-up vencido, Sem próxima ação,
   Aguardando aprovação) — a contagem do chip bate com o que a coluna mostra.
5. Alternar Quadro/Lista e recarregar — a escolha persiste (localStorage).

## Ficha (`/comercial/oportunidades/<id>`)

1. Registrar uma interação — aparece no topo da linha do tempo.
2. Agendar próxima ação numa oportunidade sem ação — o card amarelo vira o card
   com prazo.
3. Editar a proposta com desconto **acima** da alçada do produto → status
   "Aguardando aprovação" + aviso no toast.
4. Aprovar o desconto → status muda para "Dentro da alçada".
5. **Marcar como ganha** → aparece a faixa da venda; conferir em
   `/comercial/vendas` que ela nasceu *aguardando aprovação* / financeiro
   *pendente*.

## Eventos (`/comercial/eventos`)

1. Abrir a edição "acontecendo" — funil da edição com quatro degraus.
2. Conferir que **receita de ingresso** e **matrículas geradas** aparecem
   separadas (não somam).

## Sala (`/comercial/eventos/edi-if-ago/sala`)

1. Filtro "A abordar" — só quem entrou e ainda não foi abordado.
2. Check-in em alguém de "Ainda não chegou" — contador "Na sala" sobe.
3. Registrar abordagem com **Matriculou** — contador de matrículas e conversão
   sobem; a venda aparece em `/comercial/vendas`.
4. Desfazer check-in — a pessoa volta para "Esperado".

## Leads (`/comercial/leads`)

1. Ligar "Somente sem dono" — só leads órfãos.
2. Atribuir dono pelo seletor da linha — o lead sai do recorte.
3. Converter um lead — vira oportunidade na primeira etapa, com a origem
   preservada.

## Vendas (`/comercial/vendas`)

1. Aba "Aguardando aprovação" — aprovar uma venda muda só o status comercial.
2. Abrir o detalhe — plano de parcelas em leitura, tabela × praticado.

## Pessoas (`/clientes`)

1. A lista tem gente; as abas Leads / Em negociação / Alunos / Ex-alunos filtram.
2. Clicar numa linha abre a **jornada**: compras, eventos e indicações.

## Visão geral (`/comercial`)

1. Os cards refletem o mês corrente e o rótulo diz que o mês é parcial.
2. "Precisa de atenção" leva para a tela onde o problema se resolve.
