# Auditoria e plano de testes — Compras e Estoque

Ambiente para execução manual: https://febracis-hom.aplopes.com

## Escopo da auditoria

Este documento confronta o levantamento da líder de Compras com a implementação encontrada no repositório em 18/08/2026. A análise foi estática, sobre API NestJS, schema/migrações Prisma, páginas React e SQL de estoque. Não foram executados testes automatizados, build, lint, rotinas demoradas, consultas no banco de homologação nem alterações de código ou banco.

Legenda: ✅ implementado e pronto para teste; ⚠️ implementado parcialmente; ❌ não implementado; 🔄 depende de outro módulo ou integração futura.

## A. Matriz de aderência

| Necessidade | Existe? | Completo/parcial | Onde está | Gap | Prioridade |
|---|---|---|---|---|---|
| Criar solicitação por usuário comum | ✅ | Completo no fluxo básico | `NovaSolicitacao`, `POST /compras` | Validar em homologação permissões e dados reais | P0 |
| Unidade conforme usuário logado | ✅ | Parcial | `contextoFormulario`, `usuario_unidades` | Usuário com mais de uma unidade pode selecionar; regra de negócio precisa ser confirmada | P0 |
| Setor conforme usuário logado | ✅ | Parcial | `setorPrincipalId`, `setorId` | O cadastro de setores é amplo e o setor pode ser alterado quando há mais de um autorizado | P0 |
| Centro de custo, data, prioridade e justificativa | ✅ | Parcial | `CompraSolicitacao`, formulário | Centro de custo é texto opcional; não há validação cadastral | P0 |
| Múltiplos itens, quantidade, unidade e especificação | ✅ | Completo | `CompraItem`, formulário | Para serviço a unidade é forçada para `serviço` | P0 |
| Anexos da solicitação/item | ⚠️ | Parcial | Campos JSON `anexos` no schema | Não há upload, armazenamento, download ou validação de anexo | P1 |
| Produto cadastrado | ✅ | Completo para consulta | `fato_loja_estoque`, `GET /compras/produtos/estoque` | Cadastro é origem externa/estoque, não cadastro de Compras | P0 |
| Item não cadastrado | ✅ | Parcial | Opção “descrever novo item” | Não existe fila para associar a produto ou cadastrar item depois | P0 |
| Serviço | ✅ | Parcial | `tipo = servico`, formulário | Entra no mesmo workflow, sem fluxo ou campos próprios de contratação | P0 |
| Protocolo único SC-AAAA-NNNNN | ✅ | Completo no código | Transação com lock e `protocolo @unique` | Deve ser conferido com registros existentes | P0 |
| Histórico completo da solicitação | ⚠️ | Parcial | `CompraHistorico`, `hist()` | Registra ações principais; não captura todo campo alterado e UI não mostra nome do autor | P0 |
| Tipos material/produto | ⚠️ | Parcial | `tipo` aceita `item`/`servico`; schema tem default `material` | “Produto”, “material” e compra direta/indireta/estratégica não são categorias estruturadas | P1 |
| Compra direta, indireta e estratégica | ❌ | Não implementado | Nenhum campo/enum/rota | Criar classificação operacional | P1 |
| Frete como tipo de compra | ❌ | Não implementado | Apenas campo de frete na cotação | Não há processo próprio | P1 |
| Passagem aérea | ❌ | Não implementado | Nenhum módulo/tabela/tela | Criar fluxo próprio, sem estoque | P1 |
| Fila, assumir e análise inicial | ✅ | Completo no básico | `Todas`, ações `assumir`/`analisar` | Não há SLA ou cronômetro operacional | P0 |
| Análise de prazo, prioridade e comentários | ⚠️ | Parcial | Campos e comentário de ação | Não há checklist nem tempo por etapa | P1 |
| Estoque real, saldo, reservado e disponível | ✅ | Parcial | `HubEstoque`, `FatoLojaEstoque` | É uma posição importada; unidade, custo e histórico de movimentação não são operacionais completos | P0 |
| Valor unitário/total do estoque | ⚠️ | Parcial | `custoMedio`/views SQL | Não aparece no fluxo de verificação nem há cálculo de perdas | P1 |
| Reserva limitada ao saldo e solicitado | ⚠️ | Parcial | `ComprasService.estoque` | Salvar novamente incrementa reserva sem desfazer a anterior; atendimento integral não confere todos os itens | P0 |
| Atendimento integral pelo estoque | ⚠️ | Parcial | Ação `atender_estoque` | Apenas altera situação; não gera saída nem baixa | P0 |
| Atendimento parcial e saldo para compra | ✅ | Parcial | Item fica `comprar`, ação inicia cotação | Não há cálculo/visualização explícita “solicitado/estoque/disponível/reservar/comprar” | P0 |
| Cadastro de produtos | 🔄 | Depende da origem de estoque | `fato_loja_estoque`/Omie | Não há CRUD local de produto | P1 |
| Movimentações, inventário, perdas, ajustes | ❌ | Não implementado | Só tabela de movimentos com tipos previstos | API grava apenas `reserva`; não há telas/rotas de inventário, perda ou ajuste | P1 |
| Entrada após recebimento | ❌ | Não implementado | `CompraMovimentoEstoque` prevê `entrada` | Receber altera Compras, não o estoque | P0 |
| Baixa após entrega | ❌ | Não implementado | `CompraMovimentoEstoque` prevê `saida` | Entregar/encerrar não baixa estoque nem libera reserva | P0 |
| Devolução e troca | ❌ | Não implementado | Nenhuma ação/tabela específica | Criar processo de divergência/devolução/troca | P1 |
| Três cotações | ⚠️ | Parcial | `CompraCotacao`, modal e comparativo | Não existe regra mínima de 3; a API permite enviar com zero ou uma | P0 |
| Valor, frete, prazo, condição, total e observações | ✅ | Parcial | `CompraCotacao` | Condição é texto; não há valores por item nem parcelas/vencimentos | P0/P1 |
| Anexos de propostas | ⚠️ | Parcial | Campo `documento` como texto/URL | Não há upload/arquivo persistido | P1 |
| Comparar além do menor preço | ⚠️ | Parcial | Critério e justificativa livres; UI mostra total/frete/prazo/pagamento | Não calcula histórico, economia, ranking nem critério objetivo | P1 |
| Proposta não mais barata exige justificativa | ✅ | Completo | `escolherCotacao` | Validar também fluxo de erro na tela | P0 |
| Cadastro estruturado de fornecedores | ❌ | Não implementado | Tela `/compras/fornecedores` é placeholder | Sem CNPJ/CPF, contatos, produtos, histórico ou avaliações | P1 |
| Aprovar/reprovar/solicitar ajuste | ✅ | Completo no básico | Fila `/aprovacoes`, ações e comentários obrigatórios | Não há alçada por valor/centro de custo | P0/P1 |
| Pedido PC-AAAA-NNNNN | ✅ | Parcial | `CompraPedido`, emissão | Pedido não persiste itens, unidade, centro de custo, solicitante ou aprovador como snapshot | P0 |
| Registrar envio e acompanhar status | ⚠️ | Parcial | Ação `enviar_pedido` | Muda situação, mas não preenche `enviadoEm` | P0 |
| Recebimento parcial/total e pendências | ⚠️ | Parcial | `recebimentos`, `quantidadeRecebida` | Fila mostra apenas `aguardando_entrega`, ocultando parcialmente recebidos | P0 |
| NF, data, responsável e observações | ⚠️ | Parcial | `CompraRecebimento` | Responsável/data ficam em IDs/timestamps, sem nome na UI; não há anexo funcional | P0/P1 |
| Divergência de recebimento | ⚠️ | Parcial | Campo `divergencia` e observações | Não há tipos, tratamento, aprovação ou histórico estruturado do fornecedor | P1 |
| Separação, entrega e confirmação | ✅ | Parcial | Ações `preparar_entrega`, `entregar`, `confirmar_recebimento` | Não registra separador/entregador/recebedor e quantidades em entidade própria | P0 |
| Planejada x urgente e meta de 40% | ⚠️ | Parcial | `prioridade`, `dataNecessaria`, histórico | Não há flag de planejada, antecedência, motivo estruturado nem indicador por setor | P1 |
| Economia e meta de 15% | ❌ | Não implementado | Há valores em cotação/pedido | Não há preço histórico/referência/negociado/comprado nem economia em R$/% | P1 |
| Prazo médio de pagamento | ⚠️ | Parcial | `condicaoPagamento` textual | Não há parcelas, vencimentos, dias negociados ou cálculo médio | P1 |
| Parcerias e permutas | ❌ | Não implementado | Nenhuma entidade, rota ou tela | Criar processo próprio | P1 |
| Previsibilidade de apostilas | 🔄 | Depende de Pedagógico/Agenda | Eventos/cursos aparecem só como contexto | Não há alunos, presença, taxa, estoque de segurança ou sugestão | P2 |
| Automação/auxílio de cotações | ❌ | Não implementado | Nenhuma integração | Arquitetura atual permite futura camada de sugestão, mas não há adaptador/serviço | P2 |
| Dashboard de Compras | ❌ | Não implementado | `GET /compras/indicadores` só conta situações | Não há valores, prazos, setores, fornecedores, perdas, metas ou parcerias | P1/P2 |
| Rastreabilidade com usuário, data, ação e status | ⚠️ | Parcial | `CompraHistorico` | Data/ação/status/comentário existem; nome do usuário e alterações de campos não aparecem | P0 |
| Permissões por perfil | ✅ | Parcial | `compras.ver`, `solicitar`, `operar`, `aprovar` | Testar IDOR e ações por tela; aprovação não tem alçada configurável | P0 |

