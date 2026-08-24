# Emissão fiscal Citybox — demonstração

**Data da verificação:** 7 de agosto de 2026
**Ambiente:** homologação oficial (SEFAZ-BA e Sefin Nacional)
**Emitente:** RR EMPREENDIMENTOS E COMERCIO VAREJISTA DE MATERIAIS DE CONSTRUCAO LTDA — CNPJ 50.031.609/0001-04

---

## O que está funcionando

A plataforma emite os **dois documentos fiscais** que o comércio de Ilhéus precisa, contra os
órgãos oficiais, com certificado digital ICP-Brasil real.

| Documento | Órgão | Situação |
| --- | --- | --- |
| **NF-e** (mercadoria) | SEFAZ-BA | ✅ Autorizada |
| **NFS-e** (serviço) | Sefin Nacional | ✅ Autorizada |

Não é simulação nem mock: as notas foram transmitidas por TLS mútuo, assinadas com o certificado
A1 da empresa, e **autorizadas pelos órgãos**, que devolveram protocolo e chave de acesso.

---

## Provas

### NF-e autorizada

| | |
| --- | --- |
| Protocolo de autorização | `129261000154478` |
| Chave de acesso | 44 dígitos, gerada e validada pela SEFAZ |
| Órgão | SEFAZ-BA, ambiente de homologação |

### NFS-e autorizada

| | |
| --- | --- |
| Protocolo de autorização | `29136062250031609000104000000000001126088729771266` |
| Padrão | Nacional (Ilhéus aderiu pelo Decreto Municipal nº 220/2026) |
| Órgão | Sefin Nacional |

O XML autorizado de ambas fica armazenado e pode ser recuperado a qualquer momento pela API.

---

## Ciclo completo verificado

Não é só emitir. O teste automatizado percorre **14 verificações** em sequência e todas passam:

| # | Etapa | Resultado |
| --- | --- | --- |
| 1 | Cadastrar empresa emitente | ✅ |
| 2 | Enviar certificado digital A1 | ✅ válido até 06/04/2027 |
| 3 | **Emitir NF-e** | ✅ autorizada |
| 4 | **Emitir NFS-e** | ✅ autorizada |
| 5 | Proteção contra emissão duplicada | ✅ |
| 6 | Consultar as notas | ✅ |
| 7 | Baixar o XML autorizado | ✅ |
| 8 | Histórico de eventos da nota | ✅ |
| 9 | **Substituir NFS-e** | ✅ original cancelada, nova autorizada |
| 10 | **Cancelar NF-e** | ✅ cancelamento autorizado |
| 11 | Bloqueio de emissão em produção | ✅ recusado |

Reproduzível a qualquer momento seguindo
[`roteiro-teste-swagger.md`](./roteiro-teste-swagger.md), que traz os payloads do fluxo
completo — cadastro, certificado, emissão das duas notas, cancelamento, substituição e o
documento auxiliar.

---

## Três garantias que valem destacar

### 1. Produção é bloqueada por construção

Enquanto a empresa não decidir formalmente ativar produção, **é impossível emitir nota com valor
legal por acidente**. Não é um aviso na tela nem uma convenção de equipe: o endereço do ambiente de
produção não tem valor padrão no sistema, e sem ele a API **recusa a requisição** em vez de
transmitir.

Existe teste automatizado que quebra se alguém tentar adicionar esse valor padrão.

### 2. Emissão duplicada é impossível

Se o ERP reenviar o mesmo pedido — por falha de rede, clique duplo, reprocessamento — a plataforma
devolve a nota que já existe **sem transmitir de novo**. O cliente não recebe duas notas pela mesma
venda, e a empresa não gera obrigação tributária em duplicidade.

A proteção é isolada por empresa: duas empresas usando a mesma referência de pedido não interferem
uma na outra.

### 3. Trilha de auditoria completa

Para cada nota fica guardado **o que foi enviado e o que o órgão respondeu**, em XML bruto. Numa
fiscalização, é possível reconstruir exatamente a conversa com o fisco — não só o resultado final.

---

## Limitações conhecidas

Declaradas por transparência. Nenhuma impede a operação em homologação.

### Cálculo de tributos ainda não é feito

As notas saem com os campos de tributo **zerados**:

- Para **Simples Nacional** isso está correto — os tributos são recolhidos no DAS, e a nota apenas
  declara o enquadramento.
- Para **Lucro Presumido ou Real** seria necessário calcular ICMS, PIS e COFINS de verdade, o que
  exige tabela de tributação por produto. Ainda não implementado.

Como o piloto é Simples Nacional, isso não bloqueia o uso atual.

### Cada empresa precisa de credenciamento próprio

A NF-e só é autorizada para empresas **credenciadas na SEFAZ-BA**. Testamos com duas:

| Empresa | Ramo | NF-e |
| --- | --- | --- |
| RR Empreendimentos | Comércio varejista | ✅ autoriza |
| Aplopes Tecnologia | Software | ❌ não credenciada |

O contraste confirma que se trata de credenciamento do contribuinte, não de limitação da
plataforma. É um passo administrativo, feito uma vez por empresa.

---

## Da homologação para produção

O que muda é **configuração e cadastro**, não desenvolvimento:

1. Credenciar cada empresa emitente na SEFAZ-BA
2. Definir a Inscrição Municipal das empresas registradas no cadastro de Ilhéus
3. Ativar deliberadamente o ambiente de produção (decisão de negócio, com trilha)
4. Substituir o escritório de contabilidade de teste pelo real

O código que emite é o mesmo. Homologação existe exatamente para provar isso antes de gerar
documento com valor legal.
