# Research: NFS-e pelo Padrão Nacional (+ pendências de NF-e)

Decisões técnicas tomadas antes do desenho, com a fonte de cada uma. Material consultado em
2026-08-05: esquemas XSD oficiais `v1.01-20260209`, Anexo I (leiaute + 655 regras de negócio),
Manual de Contribuintes das APIs e Manual das APIs do ADN — ver
[contracts/README.md](./contracts/README.md).

Onde um fato veio de leitura do material oficial, está marcado **[oficial]**. Onde é decisão nossa,
**[decisão]**. Onde permanece em aberto, **[aberto]**.

---

## 1. O que o contribuinte emite

**Decisão**: modelar **DPS** e **NFS-e** como dois estágios do mesmo documento fiscal, não como duas
entidades persistidas separadamente.

**Fundamento** [oficial]: o leiaute mostra que a NFS-e gerada **encapsula** a DPS original — o
caminho `NFSe/infNFSe/DPS/` existe dentro do documento retornado. A DPS não é um documento paralelo:
é a declaração que vira nota. Persistir duas entidades duplicaria dados que o próprio ambiente
nacional mantém unidos.

**Consequência**: `FiscalDocument` continua sendo a entidade única. Os campos de identificação da
DPS (série e número sequencial por estabelecimento) usam as colunas `rpsSeries`/`rpsNumber`, que já
existem no schema e estavam sem uso — semanticamente é o mesmo papel (documento de origem que vira
nota). `series`/`number` passam a guardar a numeração da NFS-e devolvida.

**Alternativa descartada**: tabela `Dps` separada com relação 1-1 para `FiscalDocument`. Rejeitada
por criar uma junção obrigatória em toda leitura sem nenhum caso de uso que precise da DPS isolada.

---

## 2. Transporte: REST com mTLS, não SOAP

**Decisão**: criar `shared/infra/fiscal-http/` como espelho estrutural de `shared/infra/fiscal-soap/`,
reaproveitando o carregamento do bundle ICP-Brasil e o material de chave do certificado.

**Fundamento** [oficial]: as APIs do padrão nacional são REST com documentação Swagger
(`.../contribuintes/docs/index.html`), diferentemente dos webservices SOAP da SEFAZ. Endpoints
apurados: recepção de DPS, `GET /dps/{id}`, `HEAD /dps/{id}`, `GET /DFe/{NSU}`,
`GET /NFSe/{ChaveAcesso}/Eventos`.

**Fundamento** [oficial]: a autenticação é por certificado digital na conexão. A API de distribuição
valida o **CNPJ raiz** do certificado contra o CNPJ consultado — ou seja, mTLS com o A1 do prestador,
o mesmo modelo já implementado para a SEFAZ.

**Decisão**: usar `fetch`/`undici` nativo do Node 24 com `Agent` configurado (`cert`, `key`, `ca`),
sem adicionar dependência. O `soap` permanece exclusivo da NF-e.

---

## 3. Codificação da área de dados

**Decisão**: enviar o XML da DPS **compactado e codificado em base64**, não como XML cru no corpo.

**Fundamento** [oficial]: as regras de recepção (aba `RN_RECEPCAO_DPS` do Anexo I) rejeitam
explicitamente `E1225 — Falha na decodificação da base 64 da área de dados` e
`E1226 — Estrutura descompactada mal formada`. A existência dessas duas rejeições em sequência
prova o pipeline: base64 → descompactação → XML.

**Detalhamento** [oficial] — a aba `RN_RECEPCAO_DPS` completa define o pipeline de recepção:

| Etapa | Rejeição se falhar |
|---|---|
| Decodificação base64 da área de dados | `E1225` |
| Descompactação | `E1226` — estrutura descompactada mal formada |
| Sem prefixo de namespace na área descompactada | `E1228` |
| Codificação UTF-8 | `E1229` |
| Esquema XML do DF-e | `E1235` |

**Resolução (T001)** [oficial, 2026-08-06]: **GZip + base64, em campo JSON `dpsXmlGZipB64`.**

Com os certificados reais em mãos o OpenAPI do SEFIN Nacional tornou-se legível (ele exige
certificado de cliente — era esse o `403`/`496` anterior). Spec em
`https://sefin.producaorestrita.nfse.gov.br/SefinNacional/swagger/docs/v1`, schema
`NFSePostRequest`:

```json
{
  "description": "Estrutura para enviar o DPS para processamento síncrono",
  "required": ["dpsXmlGZipB64"],
  "properties": {
    "dpsXmlGZipB64": {
      "description": "DPS compactado no padrão gZip (base64Binary)",
      "type": "string"
    }
  }
}
```

Ou seja: não é XML no corpo nem multipart — é **JSON com um único campo**, contendo o XML da DPS
comprimido em GZip e codificado em base64. A suposição registrada antes (GZip, por convenção do
ecossistema) estava correta, mas agora é fato verificado.

**Endpoints reais do SEFIN Nacional** (mesma spec):