### Simplificação recomendada para tipos

O modelo atual mistura `tipo` com conceitos diferentes: a API aceita apenas `item` e `servico`, enquanto o schema usa default `material`; “produto” é uma referência opcional ao estoque. A simplificação recomendada é separar:

- `natureza`: `produto`, `item_nao_cadastrado`, `servico`, `passagem_aerea`, `parceria`;
- `classificacao_compra`: `direta`, `indireta`, `estrategica`, `frete`;
- `produtoId`: opcional e usado somente quando a natureza for produto ou quando Compras fizer a associação posterior.

Não implementar essa simplificação nesta etapa. Ela é backlog P1 e deve preservar os protocolos e registros existentes.

## B. Fluxo operacional real

### Fluxo principal

`Solicitante cria` → `aguardando análise` → `Compras assume` → `analisa prazo/prioridade` → `verifica estoque quando for produto` → `atende pelo estoque ou encaminha saldo para cotação` → `registra propostas` → `recomenda` → `aprovação` → `emite PC` → `registra envio` → `recebimento` → `separação` → `entrega` → `confirmação do solicitante` → `encerrada`.

### Caminhos alternativos existentes ou parcialmente existentes

- **Estoque integral:** produto cadastrado, reserva até a quantidade solicitada, ação `Atender pelo estoque`, preparar entrega, entregar e confirmar. Hoje não há baixa física automática.
- **Estoque parcial:** reserva o disponível, item fica com saldo `comprar`, encaminha saldo para cotação. A regra de quantidade precisa ser conferida porque a emissão/recebimento considera a quantidade não reservada.
- **Compra integral:** produto não localizado ou reserva zero, cotação do total, aprovação, pedido e recebimento.
- **Item novo:** solicitante descreve o item sem produtoId. Compras consegue cotar, mas não consegue associar depois a produto nem cadastrá-lo nesta implementação.
- **Serviço:** o tipo pula a verificação de estoque e vai para cotação. Não há contrato, medição, aceite de serviço ou centro de custo estruturado.
- **Urgência:** prioridade `urgente` pode ser escolhida. Não há motivo de urgência, flag planejada nem medição de antecedência.
- **Reprovação:** aprovador reprova com justificativa e a solicitação fica `reprovada`; não há retorno operacional posterior descrito.
- **Ajuste:** aprovador solicita ajuste com comentário; solicitante reenvia. Validar o que pode ser alterado, pois não existe trilha de campos alterados.
- **Recebimento parcial:** pode registrar mais de um recebimento e quantidade pendente. A fila de recebimentos precisa ser conferida, pois filtra somente `aguardando_entrega`.
- **Divergência:** há campos livres para produto errado, quantidade, avaria ou atraso, mas não há classificação, resolução ou atualização estruturada do fornecedor.
- **Entrega:** existem três ações, mas não há registro próprio de quem separou/entregou/recebeu nem movimentação automática de estoque.

