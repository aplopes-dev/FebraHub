# Grupos de ISSQN

> **A lista de grupos mudou de lugar (spec erp/022).** Cadastrar e editar continuam aqui; a lista agora fica em **Configurações → Fiscal → Grupos fiscais**, aba ISSQN, junto com os outros impostos — veja o guia da tela unificada em `features/fiscal-groups/GUIA.md`. Links antigos (ex.: `/grupos-icms`) continuam funcionando e te levam pra lá.

## O que é

Um **Grupo de ISSQN** guarda, num só lugar, os dados fiscais de um tipo de
serviço que você presta com frequência. Em vez de digitar código, alíquota e
exigibilidade a cada nota, você cadastra uma vez e reaproveita na emissão da
NFS-e (nota fiscal de serviço).

## Onde fica

Configurações → **Fiscal** → aba **Padrões fiscais** → link **"Gerenciar grupos
de ISSQN →"**. A tela lista os grupos já cadastrados e tem o botão **Novo Grupo
do ISSQN**.

## Como cadastrar

1. Clique em **Novo Grupo do ISSQN**.
2. Preencha:
   - **Nome** — um apelido para reconhecer o grupo na lista (ex.: "Consultoria em TI").
   - **Código municipal do serviço** — no formato `NN.NN` (lista da LC 116, ex.: `17.02`).
   - **Código de tributação nacional (cTribNac)** — 6 dígitos (ex.: `170200`). É uma
     tabela nacional, diferente do código municipal; sem ele o órgão recusa a nota.
   - **Alíquota do ISS (%)** — a alíquota do serviço. ⚠️ **Ela só é enviada para a
     nota quando há retenção**. Sem retenção, quem define a alíquota é a prefeitura,
     e o valor aqui serve só para conferência.
   - **Exigibilidade do ISS** — a situação tributária do serviço:
     - **Exigível** (operação tributável) — o caso mais comum.
     - **Imunidade**.
     - **Não incidência**.
     - **Exportação de serviço** aparece **desabilitada** nesta versão (exige dados
       adicionais de exportação na nota).
3. Clique em **Salvar**.

Se você tentar sair com alterações não salvas, o sistema avisa.

## Editar

Clique na linha do grupo na lista para abrir a edição. Você pode alterar nome,
códigos, alíquota e exigibilidade.

## Para que serve

O grupo é usado na **emissão de NFS-e**: ao emitir uma nota de serviço, você
escolhe um Grupo de ISSQN e a tela já preenche o código municipal, o código
nacional, a alíquota e a exigibilidade — sem redigitar.
