# Dados da unidade — guia de uso

Cadastro da **unidade**: identificação, contato, endereço e logotipo.

**Onde fica:** menu **Ajustes → Dados da unidade** (`/settings/group`).

O FebraHub atende **uma unidade** (Febracis Salvador) — não é multiempresa.
Por isso não há grupo, holding, matriz nem filial nesta tela: o que se cadastra
aqui é a própria unidade.

Não há abas. O botão **Salvar** grava o cadastro e o logotipo.

---

## Identificação

| Campo | Para que serve |
|---|---|
| Razão social | Como consta no CNPJ. **Obrigatório.** |
| Nome fantasia | O nome usado no dia a dia, em telas e relatórios. |
| CNPJ | Identificação fiscal da unidade. |
| Fuso horário | Fuso usado nas datas e horários do sistema. |
| Logotipo | Imagem da unidade (JPG, PNG ou WebP, até 4 MB), à direita. |

## Contato

E-mail e telefone gerais da unidade.

## Endereço

Onde a unidade funciona.

## Registro (somente leitura)

Data em que o cadastro foi criado.

---

## Salvando as alterações

O rodapé acompanha o que você está fazendo:

- **"Você tem alterações não salvas"** — há mudanças no cadastro ou no logo.
- **Descartar alterações** — volta como estava.
- **Salvar** — grava o cadastro (`PUT /v1/groups/current`) e o logo se houver.

---

## Nota para quem mexe no código

Os nomes internos ainda falam a língua do ERP de origem, que era multiempresa:
`GroupSettingsValues`, `holdingDocument`, `groups/current`. Eles seguem assim de
propósito — a renomeação acompanha a troca da API mock pela API do FebraHub, não
antes: renomear contra um contrato que vai sair só cria ruído.