## C. Novo manual de teste manual

### Preparação

Use registros identificados por `[TESTE JABSON]`. Separe três sessões:

- **Solicitante:** usuário com `compras.solicitar`, sem `compras.operar`/`compras.aprovar`.
- **Compras:** usuário com `compras.operar`.
- **Aprovador:** usuário com `compras.aprovar`.

Anote protocolo, usuários, datas, mensagens, screenshots e o resultado de cada caso. Não use dados reais de fornecedor ou nota fiscal; identifique tudo como teste.

### C1. Criar solicitação de produto

| Ação | Dados de teste | Resultado esperado | Conferir | Erro/gap |
|---|---|---|---|---|
| Entrar como solicitante e abrir Compras → Nova Solicitação | Usuário de equipe | Tela abre | Solicitante é o usuário logado | Se acessar ações administrativas, GAP de permissão |
| Conferir unidade e setor | Não altere inicialmente | Unidade/setor principal carregados | Unidade e setor correspondem ao perfil; opções respeitam autorização | Campo vazio ou opção indevida: GAP de contexto |
| Preencher solicitação | `[TESTE JABSON] Materiais para treinamento`, centro `CC-TESTE`, data futura, prioridade Normal, justificativa única | Formulário aceita dados | Não há redundância entre justificativa e finalidade; hoje a tela usa justificativa e especificação | Se exigir finalidade separada, registrar GAP de modelagem |
| Adicionar dois itens | Produto cadastrado, 10 un.; segundo item cadastrado, 2 un.; especificações distintas | Dois itens persistem | Produto, quantidade, unidade e especificação | Item desaparecer após atualizar: GAP P0 |
| Enviar | Dados completos | Protocolo `SC-AAAA-NNNNN`, `Aguardando análise` | Minhas Solicitações e detalhe mostram os dois itens | Protocolo repetido ou histórico ausente: GAP P0 |
| Atualizar a página | F5 | Dados permanecem | Histórico contém criação/envio, data, ação e usuário identificável | Histórico sem autor: GAP conhecido |

