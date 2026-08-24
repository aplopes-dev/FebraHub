# Material oficial — Sistema Nacional da NFS-e

## Nesta pasta

| Arquivo | Conteúdo | Origem |
| --- | --- | --- |
| `ANEXO_I-SEFIN_ADN-DPS_NFSe-SNNFSe-v1.01-20260209.xlsx` | Leiaute completo da DPS e da NFS-e + regras de negócio de validação | [gov.br/nfse — documentação atual](https://www.gov.br/nfse/pt-br/biblioteca/documentacao-tecnica/documentacao-atual) |

## Esquemas XSD — já versionados, não duplicar

Os esquemas oficiais **já estão no repositório** em
[`specs/002-fiscal-api/contracts/NFSe/`](../../002-fiscal-api/contracts/NFSe/), versões `1.00` e
`1.01`, trazidos durante a entrega anterior.

Conferido em 2026-08-05: os arquivos do repositório são **byte-idênticos** aos publicados na versão
oficial vigente (`NFSe-ESQUEMAS_XSD-v1.01-20260209`). Não há necessidade de rebaixar nem
re-baixar — reutilizar os que já existem.

Arquivos relevantes em `1.01/`:

- `DPS_v1.01.xsd` — declaração de prestação de serviços (o que o contribuinte emite)
- `NFSe_v1.01.xsd` — nota fiscal gerada pelo ambiente nacional
- `pedRegEvento_v1.01.xsd` / `evento_v1.01.xsd` / `tiposEventos_v1.01.xsd` — pedidos e registros de evento
- `tiposComplexos_v1.01.xsd`, `tiposSimples_v1.01.xsd` — tipos compartilhados
- `xmldsig-core-schema.xsd` — assinatura digital

## Referências externas

- [Manual de Contribuintes — API do Sistema Nacional NFS-e (Emissor Público) v1.2](https://www.gov.br/nfse/pt-br/biblioteca/documentacao-tecnica/documentacao-atual/manual-contribuintes-emissor-publico-api-sistema-nacional-nfs-e-v1-2-out2025.pdf)
- [Manual de Contribuintes — APIs do ADN](https://www.gov.br/nfse/pt-br/biblioteca/documentacao-tecnica/documentacao-atual/manual-contribuintes-apis-adn-sistema-nacional-nfse.pdf)
- [APIs — Produção Restrita e Produção](https://www.gov.br/nfse/pt-br/biblioteca/documentacao-tecnica/apis-prod-restrita-e-producao)

## Fatos apurados na documentação oficial (para a fase de plano)

Levantados em 2026-08-05 a partir dos manuais e dos XSD acima. Não são decisões de projeto —
são o que a documentação diz.

- **Fluxo**: o contribuinte transmite uma **DPS** assinada; a Sefin Nacional valida as regras de
  negócio e **gera a NFS-e**, devolvendo a chave de acesso. O contribuinte não emite a NFS-e.
- **Identificador da DPS**: código IBGE do município emissor (7) + tipo de inscrição (1) +
  inscrição federal (14, CPF completado com zeros à esquerda) + série (5) + número (15).
- **Autenticação**: certificado digital na conexão. A API de distribuição valida o **CNPJ raiz** do
  certificado contra o CNPJ consultado.
- **Consulta**: `GET /dps/{id}` e `HEAD /dps/{id}` recuperam a chave de acesso da NFS-e a partir do
  identificador da DPS — só se o certificado da conexão corresponder a um dos atores da nota
  (prestador, tomador ou intermediário). É o caminho para resolver transmissão sem resposta
  conclusiva sem arriscar emissão duplicada.
- **Distribuição/eventos**: `GET /DFe/{NSU}` e `GET /NFSe/{ChaveAcesso}/Eventos`.
- **Ambiente**: `tpAmb` 1 = Produção, 2 = Homologação. ADN em produção restrita:
  `adn.producaorestrita.nfse.gov.br/contribuintes`.
- **Ambiente gerador do evento**: 1 = sistema próprio do município, 2 = Sefin Nacional, 3 = ADN.
- **Eventos definidos no esquema oficial** (`tiposEventos_v1.01.xsd`):

  | Código | Evento |
  | --- | --- |
  | `e101101` | Cancelamento |
  | `e105102` | Cancelamento por substituição |
  | `e101103` | Solicitação de análise fiscal para cancelamento |
  | `e105104` / `e105105` | Cancelamento deferido / indeferido por análise fiscal |
  | `e202201` / `e203202` / `e204203` | Confirmação do prestador / tomador / intermediário |
  | `e205204` | Confirmação tácita |
  | `e202205` / `e203206` / `e204207` | Rejeição do prestador / tomador / intermediário |
  | `e205208` | Anulação da rejeição |
  | `e305101` / `e305102` / `e305103` | Cancelamento / bloqueio / desbloqueio por ofício |

- **Ainda não apurado**: prazo de cancelamento direto e a lista completa de regras de negócio de
  validação da DPS — ambos vivem no Anexo I desta pasta, que precisa ser lido na fase de plano.