| Caminho | Uso |
|---|---|
| `POST /nfse` | emissão síncrona (recebe a DPS, devolve a NFS-e) |
| `GET /nfse/{chaveAcesso}` | consulta da nota |
| `GET /nfse/{chaveAcesso}/eventos` | linha do tempo de eventos |
| `GET /nfse/{chaveAcesso}/eventos/{tipoEvento}/{numSeqEvento}` | evento específico |
| `GET /dps/{id}` | chave de acesso a partir do identificador da DPS |
| `GET /DANFSe` | representação gráfica |
| `GET /ParametrosMunicipais` | parametrização do município |
| `POST /decisao-judicial/nfse` | emissão por decisão judicial (fora de escopo) |

**API de Parametrização** (`adn.producaorestrita.nfse.gov.br/parametrizacao`) — 9 endpoints, entre
eles `/{codigoMunicipio}/{codigoServico}/{competencia}/aliquota`, `/{codigoMunicipio}/convenio`,
`/{codigoMunicipio}/{competencia}/retencoes` e `/{codigoMunicipio}/{codigoServico}/{competencia}/regimes_especiais`.
É daqui que sai a decisão entre cancelamento direto e análise fiscal (§5).

**ADN Contribuintes** (`/contribuintes`): `GET /DFe/{NSU}` e `GET /NFSe/{ChaveAcesso}/Eventos`.

**Também confirmado** [oficial] — requisitos do certificado de transmissão, além da raiz ICP-Brasil
(`E1208`): X.509 versão 3, `BasicConstraints` não pode ser de AC, `KeyUsage` deve definir
autenticação, AC emissora cadastrada na RFB (`E1205`), LCR acessível e válida (`E1206`),
certificado não revogado (`E1207`), e extensão `OtherName` com OID **2.16.76.1.3.3** contendo
CNPJ ou CPF (`E1209`). Um A1 e-CNPJ ICP-Brasil legítimo atende todos.

---

## 4. Onde validar: local vs. ambiente nacional

**Decisão**: validar localmente **apenas** (a) o que o XSD cobre e (b) o que evita consumo indevido
de numeração. As 655 regras de negócio do Anexo I **não** são replicadas.

**Fundamento** [decisão]: replicar o validador do governo cria uma segunda fonte de verdade que
envelhece a cada nota técnica publicada, e divergência entre as duas produz o pior caso — recusar
localmente uma nota que o ambiente nacional aceitaria. O Anexo I traz códigos de erro estáveis
(`E0001`–`E1309`) justamente para o emissor reagir à rejeição.

**Consequência**: é preciso um **mapa de códigos de erro → mensagem acionável**, para o operador
saber o que fazer. Sem isso o operador recebe `E1313` e não sabe se corrige o cadastro, o pedido ou
liga para a prefeitura. Esse mapa é entregável desta fase, alimentado pelas colunas `CÓD. ERRO` e
`MSG. ERRO` do Anexo I.

**Exceção deliberada**: a assinatura da DPS é validada localmente contra o XSD antes de transmitir
(`E0714 — Arquivo enviado com erro na assinatura` é rejeição), pelo mesmo motivo que a NF-e já faz.

---

## 5. Parametrização municipal

**Decisão**: consultar e cachear a parametrização do município; **não hardcodar prazos**.

**Fundamento** [oficial]: várias regras do Anexo I condicionam o comportamento à parametrização do
município emissor — por exemplo, a substituição de NFS-e "fora do prazo permitido, conforme
parametrização do município emissor" e a exigência de identificação do tomador para substituir. O
Manual de Contribuintes descreve um serviço que devolve as parametrizações de um município
específico, e diz que é de posse delas que o emitente preenche a DPS.

**Consequência**: a decisão entre cancelamento direto e solicitação de análise fiscal (FR-012 do
spec) é derivada da parametrização, não de constante no código.

**[aberto]**: TTL do cache. Proposta: cachear por município com invalidação diária — parametrização
municipal muda por ato administrativo, não por minuto.

---

## 6. Versão de leiaute tem prazo

**Decisão**: tratar a versão do leiaute como material com validade, igual ao bundle de CA.

**Fundamento** [oficial]: `E1260 — O prazo de aceitação da versão do leiaute da NFS-e expirou` e
`E0001` equivalente para a DPS. Leiaute vencido derruba emissão em produção sem nenhuma mudança de
código nossa — exatamente o modo de falha que a cadeia ICP-Brasil já nos ensinou.

**Consequência**: registrar a versão adotada e sua vigência no `AGENTS.md`, e ter teste que falha
quando a versão declarada no código divergir da suportada pelos XSD versionados.

---

## 7. Destino do provider municipal

**Decisão**: **remover** `IlheusMetropolisNfseProvider` e seus erros, em vez de manter como fallback.

**Fundamento** [decisão]: o provider nunca transmitiu — é um stub que sempre lançou
`IlheusMetropolisNotImplementedError`, aguardando confirmação de protocolo que não virá, porque o
município saiu do sistema próprio. Manter código morto que nunca funcionou, sob a justificativa de
"outros municípios não aderentes", é especular sobre um cliente que não existe: o piloto é
single-city.