### C2. Unidade, setor e acesso indevido

| Ação | Dados de teste | Resultado esperado | Conferir | Erro/gap |
|---|---|---|---|---|
| Abrir nova solicitação com usuário de uma unidade | Usuário com uma unidade | Unidade não pode ser trocada | Valor coincide com vínculo | Poder escolher outra unidade: GAP P0 |
| Repetir com admin/múltiplas unidades | Admin com SSA/REC | Pode escolher apenas unidades vinculadas | Nenhuma unidade inativa aparece | Unidade sem vínculo aceita: GAP de autorização |
| Tentar abrir Todas, Aprovações, Estoque e ações por URL | Sessão de solicitante | Acesso é negado ou dados ficam restritos | Não vê solicitações de terceiros, cotação, pedido, recebimento ou aprovação | Qualquer acesso indevido: GAP P0 |

### C3. Análise e estoque

| Ação | Dados de teste | Resultado esperado | Conferir | Erro/gap |
|---|---|---|---|---|
| Entrar como Compras e abrir Todas as Solicitações | Protocolo C1 | Solicitação aparece na fila | Filtro e busca funcionam | Não aparecer: GAP P0 |
| Assumir e analisar | Comentário opcional para ação normal | Responsável e situação mudam | Histórico contém responsável/ação/data | Nome do responsável não visível: GAP de rastreabilidade |
| Abrir Verificar estoque real | Produto cadastrado | Cada item mostra produto e disponível | Conferir `saldo - reservado` com Estoque → Visão Geral | Saldo divergente: GAP P0 |
| Testar reserva inválida | Reservar acima do disponível e acima do solicitado | Sistema rejeita | Mensagem explica limite | Aceitar valor: GAP P0 |
| Testar reserva integral | Ex.: solicitado 10, disponível >= 10, reservar 10 | Item reservado e possível atender pelo estoque | Reserva aparece no estoque | Apenas status muda sem reserva: GAP |
| Testar reserva parcial | Ex.: solicitado 10, disponível 6, reservar 6 | Item fica com 4 a comprar | Valores solicitado/estoque/disponível/reservar/comprar ficam claros | Exigir cálculo manual ou reservar mais que saldo: GAP conhecido |
| Atualizar e salvar novamente | Mesmos valores | Reserva não duplica | Saldo reservado permanece correto | Incremento duplicado: defeito conhecido P0 |

