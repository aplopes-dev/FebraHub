# Dados da empresa (Grupo) — guia de uso

Esta tela é o cadastro do **grupo** (holding / marca): identificação,
contato institucional e metadados.

**Onde fica:** menu **Ajustes → Dados da empresa** (`/settings/group`).

Não há abas. O botão **Salvar** grava o grupo e o logotipo.

---

## Identificação

| Campo | Para que serve |
|---|---|
| Nome do grupo | Razão social da holding ou nome interno. **Obrigatório.** |
| Nome fantasia / marca comercial | O que aparece no sistema e em relatórios. |
| CNPJ da holding | Opcional. **Não é usado em processo de documentação.** |
| Fuso horário padrão | Herdado por unidades que não sobrescreverem. |
| Logotipo | Imagem do grupo (JPG, PNG ou WebP, até 4 MB), à direita. |

## Contato institucional

E-mail geral, telefone principal e endereço administrativo/sede (diretoria).
Não confundir com endereço de estabelecimento da filial.

## Metadados (somente leitura)

Data de criação e quantidade de unidades vinculadas (link para
**Ajustes → Unidades e Filiais** / `/settings/units`).

---

## Salvando as alterações

O rodapé acompanha o que você está fazendo:

- **"Você tem alterações não salvas"** — há mudanças no cadastro ou no logo.
- **Descartar alterações** — volta como estava.
- **Salvar** — grava o grupo (`PUT /v1/groups/current`) e o logo se houver.