**Contra-argumento considerado**: se um município não aderente entrar no futuro, o padrão Strategy
(`FiscalProvider` + `FiscalProviderFactory`) já permite plugar um provider novo sem tocar no caso de
uso. A abstração fica; a implementação vazia sai.

---

## 8. Reaproveitamento do que já existe

**Decisão**: reaproveitar sem alteração — certificado (armazenamento cifrado, parse PKCS#12,
vigência), assinatura XMLDSig, validação XSD, numeração sequencial transacional, idempotência com
retomada, storage de XML e trilha de auditoria.

**Fundamento** [decisão]: toda essa infraestrutura foi construída e validada na entrega de NF-e, e o
padrão nacional usa os mesmos mecanismos (A1 ICP-Brasil, XMLDSig, XSD, mTLS). A única diferença
relevante é o perfil de algoritmo da assinatura — a NF-e exige o perfil legado SHA-1 imposto pelo
XSD da SEFAZ (`XmlSignatureAlgorithmProfile.NFE_SEFAZ`).

**Resolução (T002)** [oficial]: usar o perfil **`MODERN`** (SHA-256 / C14N exclusivo), já
implementado em `xml-signer.ts`.

Verificado por comparação direta dos dois esquemas: o `xmldsig-core-schema_v1.01.xsd` da SEFAZ
(`resources/xsd/nfe/`) tem **3** atributos `fixed=` — é o que força o perfil legado SHA-1 na NF-e.
O `xmldsig-core-schema.xsd` do padrão nacional
(`specs/002-fiscal-api/contracts/NFSe/1.01/`) tem **zero**. O padrão nacional não impõe algoritmo,
então não há razão para herdar o legado por inércia.

---

## 9. Eventos: modelo mais rico que o de NF-e

**Decisão**: tipificar os eventos conforme o esquema oficial, em vez de reusar o enum de NF-e.

**Fundamento** [oficial]: `tiposEventos_v1.01.xsd` define 16 eventos, agrupados em três famílias —
ciclo de cancelamento (`e101101`, `e105102`, `e101103`, `e105104`, `e105105`), manifestação das
partes (`e202201`–`e205208`: confirmações de prestador/tomador/intermediário, confirmação tácita,
rejeições e anulação de rejeição) e atos de ofício do município (`e305101`–`e305103`: cancelamento,
bloqueio e desbloqueio).

**Escopo desta fase** [decisão]: implementar apenas cancelamento, cancelamento por substituição e
solicitação de análise fiscal. Manifestação das partes pressupõe o papel de tomador/intermediário,
declarado fora de escopo no spec. Atos de ofício são gerados pelo município — precisamos **ler**
esses eventos na consulta (US4), nunca emiti-los.

---

## 10. Pendências de NF-e a fechar nesta entrega

Escopo adicional definido pelo usuário. São itens abertos da validação de 2026-08-05, não trabalho novo.

**10.1 — `ProviderRequest` descarta o payload de auditoria** [decisão: corrigir]
`PrismaProviderRequestRepository.save` não grava `requestPayload`/`responsePayload`: o caso de uso
monta o payload com status, protocolo e código de erro do órgão fiscal e o repositório o descarta.
É a mesma família do defeito de itens já corrigido (D2) e esvazia a trilha exigida por FR-011 da
[spec 002](../002-fiscal-api/spec.md). Correção idêntica em forma: incluir os campos no `create`.

**10.2 — Revisão `database-reviewer`** [decisão: executar]
Gate pendente (T095 da spec 002) sobre a mudança de persistência de itens. Some-se a ele a migration
desta feature — uma revisão cobre as duas.

**10.3 — Validação com A1 ICP-Brasil real** [aberto: depende de aquisição]
A emissão de NF-e hoje chega até a transmissão e para em `Cannot parse response`, porque o
certificado autoassinado completa o TLS mas é recusado no nível da aplicação. Não é defeito de
código — é pré-requisito de material. Vale para NF-e e NFS-e igualmente: a regra `E1208` do Anexo I
rejeita certificado cuja raiz não seja ICP-Brasil.

---

## Questões abertas consolidadas

| # | Questão | Impacto se errar | Como resolver |
|---|---|---|---|
| 1 | Algoritmo de compactação da área de dados (§3) | Rejeição em 100% dos envios | Swagger de produção restrita |
| 2 | Perfil de assinatura aceito (§8) | Rejeição por assinatura inválida (`E0714`) | Ler `xmldsig-core-schema.xsd` do pacote oficial |
| 3 | TTL do cache de parametrização municipal (§5) | Decisão errada entre cancelamento direto e análise fiscal | Proposta: invalidação diária |
| 4 | Certificado A1 ICP-Brasil real (§10.3) | Nenhuma emissão chega a ser autorizada | Aquisição — fora do controle técnico |

Nenhuma delas bloqueia o início da implementação: 1 e 2 são verificáveis na primeira tarefa de
integração, 3 tem default proposto, 4 já era conhecida e afeta apenas a etapa final de validação.