### C4. Cotações e recomendação

| Ação | Dados de teste | Resultado esperado | Conferir | Erro/gap |
|---|---|---|---|---|
| Encaminhar saldo | Cenário parcial ou compra integral | Situação `Em cotação` | Itens e saldo para compra | Sistema permitir cotar sem saldo de compra: regra a confirmar |
| Adicionar três propostas | Alfa R$ 1.000 + frete 0, 7 dias, 28 dias; Beta R$ 950 + frete 100, 5 dias, à vista; Gama R$ 980 + frete 10, 3 dias, 21 dias | Três propostas persistem | Valor total, frete, prazo, pagamento, contato e observações | Não há mínimo de 3; registrar GAP P0 |
| Atualizar a página | F5 | As três continuam | Comparativo lado a lado | Proposta sumir: GAP P0 |
| Escolher a mais barata | Beta, critério “menor custo total” | Uma fica recomendada | Somente uma escolhida e justificativa/critério persistem | Mais de uma escolhida: GAP |
| Escolher a mais cara sem justificativa | Gama ou Alfa | API/tela rejeita | Mensagem exige justificativa | Aceitar sem justificativa: GAP P0 |
| Escolher a mais cara com justificativa | “Prazo e condição atendem evento crítico” | Escolha aceita | Critério e justificativa no histórico | Comparativo não calcula histórico/economia: GAP P1 |

### C5. Aprovação e pedido

| Ação | Dados de teste | Resultado esperado | Conferir | Erro/gap |
|---|---|---|---|---|
| Encaminhar para aprovação | Proposta escolhida | Situação `Aguardando aprovação` | Aparece em Aprovações | Encaminhar sem recomendação: GAP P0 |
| Testar ajuste | Aprovador, comentário “corrigir condição” | Situação `Ajustes solicitados` | Comentário, autor e data persistem | Ajuste sem justificativa aceito: GAP |
| Reenviar | Solicitante corrige e reenvia | Volta para aprovação | Histórico mostra ciclo anterior e novo | Campos alterados não rastreados: GAP |
| Aprovar | Aprovador autorizado | Situação `Aprovada` | Nome, data/hora e decisão | Usuário não autorizado aprova: GAP P0 |
| Reprovar em cenário separado | Comentário obrigatório | Situação `Reprovada` | Justificativa e histórico persistem | Reprovação sem motivo: GAP P0 |
| Emitir pedido | Previsão futura | Número `PC-AAAA-NNNNN` | Fornecedor, total, frete, pagamento, prazo, previsão e protocolo | Pedido não guarda itens/unidade/CC/solicitante/aprovador como snapshot: GAP P0/P1 |
| Registrar envio | Ação na tela | Situação `Aguardando entrega` | Status e histórico persistem | `enviadoEm` vazio: GAP conhecido |

