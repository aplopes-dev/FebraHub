# Contract: Terminal Settings (read-only modules)

Configurações do terminal (FR-010–012) — distintas do painel debug de módulos (Fase 0).

## Route

`GET` UI `/settings` — três entradas (Home `Ç`, Balcão, Pagamento) → mesma tela.

## Sections

### 1. Preferências locais (editáveis em fixture)

| Campo | Persistência | Hardware |
|---|---|---|
| Identificação do terminal | `pdv.terminal_settings.v1` | não |
| Impressora (nome) | idem | não aciona driver |
| Gaveta habilitada | bool | não |
| Balança habilitada | bool | não |

### 2. Módulos (somente leitura)

Fonte: `ModuleSetSnapshot` / catálogo Fase 0 (mesma origem injetável).

Para cada entrada relevante (telas + opcionalmente behaviors):

| Coluna | Conteúdo |
|---|---|
| Nome | label do módulo |
| Estado | disponível / desligado / bloqueado (e “não contratado” se a fixture distinguir via disabled) |
| Escopo | indicação textual: “Configurado no ERP” — **sem** toggle |

**Proibido**: qualquer controle que chame `ModuleConfigSource` de escrita / altere snapshot de produto.

Painel `ModulesPanel` (escrita) continua **ausente** em release.

## Acceptance link

SC-006: perfil Loja → Comandas aparece como desligado/não disponível na lista read-only, explicando ausência na Home.
