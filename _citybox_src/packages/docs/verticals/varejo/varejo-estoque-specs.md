# Especificações de Desenvolvimento: Módulo de Estoque e Compras (Varejo)

Este documento contém as histórias de usuário (Specs) necessárias para a construção do motor de Estoque e Fornecimento na API da vertical de varejo, substituindo os mocks locais e unificando dívidas arquiteturais.

---

## Spec 1: Gestão Unificada de Fornecedores

**Objetivo Principal:** Unificar os modelos legados (`RetailSupplier` e `InventorySupplier`) em um único cadastro central e persistente, permitindo o gerenciamento completo dos parceiros B2B da loja.
**Atores:** Gerente de Loja, Analista de Compras.
**Caminho Feliz (Fluxo Principal):** O analista acessa a listagem de Fornecedores, clica em "Novo", preenche o formulário via wizard (dados básicos, contatos e marcas representadas). Ao salvar, os dados vão para a API e o fornecedor aparece imediatamente na listagem paginada, disponível para emissão de pedidos.
**Regras de Negócio e Validações:**
*   **Unicidade:** O CNPJ (se informado) deve ser único dentro da mesma loja (tenant).
*   **Bloqueio de Exclusão:** Um fornecedor não pode ser excluído se possuir histórico de movimentações, recebimentos ou ordens de compra (permitir inativação/soft-delete).
*   **Listagem §8.1:** Obrigatório suporte nativo no backend para `page`, `perPage` e busca por termo (`search` em Nome/Fantasia/CNPJ).
**Fora de Escopo:** Consultas automáticas de CNPJ na Receita Federal via integração externa nesta etapa.
**A Ponte de Contexto:** Nota para a IA: O frontend já possui a tela em `modules/purchasing/suppliers/` com um `ModalFormMultistep` funcional. O desafio principal é remover os dois storages locais (`varejo-purchasing-suppliers` e `varejo-inventory-suppliers`), criando o modelo Prisma `Supplier`, as rotas GET/POST/PUT/DELETE em `varejo-api` e conectando-os usando React Query no client `varejo-client.ts`.

---

## Spec 2: Motor de Movimentação (Ledger) e Posição de Estoque

**Objetivo Principal:** Implementar um Livro-Razão (Ledger) imutável que seja a única fonte de verdade para entradas, saídas e ajustes, abandonando o controle de estoque estático e manual.
**Atores:** Estoquista, Gerente de Loja.
**Caminho Feliz (Fluxo Principal):** O usuário acessa a tela de Movimentações e registra um "Ajuste de Saída" informando a variação (ex: Camiseta M Azul) e a justificativa (ex: avaria). O sistema grava a movimentação de forma imutável e atualiza instantaneamente o saldo disponível daquele SKU na visão de Posição de Estoque.
**Regras de Negócio e Validações:**
*   **Imutabilidade (Append-Only):** Movimentações de estoque não podem sofrer UPDATE ou DELETE no banco de dados. Qualquer correção exige um movimento compensatório (estorno).
*   **Saldo Derivado:** O campo de quantidade em estoque no Prisma (ex: `StockPosition`) deve ser atualizado exclusivamente através de um gatilho/serviço chamado durante a criação do movimento no Ledger.
*   **Listagem de Ledger:** A visualização do extrato deve ser server-side (§8.1) e filtrável por tipo (entrada, saída, ajuste).
**Fora de Escopo:** Cálculos pesados de Custo Médio Ponderado Histórico (CMP) com retroatividade complexa.
**A Ponte de Contexto:** Nota para a IA: Em `modules/inventory/stock-moves/`, existe o motor puramente mockado `recordStockMovement`. Sua tarefa é reescrever esse motor no NestJS (API). No frontend, a tabela `GradeMatrix` nos modos `readonly` (Posição) e `movementQty` (Lançamento) deve apontar seus submits para os novos endpoints da `varejo-api`.

---

## Spec 3: Ordens de Compra e Recebimento de Mercadorias

**Objetivo Principal:** Digitalizar o processo logístico do varejo: desde o pedido formal ao fornecedor até o recebimento cego na doca, integrando diretamente com o Ledger de Estoque.
**Atores:** Comprador, Estoquista (Conferente).
**Caminho Feliz (Fluxo Principal):** O comprador cria uma Ordem de Compra (OC) com grade de tamanhos, que fica com status `confirmed`. Quando o caminhão chega, o estoquista abre a tela de Recebimento, bipando ou lançando os itens sem ver o esperado (conferência cega). Ao finalizar e bater (ou aprovar divergência), o status da OC muda e os itens entram no estoque (Ledger).
**Regras de Negócio e Validações:**
*   **Transição de Status:** A OC deve respeitar as transições (Draft -> Sent -> Confirmed -> Partially Received -> Received).
*   **Recebimento Transacional:** O fechamento do recebimento deve ser uma transação única no banco de dados: atualiza status da OC, lança o recebimento e injeta as linhas no Ledger de Movimentação.
*   **Distribuição de Curva:** O backend deve estar preparado para processar payloads baseados em curva (pesos por tamanho) enviados pelo client.
**Fora de Escopo:** Importação e decodificação real de XML da SEFAZ para automatizar recebimento (mantenha a lógica do XML como está: mock).
**A Ponte de Contexto:** Nota para a IA: Utilize as estruturas já prontas em `modules/purchasing/purchase-orders` e `modules/purchasing/goods-receipts`. Substitua os simuladores complexos (`applyReceiptToPurchaseOrderInStorage`) pelos services transacionais equivalentes em NestJS. 

---

## Spec 4: Inventário Físico (Balanço de Loja)

**Objetivo Principal:** Gerenciar sessões formais de contagem física (Balanço), apurando a divergência entre o sistema e a prateleira de forma segura e auditável.
**Atores:** Estoquista, Gerente de Loja.
**Caminho Feliz (Fluxo Principal):** O gerente inicia um "Inventário". O sistema gera um *snapshot* de quantidades. O estoquista conta as prateleiras lançando os totais (Por Grade). O gerente revisa o relatório de divergência e "Aprova". O sistema dispara movimentos de ajuste automático no Ledger (Entrada/Saída de Balanço) para zerar as diferenças e encerra a sessão.
**Regras de Negócio e Validações:**
*   Sessões de inventário devem bloquear alterações concorrentes na grade afetada, ou ao menos gravar o *snapshot* base no momento da abertura.
*   Somente usuários com papel administrativo (Gerente) podem "Aprovar" o balanço se houver divergência.
*   O encerramento do balanço dispara os eventos na API de Movimentação com tipo `inventory_adjustment`.
**Fora de Escopo:** Leitura em lote/integração com aplicativo mobile de coletor de dados físico. A interface web é a única via.
**A Ponte de Contexto:** Nota para a IA: A tela de inventário (`modules/inventory/pages/stock-inventory-hub-page.tsx`) com suporte a bipagem via teclado já existe. O foco é transferir o controle de sessão (`varejo-physical-inventory`) para a API, implementando o endpoint de encerramento de balanço que injeta dados nas tabelas de movimentação criadas na Spec 2.