### C6. Recebimento, divergência e entrega

| Ação | Dados de teste | Resultado esperado | Conferir | Erro/gap |
|---|---|---|---|---|
| Registrar recebimento parcial | NF `NF-TESTE-001`, metade dos itens, observação | `Recebida parcialmente` e pendências | Quantidades e recebimento persistem após F5 | Fila não listar parcial: GAP conhecido |
| Registrar divergência | Produto errado, quantidade menor, avaria e atraso em testes separados | Divergência fica registrada | Texto aparece no detalhe/histórico | Sem tipo, tratativa ou fornecedor afetado: GAP P1 |
| Registrar saldo restante | NF `NF-TESTE-002` | `Recebida` | Dois recebimentos no histórico e pendente zero | Receber acima do saldo: API deve rejeitar |
| Preparar e registrar entrega | Como Compras | `Pronta entrega` → `Entregue` | Ações e datas no histórico | Não há separador/entregador/quantidades próprias: GAP |
| Confirmar como solicitante | Usuário original | `Encerrada` | Solicitante consegue confirmar; outro usuário não | Saída de estoque automática é ❌ não implementada |

### C7. Conferências transversais

Após cada etapa, atualizar a página e conferir protocolo, situação, itens, cotação, pedido, recebimentos e histórico. Repetir em janela estreita/celular. Comparar o nome exibido do usuário com o usuário da sessão; atualmente o histórico persiste `usuarioId`, mas a tela exibe somente ação e data.

## D. Testes por cenário

| Cenário | Execução | Status atual | O que falta |
|---|---|---|---|
| 1. Compra normal de produto | C1 → C3 com reserva zero → C4 → C6 | ✅ Testável | Validar persistência e permissões |
| 2. Produto parcialmente disponível | C3 reservar disponível e cotar restante | ⚠️ Testável com GAP | Exibir cálculo completo e corrigir reserva repetida |
| 3. Produto 100% disponível | C3 reservar total → atender estoque → entregar | ⚠️ Testável com GAP | Baixa de saída e consistência de reserva |
| 4. Item novo/não cadastrado | Na nova solicitação escolher “Não encontrei” | ⚠️ Testável com GAP | Associação posterior ou cadastro pelo Compras |
| 5. Contratação de serviço | Tipo Serviço, descrição, cotação e aprovação | ⚠️ Testável com GAP | Campos/aceite/medição/contrato próprios |
| 6. Compra urgente | Prioridade Urgente e data próxima | ⚠️ Testável com GAP | Motivo, antecedência, indicador e SLA |
| 7. Menor preço não vence | Três propostas e justificativa | ✅ Testável | Comparar critérios objetivos e economia |
| 8. Reprovação | Aprovação → Reprovar com justificativa | ✅ Testável | Fluxo pós-reprovação/ressubmissão |
| 9. Solicitação de ajuste | Aprovação → Ajustar → Reenviar | ✅ Testável | Rastrear campos modificados |
| 10. Recebimento parcial | Dois recebimentos com NF distintas | ⚠️ Testável com GAP | Fila e entrada automática |
| 11. Mercadoria divergente | Preencher divergência por produto errado, quantidade, avaria e atraso | ⚠️ Testável com GAP | Tratamento estruturado e histórico do fornecedor |
| 12. Parceria/permuta | Não executar no módulo atual | ❌ FUNCIONALIDADE AINDA NÃO IMPLEMENTADA | Módulo com parceiro, benefício, contrapartida, valor, economia, vigência, documentos, responsável e status |
| 13. Passagem aérea | Não executar como produto/serviço | ❌ FUNCIONALIDADE AINDA NÃO IMPLEMENTADA | Fluxo próprio com passageiro, origem/destino, datas/horários, companhia, bagagem, motivo, evento, CC, opções, aprovação, escolha e localizador |

