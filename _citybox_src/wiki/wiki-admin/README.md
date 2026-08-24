# Wiki Admin — Citybox · Blueprint Completo

Wiki de documentação e **blueprint de desenvolvimento** do painel administrativo da **Citybox**. Documenta o MVP atual e propõe o design completo de cada funcionalidade — serve como fonte de verdade para construir o admin.

## Estrutura de grupos

| Grupo | Seções |
|---|---|
| **Introdução** | Visão Geral, Benchmark de Mercado, Mapa Mental, Arquitetura, Glossário |
| **Acesso, Perfis e Permissões** | Autenticação & Perfis, RBAC e Permissões, Suporte & Impersonation |
| **Visão Geral** | Dashboard |
| **Clientes** | Clientes, Detalhe do Cliente, Saúde & Churn, Onboarding & Jornada |
| **Lojas** | Lojas, Detalhe da Loja, Equipe da Loja, Monitoramento, Integrações |
| **Equipe Citybox** | Usuários Citybox |
| **Planos e Financeiro** | Planos SaaS, Financeiro, Faturamento & Cobrança |
| **Plataforma** | Configurações da Plataforma, Notificações & Comunicados, Relatórios & Exportações |
| **Compliance** | Auditoria |
| **Evolução** | Roadmap |
| **Aprovação** | Como Aprovar |

## Convenção de status nas seções

| Selo | Significado |
|---|---|
| ✅ Funcional | Implementado e integrado ao banco/API hoje |
| 🔴 Mock | UI existe, dados são hardcoded (sem API real) |
| 🔴 Quebrado | Rota 404 ou endpoint inexistente |
| 🔵 Proposta | Design-alvo — ainda não implementado |
| 🟣 Parcial | API existe mas resposta incompleta ou mapeamento com bug |

## Como abrir

Na raiz do monorepo (recomendado — todos os wikis com navegação cruzada):

```bash
pnpm run wiki
# → http://localhost:8787/wiki-admin/
```

Somente este wiki (links para outros wikis não funcionam):

```bash
npx serve wiki/wiki-admin/ -p 8787
```

## Identidade visual

| Wiki | Cor |
|---|---|
| LM Despachante | Azul |
| LM Concessionária | Verde |
| CRM | Índigo/Violeta |
| **Admin Citybox** | **Teal/Ciano** |

## Apps documentados

| App | Caminho | Porta | DNS prod |
|-----|---------|-------|----------|
| Admin Web | `apps/platform/admin` | 3108 | `admin.citybox.com` |
| Platform API | `apps/platform/api` | 3103 | `admin.citybox.com/api/` |

## Credenciais dev

Keycloak realm `citybox-dev` · client `citybox-admin`

Login: `admin@citybox.com` / `aplopes`
