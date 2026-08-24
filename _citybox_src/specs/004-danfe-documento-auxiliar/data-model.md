# Data Model — DANFE / DANFSE

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)

## Princípio que governa este modelo

> **Nada é persistido por esta feature.**

Não há migration, não há tabela nova, não há coluna nova. O documento auxiliar é uma
**projeção** do XML autorizado — que já está armazenado e é imutável — e vive apenas o
tempo da requisição.

Isso não é economia: é o que torna FR-008 estruturalmente verdadeiro. Se não existe cópia
persistida, não existe cópia para divergir da nota; e se o renderizador nunca lê
`companies`, uma mudança de cadastro **não tem por onde** vazar para uma reimpressão.

Consequência para a revisão: **o portão `database-reviewer` não se aplica** a esta
feature, porque nenhum schema Prisma é tocado.

---

## Entidades

### `AuxiliaryDocument` (valor, em memória)

Resultado da geração. Nunca serializado para banco.

| Campo | Tipo | Origem | Notas |
| --- | --- | --- | --- |
| `content` | `Buffer` | renderização | O PDF, já com marca d'água aplicada quando cabe |
| `mimeType` | `'application/pdf'` | constante | — |
| `fileName` | `string` | chave de acesso | `DANFE-{chave}.pdf` / `DANFSE-{chave}.pdf` |
| `origin` | `DocumentOrigin` | qual caminho produziu | **FR-002b** |
| `isFiscallyValid` | `boolean` | `environment === 'PRODUCTION'` | Dirige a estampagem (FR-005) |

### `DocumentOrigin` (união literal)

```ts
type DocumentOrigin = 'LOCAL' | 'OFFICIAL_API'
```

Existe por causa de FR-002b. Quando duas fontes podem produzir o documento da mesma nota
(FR-002a), uma diferença visual entre duas vias precisa ser explicável — sem registrar a
origem, viraria mistério em fiscalização. `OFFICIAL_API` só é alcançável na Fase 2.

### `FiscalDocument` (já existente — apenas leitura)

Nenhum campo novo. A feature lê:

| Campo | Para quê |
| --- | --- |
| `companyId` | **FR-007** — comparar com o emitente do solicitante |
| `documentType` | Escolher o renderizador (`NFE` / `NFSE`) |
| `status` | **FR-003** e **FR-006** — autorizada? cancelada? |
| `environment` | **FR-005** — decide a marca d'água |
| `accessKey` | Nome do arquivo e conferência |
| `xmlObjectKey` | **FR-001/FR-010** — localizar o XML autorizado |

---

## Portas (contratos internos)

### `AuxiliaryDocumentRenderer`

```ts
abstract class AuxiliaryDocumentRenderer {
  abstract render(input: RenderInput): Promise<Buffer>
}

type RenderInput = {
  authorizedXml: Buffer
  isCancelled: boolean       // FR-006
  substitutedBy?: string     // FR-006, NFS-e — chave da substituta
}
```

Recebe **XML**, não entidade. É o que impede o renderizador de alcançar o banco — a
garantia de FR-008 e FR-010 é de tipo, não de disciplina.

Duas implementações, escolhidas por `documentType`: `DanfeRenderer` (adapter sobre a
biblioteca — R2) e `DanfseRenderer` (própria — R3, Fase 2).

### `WatermarkStamper`

```ts
abstract class WatermarkStamper {
  abstract stamp(pdf: Buffer, text: string): Promise<Buffer>
}
```

`Buffer → Buffer`, deliberadamente ignorante de quem produziu o PDF. É o que permite
marcar também o documento vindo da API oficial (R4) — o caso que um marcador embutido no
renderizador deixaria escapar.

### `BrandStamper` (Fase 3)

```ts
abstract class BrandStamper {
  abstract stamp(pdf: Buffer): Promise<Buffer>
}
```

Terceiro estágio `Buffer → Buffer`, ao lado do `WatermarkStamper`. Separado dele **de
propósito**: os dois estampam o PDF pronto, mas respondem a perguntas diferentes — a marca
d'água diz *"este documento vale?"* e só existe em homologação; o crédito diz *"quem
gerou?"* e existe sempre. Fundi-los faria a marca Citybox desaparecer em produção,
justamente onde ela deve estar.

**Ordem**: crédito **antes** da marca d'água. Assim, em homologação, a marca diagonal passa
por cima do rodapé — o aviso de "sem valor fiscal" não pode ficar atrás de nada.

---

## Regras de decisão

### Quando o documento é entregue (FR-003)

| `status` | Resposta | Razão |
| --- | --- | --- |
| `AUTHORIZED` | ✅ documento | Caminho normal |
| `CORRECTION_LETTER_AUTHORIZED` | ✅ documento | A nota segue autorizada |
| `CANCEL_REQUESTED` | ✅ documento | Cancelamento ainda não confirmado — a nota vale |
| `CANCEL_AUTHORIZED` | ✅ **marcado como cancelado** | **FR-006** — histórico reconstituível |
| `CANCEL_REJECTED` | ✅ documento, **sem** marca de cancelamento | O órgão recusou o cancelamento — a nota segue autorizada e valendo |
| `DRAFT`, `VALIDATING`, `NUMBER_RESERVED`, `XML_GENERATED`, `SIGNED`, `SENT`, `PROCESSING` | ❌ 422 | Nunca foi autorizada |
| `REJECTED`, `DENIED`, `ERROR`, `INUTILIZED` | ❌ 422 | Não existe documento auxiliar |
| `SYNC_REQUIRED` | ❌ 422 | Situação junto ao órgão é desconhecida — entregar papel aqui seria pior que recusar |

A recusa informa **o estado atual**, não um erro genérico: sem isso o operador não sabe se
espera, consulta ou reemite.

### Marca d'água (FR-005)

Aplicada quando `environment === 'HOMOLOGATION'`, **independentemente da origem**.

Texto: `SEM VALOR FISCAL`. Diagonal, cobrindo a página, cinza de baixa opacidade —
diagonal porque não pode ser removida recortando o papel, baixa opacidade porque FR-005a
exige que os dados sigam legíveis em impressão monocromática ruim.

### Marca Citybox (FR-011 a FR-014)

Aplicada **sempre**, nos dois documentos, em qualquer ambiente.

| Onde | O quê |
| --- | --- |
| Rodapé, abaixo dos quadros regulados | Logo vetorial (`logotipo.svg`) + legenda |

⚠️ **Onde NÃO vai**: o quadro "IDENTIFICAÇÃO DO EMITENTE". Aquele espaço declara quem
emitiu a nota; a marca do sistema ali seria identificação incorreta do emitente num
documento apresentado em fiscalização. Ver [research.md § R10](./research.md).

### Isolamento por emitente (FR-007)

`document.companyId !== requestCompanyId` → **404**, não 403.

404 e não 403 de propósito: 403 confirmaria que a nota existe. Para documento fiscal de
outro contribuinte, a existência já é informação.

⚠️ **A verificação existe, mas não é forte.** `requestCompanyId` vem do header
`X-Company-Id`, que o chamador escolhe — o JWT não carrega claim de empresa. Comparar
os dois recusa engano, **não recusa ataque**. Ver [research.md § R7](./research.md) para
o que falta: vincular a empresa a uma claim autenticada.

---

## Erros

| Erro | HTTP | Quando |
| --- | --- | --- |
| `FiscalDocumentNotFoundError` | 404 | Id inexistente **ou** de outro emitente (FR-007) |
| `DocumentNotPrintableError` | 422 | Estado não autorizado (FR-003) — a mensagem nomeia o estado atual |
| `AuthorizedXmlUnavailableError` | 503 | `xmlObjectKey` nulo ou storage falhou (**FR-010**) |

`AuthorizedXmlUnavailableError` merece destaque: a alternativa tentadora seria montar o
PDF com os dados relacionais que temos em mãos. FR-010 proíbe — produziria um documento
que **diverge do que o fisco tem**, e ninguém perceberia. Falhar alto é o comportamento
correto.

---

## Transições de estado

Nenhuma. A feature é estritamente de leitura: não altera `FiscalDocument`, não emite
evento, não grava `FiscalEvent`.