## E. Backlog dos gaps

### P0 — fluxo básico e controle

- Corrigir reserva idempotente: editar uma verificação deve reverter a reserva anterior antes de aplicar a nova.
- Validar atendimento integral e parcial por item, com cálculo explícito de solicitado, saldo, disponível, reservado e comprar.
- Implementar entrada de estoque no recebimento e saída/liberação de reserva na entrega, com transação e histórico.
- Corrigir `enviadoEm` ao registrar envio do pedido.
- Fazer a fila de recebimentos incluir `recebida_parcialmente`.
- Persistir/exibir autor, separador, entregador, recebedor, datas e quantidades de cada etapa.
- Garantir que aprovação, operação e leitura de solicitações de terceiros respeitem permissões e vínculo.
- Exigir três cotações, ou registrar formalmente exceção aprovada com justificativa.
- Permitir anexos reais na solicitação, proposta, nota fiscal e divergência.
- Definir snapshot do pedido com itens, unidade, centro de custo, solicitante e aprovador.

### P1 — operação completa de Compras e Estoque

- Criar cadastro mestre de fornecedores com CNPJ/CPF, contatos, itens/serviços, compras, preços, prazo médio, pagamento, qualidade, ocorrências, avaliações, cotações, vencimentos e economia.
- Modelar tipos sem redundância: natureza e classificação da compra.
- Criar fluxo de associação/cadastro de item novo.
- Criar movimentações operacionais de entrada, saída, devolução, troca, ajuste, inventário e perdas, incluindo valor unitário e total da perda.
- Estruturar condição de pagamento: à vista, parcelas, vencimentos, dias negociados e cálculo do prazo médio.
- Registrar divergência com tipo, responsável, tratativa, resolução e impacto no fornecedor.
- Implementar economia com preço histórico, referência, primeira cotação, negociado, comprado e fórmulas em R$/%.
- Criar alçadas configuráveis por valor, centro de custo, unidade e perfil.
- Criar cadastro/processo de parcerias e permutas, com meta mensal de 1–2 parceiros.
- Criar relatórios de fornecedores, compras e divergências.

### P2 — previsibilidade, automação e indicadores

- Integrar Pedagógico/Agenda para estimar apostilas usando turmas, alunos vendidos/confirmados, presença, taxa média, estoque de segurança e sugestão.
- Criar assistente de cotações que identifica produto, consulta fontes/fornecedores, sugere preços e aguarda validação humana.
- Criar dashboard com total comprado, economia, metas, planejadas/urgentes, tempos de ciclo, setor, unidade, comprador, fornecedores, pagamento, atrasos, divergências, perdas, estoque crítico e parcerias.
- Criar fluxo próprio de passagens aéreas, integrado a aprovação e armazenamento de comprovante/localizador.
- Medir percentual planejado, antecedência e setores que solicitam em cima da hora.

## Resultado executivo

Hoje é possível testar manualmente o workflow administrativo de solicitação, análise, consulta/reserva de estoque, cotação, recomendação, aprovação, pedido, recebimento, entrega e confirmação. Ele não deve ser considerado operação completa de Compras e Almoxarifado: entradas/saídas físicas, fornecedores, indicadores, economia, pagamentos estruturados, parcerias, passagens, perdas/inventário e previsibilidade de apostilas ainda não estão implementados ou dependem de integração.

Registro do teste:

- Protocolo:
- Cenário:
- Solicitante:
- Compras:
- Aprovador:
- Resultado:
- Etapa com problema:
- Mensagem exibida:
- Evidência:
