# Data Model — DANFSe conforme a NT 008/2026

Não há entidade nova nem tabela: o DANFSe é derivado **integralmente do XML autorizado**
(spec 004 R7). O "modelo" desta feature é o **objeto de leitura** que o reader produz e o
renderer consome — hoje `NfseDocumentData` — que será **estendido** para carregar todos os
campos exigidos pela NT 008/2026.

## `NfseDocumentData` (estendido)

Campos **novos** marcados com ➕. Opcionais (`?`) são omitidos no documento quando ausentes
no XML (R3 — sem zeros/linhas falsas).

```
NfseDocumentData
├─ accessKey: string
├─ nfseNumber: string
├─ issuedAt: string
├─ cityName: string
├─ verificationCode?: string                 ➕ código de verificação (quando na NT)
├─ provider:
│   ├─ cnpj: string
│   ├─ legalName: string
│   ├─ municipalRegistration?: string
│   └─ address?: Address                      ➕ endereço do prestador
├─ customer:
│   ├─ document: string
│   ├─ name: string
│   └─ address?: Address                      ➕ endereço do tomador
├─ intermediary?:                             ➕ bloco inteiro, só quando presente
│   ├─ document: string
│   └─ name: string
├─ service:
│   ├─ description: string
│   ├─ nationalCode: string
│   ├─ municipalCode?: string                 ➕ item/código do serviço (LC 116)
│   ├─ provisionCity?: string                 ➕ local da prestação
│   ├─ quantity?: number                      ➕
│   ├─ unitValue?: number                     ➕
│   ├─ totalValue: number
│   ├─ issRate?: number
│   ├─ issValue: number
│   └─ issWithheld: boolean
├─ amounts:                                   ➕ bloco de valores/base
│   ├─ calculationBase?: number               ➕ base de cálculo do ISS
│   ├─ deductions?: number                    ➕ deduções
│   ├─ discounts?: number                     ➕ descontos
│   └─ netValue: number                       ➕ valor líquido (considera retenções)
├─ federalTaxes?:                             ➕ retenções federais (cada uma opcional)
│   ├─ irrf?: number
│   ├─ pis?: number
│   ├─ cofins?: number
│   ├─ csll?: number
│   └─ inss?: number                          (INSS/CP conforme XSD)
└─ totals?:                                   ➕ totalizadores/transparência
    ├─ totalTaxes?: number                    ➕ vTotTrib (quando informado)
    └─ approxTaxPercent?: number              ➕ pTotTrib (quando informado)

Address (novo tipo)
├─ street: string
├─ number?: string
├─ district?: string
├─ cityName?: string
├─ uf?: string
└─ zipCode?: string
```

## Regras de validação/derivação

- **Fonte única**: todos os campos vêm do XML autorizado (nunca de banco/cadastro).
- **Omissão (R3)**: campo/grupo ausente no XML → **não** aparece no documento; nada de `0,00`
  falso. Blocos `intermediary`, `federalTaxes`, `totals` e `address` são `undefined` quando
  ausentes, e o renderer pula a seção correspondente.
- **Valor líquido**: quando houver retenções federais/ISS retido, o `netValue` reflete o
  líquido; sem retenções, iguala o valor do serviço (comportamento atual preservado).
- **Chave de acesso**: continua extraída do `Id` do `infNFSe` (remoção do prefixo "NFS"),
  como hoje.

## Fonte dos nomes de elemento (T002 — confirmado no XSD 1.01)

Estrutura de dois níveis: `NFSe > infNFSe` (calculado pelo Sefin) **contém** `DPS > infDPS`
(transmitida pelo contribuinte). Mapa dos nomes de elemento (`tiposComplexos_v1.01.xsd`):

| Campo do documento | Caminho lógico | Elemento(s) |
|---|---|---|
| Nº / chave / data / município | `infNFSe` | `nNFSe`, `@Id`, `dhProc`, `xLocEmi`/`xLocPrestacao` |
| Prestador (nome/CNPJ/IM) | `infNFSe > emit` (`TCEmitente`) | `CNPJ`/`CPF`, `xNome`, `IM` |
| **Endereço do prestador** | `infNFSe > emit > enderNac` (`TCEnderecoEmitente`) | `xLgr`, `nro`, `xCpl`, `xBairro`, `cMun`, `UF`, `CEP` |
| Tomador (nome/doc) | `DPS > infDPS > toma` (`TCInfoPessoa`) | `CNPJ`/`CPF`/`NIF`, `xNome`, `IM` |
| **Endereço do tomador** | `toma > end` (`TCEndereco`) → `endNac`/`endExt` | `xLgr`, `nro`, `xCpl`, `xBairro`; `endNac`: `cMun`, `CEP` |
| **Intermediário** | `DPS > infDPS > interm` (`TCInfoPessoa`, `minOccurs=0`) | `CNPJ`/`CPF`, `xNome` + `end` |
| Serviço | `infDPS > serv` | `locPrest`(`cLocPrestacao`), `cServ`(`cTribNac`, `cTribMun`, `xDescServ`), `cLocIncid`/`xLocIncid` |
| Valores do serviço | `infDPS > valores > vServPrest` | `vServ`, `vReceb` |
| Descontos | `valores > vDescCondIncond` | `vDescIncond`, `vDescCond` |
| Dedução/redução | `valores > vDedRed` | `pDR`/`vDR`/`documentos` |
| ISS (alíquota/retenção) | `valores > trib > tribMun` (`TCTribMunicipal`) | `tribISSQN`, `tpRetISSQN`, `pAliq` |
| **Retenções federais** | `trib > tribFed` (`TCTribFederal`, `minOccurs=0`) | `piscofins`(`vPis`,`vCofins`,`tpRetPisCofins`,`CST`), `vRetCP`(INSS/CP), `vRetIRRF`, `vRetCSLL` |
| **Transparência tributária** | `trib > totTrib` (`TCTribTotal`) | `vTotTrib`, `pTotTrib`, `indTotTrib` |
| **Valores calculados (Sefin)** | `infNFSe > valores` (`TCValoresNFSe`) | `vBC`, `vISSQN`, `vTotalRet`, `vLiq`, `vCalcDR` |

Notas relevantes para a leitura:
- **`vBC`/`vISSQN`/`vLiq`/`vTotalRet` são calculados pelo Sefin** e vivem em `infNFSe > valores`,
  não na DPS. O reader os lê desse nível (fonte de verdade do que foi autorizado).
- Não há `xMun` textual no endereço — só `cMun` (código IBGE). O nome do município do documento
  vem de `xLocEmi`/`xLocPrestacao` do `infNFSe` (já lido hoje).
- PIS/COFINS ficam no subgrupo `piscofins`; IRRF/CSLL/CP(INSS) são filhos diretos de `tribFed`.

A fixture de teste (`tests/fixtures/authorized-nfse-xml.ts`) ganha uma variante "cheia" com
endereço, intermediário, retenções e totais para exercitar presença; mantém a "mínima" para
exercitar omissão.
