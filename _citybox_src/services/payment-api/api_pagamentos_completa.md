# API de Pagamentos Central — Documentação Técnica Completa

**Versão:** 1.0  
**Data:** 2026-06-11  
**Objetivo:** estruturar uma API de pagamentos independente, reutilizável por todos os sistemas consumidores da empresa, com suporte inicial a **Asaas** e **PagBank**, preparada para evolução futura com **InfinitePay** e **Stone**.

---

## 1. Visão geral

A API de Pagamentos Central será um serviço independente responsável por orquestrar todo o ciclo de vida de pagamentos, cobranças, recebimentos, estornos, conciliação, webhooks e repasses.

Ela não deve pertencer a um sistema específico. Todos os sistemas consumidores deverão se comunicar com ela por uma interface única e padronizada.

```text
Sistemas consumidores
        ↓
API de Pagamentos Central
        ↓
Providers de pagamento
├── Asaas
├── PagBank
├── InfinitePay, futuro
└── Stone, futuro
```

A API deve esconder a complexidade de cada gateway/adquirente. O sistema consumidor não deve saber detalhes de endpoints, payloads, nomenclaturas e status de cada fornecedor. Ele deve enviar uma solicitação padronizada e receber respostas padronizadas.

---

## 2. Objetivos da API

A API deve permitir:

1. Criar cobranças.
2. Gerar links de pagamento.
3. Gerar Pix dinâmico.
4. Gerar boleto.
5. Receber cartão de crédito.
6. Receber cartão de débito, quando suportado pelo provider.
7. Criar cobranças com forma de pagamento indefinida, quando o provider permitir.
8. Criar cobranças parceladas.
9. Criar cobranças recorrentes e assinaturas.
10. Consultar status de cobranças e pagamentos.
11. Cancelar cobranças.
12. Estornar pagamentos total ou parcialmente.
13. Registrar webhooks dos providers.
14. Normalizar eventos dos providers.
15. Disparar webhooks internos para os sistemas consumidores.
16. Controlar conciliação financeira.
17. Controlar repasses, splits e subcontas, quando aplicável.
18. Registrar taxas, tarifas e valores líquidos.
19. Registrar antecipações, quando aplicável.
20. Manter auditoria completa de todas as operações.

---

## 3. Providers previstos

### 3.1 Providers iniciais

| Provider | Uso inicial |
|---|---|
| Asaas | Cobranças por Pix, boleto, cartão, links, recorrência, estorno, webhooks |
| PagBank | Pedidos, checkout/link de pagamento, Pix, boleto, cartão, webhooks, split, cancelamento/estorno |

### 3.2 Providers futuros

| Provider | Uso futuro |
|---|---|
| InfinitePay | Checkout integrado, links de pagamento, InfiniteTap/pagamento presencial, conciliação |
| Stone | Pagamentos online, cobranças, autorização, captura, cancelamento, consulta, Pix/Open Banking, Stone Connect/TEF/POS conforme necessidade |

---

## 4. Fontes oficiais de documentação

### Asaas

- Documentação principal da API: https://docs.asaas.com/
- Criar nova cobrança: https://docs.asaas.com/reference/criar-nova-cobranca
- Pix no Asaas: https://docs.asaas.com/docs/pix
- Webhook para cobranças: https://docs.asaas.com/docs/webhook-para-cobrancas
- Estornar cobrança: https://docs.asaas.com/reference/estornar-cobranca
- Sandbox: https://docs.asaas.com/docs/sandbox

### PagBank

- Portal de desenvolvedores: https://developer.pagbank.com.br/
- Pedidos e pagamentos — Order: https://developer.pagbank.com.br/docs/pedidos-e-pagamentos-order
- Checkout e Link de Pagamento: https://developer.pagbank.com.br/docs/checkout
- Webhooks: https://developer.pagbank.com.br/reference/webhooks
- Webhooks Checkout: https://developer.pagbank.com.br/reference/webhooks-checkout
- Recorrência: https://developer.pagbank.com.br/reference/webhooks-assinaturas
- SmartPOS / PlugPag / TEF: https://developer.pagbank.com.br/docs/pedidos-e-pagamentos-order

### InfinitePay

- Desenvolvedores InfinitePay: https://www.infinitepay.io/desenvolvedores
- Integração Checkout: https://www.infinitepay.io/desenvolvedores
- InfiniteTap: https://www.infinitepay.io/desenvolvedores

### Stone

- Dev Center Stone: https://www.stone.com.br/devcenter/
- Stone Online API: https://online.stone.com.br/reference/overview-da-api
- Webhooks Stone Banking/BaaS: https://apidocs.baas.stone.com.br/docs/returns-webhooks
- Open Banking Stone Pix: https://docs.openbank.stone.com.br/

### Referências regulatórias úteis

- Banco Central do Brasil — Pix: https://www.bcb.gov.br/estabilidadefinanceira/pix
- Manual de Segurança do Pix: https://www.bcb.gov.br/estabilidadefinanceira/pix
- LGPD — Lei Geral de Proteção de Dados: https://www.gov.br/esporte/pt-br/acesso-a-informacao/lgpd
- PCI Security Standards Council: https://www.pcisecuritystandards.org/

---

## 5. Princípio arquitetural

A API deve ser construída como uma **plataforma de pagamentos multi-provider**.

O sistema consumidor envia uma solicitação simples:

```text
Criar cobrança
Cliente
Valor
Descrição
Métodos de pagamento aceitos
Vencimento
Referência externa
```

A API decide:

```text
Qual provider usar
Como montar o payload do provider
Como criar a cobrança
Como armazenar os dados
Como receber webhooks
Como normalizar status
Como avisar o sistema consumidor
Como conciliar o pagamento
```

---

## 6. Arquitetura geral

```text
┌─────────────────────────────┐
│ Sistemas consumidores        │
│ Apps, ERPs, portais, SaaS    │
└──────────────┬──────────────┘
               │ REST / Webhook / SDK interno
               ↓
┌─────────────────────────────┐
│ API Gateway / Auth           │
│ API Key, JWT, Rate Limit     │
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│ Payments Core                │
│ Cobranças, pagamentos,       │
│ clientes, status, eventos    │
└───────┬───────────────┬─────┘
        │               │
        │               ↓
        │   ┌─────────────────────────┐
        │   │ Workers / Filas          │
        │   │ criação, consulta,       │
        │   │ webhook, estorno, retry  │
        │   └───────────┬─────────────┘
        │               ↓
        │   ┌─────────────────────────┐
        │   │ Provider Factory         │
        │   ├─────────────────────────┤
        │   │ Asaas Provider           │
        │   │ PagBank Provider         │
        │   │ InfinitePay Provider     │
        │   │ Stone Provider           │
        │   └───────────┬─────────────┘
        │               ↓
        │   ┌─────────────────────────┐
        │   │ Gateways / Adquirentes   │
        │   │ Asaas, PagBank, etc.     │
        │   └─────────────────────────┘
        │
        ↓
┌─────────────────────────────┐
│ Banco + Storage              │
│ PostgreSQL + MinIO/S3        │
│ logs, comprovantes, payloads │
└─────────────────────────────┘
```

---

## 7. Integração com sistemas consumidores

Nenhum sistema consumidor deve se integrar diretamente com Asaas, PagBank, InfinitePay ou Stone.

Todos devem chamar apenas a API de Pagamentos Central.

```text
Sistema consumidor
↓
POST /charges
↓
API de Pagamentos
↓
Provider selecionado
↓
Gateway de pagamento
↓
Webhook do gateway
↓
API de Pagamentos
↓
Webhook interno para o sistema consumidor
```

---

## 8. Domínios principais

A API terá os seguintes domínios:

```text
payments-api/
├── auth
├── tenants
├── merchants
├── provider-accounts
├── customers
├── payment-methods
├── charges
├── payments
├── refunds
├── subscriptions
├── payment-links
├── pix
├── boleto
├── cards
├── splits
├── transfers
├── settlements
├── reconciliation
├── provider-webhooks
├── internal-webhooks
├── audit-logs
├── provider-requests
└── reports
```

---

## 9. Stack recomendada

```text
Backend: NestJS
Banco: PostgreSQL
ORM: Prisma
Cache/Fila: Redis + BullMQ ou RabbitMQ
Storage: MinIO/S3
Auth: API Key + JWT entre sistemas
Webhooks: HMAC SHA-256
Observabilidade: Prometheus + Grafana + logs estruturados
Deploy: Docker + Nginx + HTTPS
```

---

## 10. Estrutura de pastas NestJS

```text
src/
├── main.ts
├── app.module.ts
├── common/
│   ├── guards/
│   ├── decorators/
│   ├── interceptors/
│   ├── filters/
│   ├── utils/
│   └── errors/
├── modules/
│   ├── auth/
│   ├── tenants/
│   ├── merchants/
│   ├── provider-accounts/
│   ├── customers/
│   ├── payment-methods/
│   ├── charges/
│   ├── payments/
│   ├── refunds/
│   ├── subscriptions/
│   ├── payment-links/
│   ├── pix/
│   ├── boleto/
│   ├── cards/
│   ├── splits/
│   ├── transfers/
│   ├── settlements/
│   ├── reconciliation/
│   ├── webhooks/
│   ├── provider-events/
│   ├── provider-requests/
│   ├── audit-logs/
│   └── providers/
│       ├── asaas/
│       ├── pagbank/
│       ├── infinitepay/
│       └── stone/
└── prisma/
```

---

## 11. Provider Pattern

A API deve usar padrão de provider/adaptador.

```ts
export interface PaymentProvider {
  createCustomer(input: CreateProviderCustomerInput): Promise<ProviderCustomerResult>;
  createCharge(input: CreateProviderChargeInput): Promise<ProviderChargeResult>;
  getCharge(input: GetProviderChargeInput): Promise<ProviderChargeResult>;
  cancelCharge(input: CancelProviderChargeInput): Promise<ProviderCancelResult>;
  refundPayment(input: RefundProviderPaymentInput): Promise<ProviderRefundResult>;
  createPaymentLink?(input: CreateProviderPaymentLinkInput): Promise<ProviderPaymentLinkResult>;
  createSubscription?(input: CreateProviderSubscriptionInput): Promise<ProviderSubscriptionResult>;
  parseWebhook(input: ProviderWebhookInput): Promise<NormalizedProviderEvent>;
}
```

Providers:

```text
AsaasPaymentProvider
PagBankPaymentProvider
InfinitePayPaymentProvider
StonePaymentProvider
```

---

## 12. Provider Factory

```ts
@Injectable()
export class PaymentProviderFactory {
  getProvider(provider: PaymentProviderCode): PaymentProvider {
    if (provider === 'ASAAS') return this.asaasProvider;
    if (provider === 'PAGBANK') return this.pagbankProvider;
    if (provider === 'INFINITEPAY') return this.infinitePayProvider;
    if (provider === 'STONE') return this.stoneProvider;

    throw new Error('Provider não suportado');
  }
}
```

---

## 13. Estratégia de escolha automática do provider

A API deve permitir:

```text
provider: AUTO
```

Quando `provider = AUTO`, a API decide com base em:

1. Configuração da empresa recebedora.
2. Método de pagamento solicitado.
3. Menor custo/taxa.
4. Disponibilidade do provider.
5. Suporte a split.
6. Suporte a recorrência.
7. Suporte a cartão presencial.
8. Regra comercial do tenant.
9. Fallback configurado.

Exemplo:

```json
{
  "provider": "AUTO",
  "paymentMethods": ["PIX", "BOLETO", "CREDIT_CARD"],
  "routingStrategy": "DEFAULT"
}
```

---

## 14. Conceitos fundamentais

### 14.1 Merchant

Representa a empresa ou unidade recebedora.

```text
merchant
- empresa que receberá o pagamento
- credenciais de provider
- conta bancária
- regras de split
- regras de taxas
```

### 14.2 Provider Account

Representa uma conta configurada em um provider.

```text
provider_account
- merchant_id
- provider: ASAAS | PAGBANK | INFINITEPAY | STONE
- ambiente: sandbox | production
- credenciais criptografadas
- status
```

### 14.3 Charge

Representa a cobrança criada pela API.

```text
charge
- intenção de cobrança
- pode gerar Pix, boleto, cartão ou link
- pode estar pendente, paga, vencida, cancelada
```

### 14.4 Payment

Representa o pagamento efetivamente realizado.

```text
payment
- confirmação financeira de uma charge
- pode ter valor bruto, taxas, valor líquido
- pode ter data de pagamento e liquidação
```

### 14.5 Settlement

Representa liquidação/repasse.

```text
settlement
- quando o valor fica disponível ou é repassado
- pode ser diferente da data de pagamento
```

### 14.6 Reconciliation

Representa conciliação.

```text
reconciliation
- cruza cobrança, pagamento, webhook, extrato e sistema consumidor
```

---

## 15. Status internos padronizados

A API deve possuir status próprios, independentes dos providers.

### 15.1 Status da cobrança

```text
DRAFT
CREATED
PENDING
WAITING_PAYMENT
AUTHORIZED
PAID
CONFIRMED
RECEIVED
OVERDUE
CANCELLED
EXPIRED
REFUNDED
PARTIALLY_REFUNDED
CHARGEBACK
DISPUTED
FAILED
ERROR
```

### 15.2 Status do pagamento

```text
PENDING
PROCESSING
AUTHORIZED
CAPTURED
PAID
CONFIRMED
AVAILABLE
SETTLED
FAILED
CANCELLED
REFUNDED
PARTIALLY_REFUNDED
CHARGEBACK
```

### 15.3 Status do webhook

```text
RECEIVED
VALIDATED
IGNORED_DUPLICATE
PROCESSED
FAILED
RETRYING
DEAD_LETTER
```

---

## 16. Mapeamento de status por provider

Cada provider terá status próprios. A API deve converter tudo para status internos.

### Exemplo de normalização

```text
Asaas PAYMENT_CREATED        → CREATED
Asaas PAYMENT_CONFIRMED      → CONFIRMED
Asaas PAYMENT_RECEIVED       → RECEIVED
Asaas PAYMENT_OVERDUE        → OVERDUE

PagBank PAID                 → PAID
PagBank AUTHORIZED           → AUTHORIZED
PagBank CANCELED             → CANCELLED
PagBank DECLINED             → FAILED

Stone authorized             → AUTHORIZED
Stone captured               → CAPTURED
Stone canceled               → CANCELLED

InfinitePay paid             → PAID
InfinitePay refunded         → REFUNDED
```

A tabela exata deve ser ajustada com base nos payloads oficiais e testada em sandbox/homologação.

---

## 17. Fluxo completo de criação de cobrança

```text
Sistema consumidor
↓
POST /charges
↓
API valida autenticação
↓
API valida merchant
↓
API valida cliente
↓
API cria ou reaproveita cliente no provider
↓
API escolhe provider
↓
API cria cobrança no provider
↓
API salva charge interna
↓
API salva provider_reference
↓
API retorna link, QR Code Pix, boleto ou dados de pagamento
↓
Cliente paga
↓
Provider envia webhook
↓
API recebe webhook
↓
API normaliza evento
↓
API atualiza charge/payment
↓
API dispara webhook interno
↓
Sistema consumidor atualiza sua entidade original
```

---

## 18. Fluxo Pix

```text
Sistema consumidor solicita cobrança Pix
↓
API cria charge PIX
↓
Provider retorna QR Code / copia e cola / payload
↓
API retorna dados ao sistema consumidor
↓
Cliente paga
↓
Provider envia webhook
↓
API confirma pagamento
↓
API atualiza status
↓
API notifica sistema consumidor
```

Dados retornados:

```json
{
  "chargeId": "uuid",
  "status": "WAITING_PAYMENT",
  "paymentMethod": "PIX",
  "pix": {
    "qrCode": "base64-ou-url",
    "copyPaste": "000201...",
    "expiresAt": "2026-06-12T23:59:59-03:00"
  }
}
```

---

## 19. Fluxo boleto

```text
Sistema consumidor solicita boleto
↓
API cria charge BOLETO
↓
Provider retorna linha digitável, código de barras e PDF/link
↓
API salva dados
↓
Cliente paga
↓
Provider compensa pagamento
↓
Webhook informa confirmação/recebimento
↓
API atualiza status
↓
API notifica sistema consumidor
```

Dados retornados:

```json
{
  "chargeId": "uuid",
  "status": "WAITING_PAYMENT",
  "paymentMethod": "BOLETO",
  "boleto": {
    "bankSlipUrl": "https://...",
    "digitableLine": "...",
    "barcode": "...",
    "dueDate": "2026-06-20"
  }
}
```

---

## 20. Fluxo cartão de crédito

```text
Sistema consumidor solicita cartão
↓
API cria cobrança
↓
Cenário 1: checkout/link hospedado
    Cliente informa cartão no ambiente do provider
↓
Cenário 2: pagamento transparente/tokenizado
    Sistema consumidor envia token do cartão
↓
Provider autoriza pagamento
↓
Pode capturar automaticamente ou depois
↓
Webhook confirma status
↓
API atualiza status
```

### Recomendação de segurança

Na primeira fase, preferir checkout/link hospedado ou tokenização do provider para reduzir escopo PCI. Não armazenar número completo do cartão, CVV ou dados sensíveis de cartão na API.

---

## 21. Fluxo cartão de débito

O cartão de débito depende do provider e pode exigir autenticação adicional, como 3DS no PagBank. A API deve modelar isso como:

```text
debit_card.requires_authentication = true
authentication_url
authentication_session_id
```

Fluxo:

```text
Cria tentativa de pagamento
↓
Provider exige autenticação
↓
Cliente autentica
↓
Provider retorna autorizado/negado
↓
API atualiza status
```

---

## 22. Fluxo de checkout/link de pagamento

```text
Sistema consumidor cria cobrança com checkout
↓
API cria checkout/link no provider
↓
API retorna paymentUrl
↓
Cliente acessa link
↓
Cliente escolhe forma de pagamento
↓
Provider processa
↓
Provider envia webhook
↓
API atualiza status
↓
API notifica sistema consumidor
```

Esse fluxo é o mais seguro para início porque transfere a entrada de dados sensíveis para o ambiente do provider.

---

## 23. Fluxo de cobrança com forma indefinida

Alguns providers permitem criar uma cobrança onde o pagador escolhe a forma de pagamento. No Asaas, por exemplo, `billingType = UNDEFINED` permite que o pagador escolha, desde que os meios estejam habilitados na conta.

Fluxo:

```text
Sistema consumidor informa paymentMethods
↓
API cria cobrança flexível
↓
Provider disponibiliza fatura/checkout
↓
Cliente escolhe Pix, boleto ou cartão
↓
API recebe webhook do método escolhido
```

---

## 24. Fluxo de parcelamento

```text
Sistema consumidor informa valor total e quantidade de parcelas
↓
API valida limites de parcelamento
↓
API cria parcelamento no provider
↓
Provider retorna parcelas ou cobrança parcelada
↓
API registra installment_group
↓
Cada parcela possui status próprio
```

Campos:

```json
{
  "installments": {
    "count": 3,
    "totalValue": 900.00,
    "interestMode": "MERCHANT_ABSORBS"
  }
}
```

---

## 25. Fluxo de recorrência / assinatura

```text
Sistema consumidor cria assinatura
↓
API cria plano ou assinatura no provider
↓
Provider agenda cobranças
↓
A cada ciclo, provider gera cobrança
↓
Webhook informa cobrança criada/paga/vencida
↓
API atualiza subscription e invoices
↓
API notifica sistema consumidor
```

Entidades:

```text
subscription
subscription_plan
subscription_cycle
subscription_charge
```

Status:

```text
ACTIVE
PAUSED
CANCELLED
OVERDUE
TRIAL
EXPIRED
```

---

## 26. Fluxo de estorno

```text
Sistema consumidor solicita estorno
↓
API valida pagamento
↓
API valida valor
↓
API chama provider
↓
Provider retorna sucesso/erro
↓
API cria refund
↓
API atualiza payment
↓
API envia webhook interno
```

Tipos:

```text
FULL_REFUND
PARTIAL_REFUND
MULTIPLE_PARTIAL_REFUNDS
```

Campos:

```json
{
  "amount": 100.00,
  "reason": "Solicitação do cliente",
  "metadata": {
    "userId": "..."
  }
}
```

---

## 27. Fluxo de cancelamento

Cancelamento pode significar coisas diferentes:

1. Cancelar cobrança ainda não paga.
2. Cancelar pré-autorização.
3. Cancelar captura.
4. Estornar pagamento já capturado.

A API deve expor operações claras:

```http
POST /charges/{id}/cancel
POST /payments/{id}/void
POST /payments/{id}/refund
```

---

## 28. Fluxo de chargeback/disputa

Para cartão, o provider pode informar disputa ou chargeback.

```text
Provider envia evento de chargeback/disputa
↓
API registra dispute
↓
API vincula ao pagamento
↓
API notifica sistema consumidor
↓
Sistema consumidor bloqueia entrega/serviço se necessário
↓
Equipe acompanha resolução
```

Entidade:

```text
payment_disputes
- payment_id
- provider
- reason
- status
- amount
- opened_at
- closed_at
```

---

## 29. Fluxo de split

A API deve nascer preparada para split, mesmo que não seja usado na primeira fase.

```text
Sistema consumidor informa divisão
↓
API valida recebedores
↓
API cria cobrança com split no provider
↓
Provider liquida valores para cada recebedor
↓
API registra split_rules e split_results
```

Exemplo:

```json
{
  "split": [
    {
      "recipientId": "uuid",
      "type": "PERCENTAGE",
      "value": 80
    },
    {
      "recipientId": "uuid",
      "type": "PERCENTAGE",
      "value": 20
    }
  ]
}
```

---

## 30. Fluxo de repasse e transferência

Quando o provider suportar transferências/subcontas, a API deve controlar:

```text
Saldo disponível
Solicitação de transferência
Status de transferência
Conta bancária destino
Taxas
Falhas
```

Endpoints futuros:

```http
POST /transfers
GET  /transfers/{id}
GET  /balances
```

---

## 31. Fluxo de conciliação

A conciliação deve cruzar:

```text
Charge criada
Payment confirmado
Webhook recebido
Valor bruto
Taxas do provider
Valor líquido
Data de pagamento
Data de liquidação
Extrato bancário
Referência externa do sistema consumidor
```

Fluxo:

```text
Provider informa pagamento
↓
API grava payment
↓
API calcula/recebe taxas
↓
API calcula valor líquido
↓
API identifica liquidação
↓
API gera registro de conciliação
↓
Sistema consumidor baixa sua conta a receber
```

Status de conciliação:

```text
PENDING
MATCHED
PARTIALLY_MATCHED
DIVERGENT
MANUAL_REVIEW
RECONCILED
```

---

## 32. Fluxo de webhooks dos providers

```text
Provider envia webhook
↓
API recebe em endpoint específico
↓
API valida assinatura/token/origem
↓
API salva payload bruto
↓
API verifica idempotência
↓
API normaliza evento
↓
API atualiza entidades internas
↓
API enfileira webhook interno
↓
API responde 200 rapidamente
```

Endpoints:

```http
POST /webhooks/providers/asaas
POST /webhooks/providers/pagbank
POST /webhooks/providers/infinitepay
POST /webhooks/providers/stone
```

---

## 33. Webhooks internos para sistemas consumidores

Os sistemas consumidores devem receber eventos padronizados.

Eventos:

```text
payment.charge.created
payment.charge.updated
payment.charge.cancelled
payment.charge.overdue
payment.payment.authorized
payment.payment.confirmed
payment.payment.received
payment.payment.failed
payment.payment.refunded
payment.payment.partially_refunded
payment.payment.chargeback
payment.settlement.available
payment.reconciliation.matched
payment.reconciliation.divergent
```

Payload:

```json
{
  "event": "payment.payment.received",
  "eventId": "uuid",
  "chargeId": "uuid",
  "paymentId": "uuid",
  "sourceSystem": "sistema-consumidor",
  "externalReference": "REF-12345",
  "provider": "ASAAS",
  "status": "RECEIVED",
  "amount": 100.00,
  "netAmount": 96.50,
  "paidAt": "2026-06-11T10:00:00-03:00",
  "availableAt": "2026-06-11T10:05:00-03:00"
}
```

Assinatura:

```text
X-Payments-Signature: HMAC_SHA256(payload, webhook_secret)
```

---

## 34. Idempotência

Toda criação de cobrança deve exigir chave de idempotência.

Header:

```http
Idempotency-Key: sistema-ref-12345-pix
```

Regra:

```text
tenant_id + source_system + external_reference + operation + idempotency_key
```

Se a mesma requisição for enviada novamente, a API deve retornar o mesmo resultado, sem criar cobrança duplicada.

---

## 35. Dados que os sistemas consumidores devem enviar

### 35.1 Dados mínimos para criar cobrança

```json
{
  "sourceSystem": "nome-do-sistema",
  "externalReference": "referencia-unica-no-sistema",
  "merchantId": "uuid",
  "customer": {
    "name": "Cliente Exemplo",
    "cpfCnpj": "00000000000",
    "email": "cliente@email.com",
    "phone": "73999999999"
  },
  "amount": 100.00,
  "description": "Descrição da cobrança",
  "dueDate": "2026-06-20",
  "paymentMethods": ["PIX", "BOLETO", "CREDIT_CARD"]
}
```

### 35.2 Dados recomendados do cliente

```json
{
  "customer": {
    "name": "Cliente Exemplo",
    "cpfCnpj": "00000000000",
    "email": "cliente@email.com",
    "phone": "73999999999",
    "mobilePhone": "73999999999",
    "address": {
      "street": "Rua Exemplo",
      "number": "123",
      "complement": "Sala 1",
      "neighborhood": "Centro",
      "city": "Ilhéus",
      "state": "BA",
      "postalCode": "45600000"
    }
  }
}
```

### 35.3 Dados de itens

```json
{
  "items": [
    {
      "externalItemId": "ITEM-001",
      "description": "Serviço ou produto",
      "quantity": 1,
      "unitValue": 100.00,
      "totalValue": 100.00
    }
  ]
}
```

### 35.4 Dados para Pix

```json
{
  "paymentMethod": "PIX",
  "pix": {
    "expiresIn": 3600
  }
}
```

### 35.5 Dados para boleto

```json
{
  "paymentMethod": "BOLETO",
  "boleto": {
    "dueDate": "2026-06-20",
    "instructions": "Não receber após vencimento",
    "fine": {
      "type": "PERCENTAGE",
      "value": 2
    },
    "interest": {
      "type": "PERCENTAGE_MONTHLY",
      "value": 1
    }
  }
}
```

### 35.6 Dados para cartão por checkout/link

```json
{
  "paymentMethod": "CREDIT_CARD",
  "checkout": {
    "enabled": true,
    "successUrl": "https://sistema.com/sucesso",
    "cancelUrl": "https://sistema.com/cancelado",
    "maxInstallments": 6
  }
}
```

### 35.7 Dados para cartão tokenizado

```json
{
  "paymentMethod": "CREDIT_CARD",
  "card": {
    "token": "card-token-provider",
    "holderName": "Cliente Exemplo",
    "installments": 3
  }
}
```

A API não deve receber nem armazenar CVV ou número completo do cartão, salvo se houver projeto PCI específico e infraestrutura compatível.

### 35.8 Dados para split

```json
{
  "split": [
    {
      "recipientExternalReference": "recebedor-1",
      "type": "FIXED",
      "amount": 80.00
    },
    {
      "recipientExternalReference": "recebedor-2",
      "type": "FIXED",
      "amount": 20.00
    }
  ]
}
```

### 35.9 Metadata

Todo sistema consumidor poderá enviar metadata.

```json
{
  "metadata": {
    "entity": "service_order",
    "entityId": "12345",
    "customerGroup": "frota",
    "costCenter": "transferencia",
    "plate": "ABC1D23"
  }
}
```

A metadata não deve ser usada como fonte primária de conciliação, mas ajuda auditoria, suporte e rastreabilidade.

---

## 36. Resposta padrão de criação de cobrança

```json
{
  "id": "uuid",
  "status": "WAITING_PAYMENT",
  "provider": "ASAAS",
  "providerReference": "pay_123",
  "sourceSystem": "nome-do-sistema",
  "externalReference": "REF-123",
  "amount": 100.00,
  "currency": "BRL",
  "paymentMethods": ["PIX", "BOLETO"],
  "paymentUrl": "https://...",
  "pix": {
    "copyPaste": "000201...",
    "qrCodeUrl": "https://...",
    "expiresAt": "2026-06-20T23:59:59-03:00"
  },
  "boleto": {
    "digitableLine": "...",
    "barcode": "...",
    "bankSlipUrl": "https://..."
  },
  "createdAt": "2026-06-11T10:00:00-03:00"
}
```

---

## 37. Integração Asaas

### 37.1 Escopo inicial

A integração Asaas deve suportar:

```text
Clientes
Cobranças
Pix
Boleto
Cartão de crédito
Cobrança com forma indefinida
Parcelamento
Recorrência/assinatura
Estorno
Webhooks
Split, se necessário
Consulta de cobrança
```

### 37.2 Observações oficiais importantes

A API de criação de cobrança do Asaas usa o endpoint `/v3/payments` e permite `billingType` com valores como `BOLETO`, `PIX`, `CREDIT_CARD` e `UNDEFINED`. A documentação também recomenda `externalReference` para rastreamento e conciliação. O Asaas disponibiliza webhooks de cobrança com eventos como criação, atualização, confirmação, recebimento, vencimento e exclusão. 

### 37.3 Mapeamento para o modelo interno

| Interno | Asaas |
|---|---|
| customer | customer |
| charge | payment |
| paymentMethod PIX | billingType PIX |
| paymentMethod BOLETO | billingType BOLETO |
| paymentMethod CREDIT_CARD | billingType CREDIT_CARD |
| flexible payment | billingType UNDEFINED |
| externalReference | externalReference |
| refund | payment refund |
| webhook | payment events |

### 37.4 Fluxo Asaas Pix

```text
POST /charges
↓
AsaasProvider.createCustomer, se necessário
↓
AsaasProvider.createCharge billingType=PIX
↓
Retorna invoiceUrl / dados Pix
↓
Webhook PAYMENT_CONFIRMED ou PAYMENT_RECEIVED
↓
Atualização interna
```

### 37.5 Fluxo Asaas Boleto

```text
POST /charges
↓
billingType=BOLETO
↓
Retorna fatura/boleto
↓
Pagamento compensado
↓
Webhook confirma pagamento
```

### 37.6 Fluxo Asaas cartão

```text
POST /charges
↓
billingType=CREDIT_CARD
↓
Pagamento por checkout/fatura ou tokenização
↓
Status autorizado/confirmado/recebido
```

---

## 38. Integração PagBank

### 38.1 Escopo inicial

A integração PagBank deve suportar:

```text
Pedidos
Pagamentos
Checkout
Link de pagamento
Pix
Boleto
Cartão de crédito
Cartão de débito, quando aplicável
Cancelamento
Estorno
Consulta
Webhooks
Split/divisão de pagamento, quando aplicável
Recorrência, se necessário
```

### 38.2 Observações oficiais importantes

A API de Pedidos do PagBank, também chamada de Order, trabalha com criação e consulta de pedidos, pagamento, consulta de pagamento, captura, cancelamento, 3DS, juros e armazenamento de cartão. O PagBank também possui API de Checkout/Link de Pagamento com meios como cartão de crédito, cartão de débito, Pix, boleto, PagBank, Apple Pay e Google Pay. Os webhooks permitem notificar o sistema em tempo real quando ocorrer mudança de status da transação.

### 38.3 Mapeamento para o modelo interno

| Interno | PagBank |
|---|---|
| charge | order / charge |
| payment | charge/payment |
| paymentUrl | checkout link |
| pix | QR Code / Pix |
| boleto | boleto |
| card | credit/debit card |
| cancel | cancel payment |
| capture | capture payment |
| split | split/divisão |
| webhook | transaction/checkout events |

### 38.4 Fluxo PagBank Order

```text
POST /charges
↓
PagBankProvider.createOrder
↓
PagBankProvider.payOrder, quando necessário
↓
Retorna status, links ou QR Code
↓
Webhook de alteração de status
↓
Atualização interna
```

### 38.5 Fluxo PagBank Checkout

```text
POST /payment-links
↓
PagBankProvider.createCheckout
↓
Retorna link de pagamento
↓
Cliente paga no checkout PagBank
↓
Webhook informa pagamento
```

### 38.6 Captura posterior

A API deve suportar transações com autorização e captura posterior.

```text
AUTHORIZE_ONLY
↓
AUTHORIZED
↓
CAPTURE
↓
CAPTURED/PAID
```

---

## 39. Integração InfinitePay futura

### 39.1 Escopo planejado

A InfinitePay deve ser preparada como provider futuro para:

```text
Checkout integrado
Link de pagamento
Pix
Cartão
InfiniteTap
Pagamento presencial por aproximação
Conciliação automática
```

### 39.2 Estratégia

Na primeira versão, criar apenas a interface e entidade de configuração:

```text
InfinitePayProvider
- createCharge: não implementado inicialmente
- createPaymentLink: planejado
- parseWebhook: planejado
```

### 39.3 Fluxo futuro InfiniteTap

```text
Sistema consumidor inicia venda
↓
API cria intenção de pagamento presencial
↓
Provider redireciona ou aciona app InfinitePay
↓
Cliente paga por aproximação
↓
Provider confirma venda
↓
API atualiza pagamento
```

---

## 40. Integração Stone futura

### 40.1 Escopo planejado

A Stone deve ser preparada para:

```text
Pagamentos online
Autorização
Captura
Cancelamento
Consulta
Pix/Open Banking
TEF/POS/SmartPOS, se necessário
Webhooks
```

### 40.2 Observações oficiais importantes

A Stone Online API usa padrão REST com JSON e rota de cobranças/charges para operações como autorização, captura, cancelamento e consulta de transações.

### 40.3 Fluxo futuro Stone Online

```text
POST /charges
↓
StoneProvider.authorize
↓
AUTHORIZED
↓
StoneProvider.capture, se necessário
↓
CAPTURED
↓
Webhook/consulta
↓
Atualização interna
```

---

## 41. Multi-provider e fallback

A API deve permitir fallback em cenários controlados.

Exemplo:

```text
Provider primário indisponível
↓
API verifica se cobrança ainda não foi criada
↓
API usa provider secundário
↓
Registra fallback no histórico
```

Regra importante:

```text
Nunca trocar de provider automaticamente se a cobrança já foi criada no provider primário e enviada ao cliente.
```

---

## 42. Modelo de dados

### 42.1 tenants

```sql
id
name
status
created_at
updated_at
```

### 42.2 merchants

```sql
id
tenant_id
legal_name
trade_name
cpf_cnpj
email
phone
address_json
status
created_at
updated_at
```

### 42.3 provider_accounts

```sql
id
tenant_id
merchant_id
provider
environment
credentials_encrypted
webhook_secret_encrypted
status
is_default
created_at
updated_at
```

### 42.4 payment_customers

```sql
id
tenant_id
merchant_id
name
cpf_cnpj
email
phone
address_json
created_at
updated_at
```

### 42.5 provider_customers

```sql
id
customer_id
provider_account_id
provider_customer_id
raw_payload
created_at
updated_at
```

### 42.6 charges

```sql
id
tenant_id
merchant_id
provider_account_id
source_system
external_reference
idempotency_key
description
amount
currency
status
due_date
expires_at
payment_url
provider
provider_charge_id
provider_order_id
provider_payment_id
raw_provider_payload
metadata_json
created_at
updated_at
```

### 42.7 charge_items

```sql
id
charge_id
external_item_id
description
quantity
unit_value
total_value
metadata_json
```

### 42.8 payment_attempts

```sql
id
charge_id
provider
payment_method
status
amount
installments
authorization_code
transaction_id
provider_payment_id
raw_provider_payload
created_at
updated_at
```

### 42.9 payments

```sql
id
charge_id
provider
payment_method
status
gross_amount
fee_amount
net_amount
paid_at
confirmed_at
available_at
settled_at
provider_payment_id
raw_provider_payload
created_at
updated_at
```

### 42.10 refunds

```sql
id
payment_id
provider
status
amount
reason
provider_refund_id
requested_by
requested_at
processed_at
raw_provider_payload
created_at
updated_at
```

### 42.11 subscriptions

```sql
id
tenant_id
merchant_id
customer_id
provider_account_id
source_system
external_reference
status
amount
billing_cycle
next_due_date
provider_subscription_id
metadata_json
created_at
updated_at
```

### 42.12 splits

```sql
id
charge_id
recipient_id
type
amount
percentage
provider_split_id
status
created_at
```

### 42.13 provider_webhook_events

```sql
id
provider
provider_account_id
event_type
event_id
signature_valid
raw_payload
headers_json
status
received_at
processed_at
error_message
```

### 42.14 internal_webhook_deliveries

```sql
id
tenant_id
target_url
event_type
payload_json
signature
status
attempts
last_attempt_at
next_retry_at
response_status
response_body
created_at
```

### 42.15 provider_requests

```sql
id
tenant_id
provider
operation
charge_id
payment_id
request_payload
response_payload
status
http_status
error_message
created_at
```

### 42.16 reconciliation_entries

```sql
id
tenant_id
charge_id
payment_id
provider
status
gross_amount
fee_amount
net_amount
expected_amount
difference_amount
matched_at
metadata_json
created_at
```

---

## 43. Endpoints públicos internos da API

### 43.1 Merchants

```http
POST   /merchants
GET    /merchants
GET    /merchants/{id}
PATCH  /merchants/{id}
```

### 43.2 Provider accounts

```http
POST   /merchants/{merchantId}/provider-accounts
GET    /merchants/{merchantId}/provider-accounts
PATCH  /provider-accounts/{id}
POST   /provider-accounts/{id}/test
```

### 43.3 Customers

```http
POST   /customers
GET    /customers
GET    /customers/{id}
PATCH  /customers/{id}
```

### 43.4 Charges

```http
POST   /charges
GET    /charges
GET    /charges/{id}
POST   /charges/{id}/cancel
POST   /charges/{id}/sync-status
```

### 43.5 Payment links

```http
POST   /payment-links
GET    /payment-links/{id}
POST   /payment-links/{id}/cancel
```

### 43.6 Payments

```http
GET    /payments
GET    /payments/{id}
POST   /payments/{id}/capture
POST   /payments/{id}/void
POST   /payments/{id}/refund
```

### 43.7 Refunds

```http
POST   /refunds
GET    /refunds/{id}
```

### 43.8 Subscriptions

```http
POST   /subscriptions
GET    /subscriptions
GET    /subscriptions/{id}
POST   /subscriptions/{id}/cancel
POST   /subscriptions/{id}/pause
POST   /subscriptions/{id}/resume
```

### 43.9 Reconciliation

```http
GET    /reconciliation
POST   /reconciliation/import
POST   /reconciliation/{id}/match
POST   /reconciliation/{id}/mark-divergent
```

### 43.10 Webhooks

```http
POST   /webhooks
GET    /webhooks
PATCH  /webhooks/{id}
POST   /webhooks/{id}/test
```

### 43.11 Provider webhooks

```http
POST   /webhooks/providers/asaas
POST   /webhooks/providers/pagbank
POST   /webhooks/providers/infinitepay
POST   /webhooks/providers/stone
```

---

## 44. Payload completo de criação de cobrança

```json
{
  "sourceSystem": "sistema-consumidor",
  "externalReference": "REF-12345",
  "merchantId": "uuid",
  "provider": "AUTO",
  "routingStrategy": "DEFAULT",
  "description": "Cobrança referente ao serviço/produto",
  "amount": 100.00,
  "currency": "BRL",
  "dueDate": "2026-06-20",
  "expiresAt": "2026-06-20T23:59:59-03:00",
  "paymentMethods": ["PIX", "BOLETO", "CREDIT_CARD"],
  "customer": {
    "externalReference": "CLI-001",
    "name": "Cliente Exemplo",
    "cpfCnpj": "00000000000",
    "email": "cliente@email.com",
    "phone": "73999999999",
    "address": {
      "street": "Rua Exemplo",
      "number": "123",
      "complement": "Sala 1",
      "neighborhood": "Centro",
      "city": "Ilhéus",
      "state": "BA",
      "postalCode": "45600000"
    }
  },
  "items": [
    {
      "externalItemId": "ITEM-001",
      "description": "Produto ou serviço",
      "quantity": 1,
      "unitValue": 100.00,
      "totalValue": 100.00
    }
  ],
  "pix": {
    "expiresIn": 3600
  },
  "boleto": {
    "instructions": "Não receber após vencimento",
    "fine": {
      "type": "PERCENTAGE",
      "value": 2
    },
    "interest": {
      "type": "PERCENTAGE_MONTHLY",
      "value": 1
    }
  },
  "card": {
    "capture": true,
    "installments": 1,
    "statementDescriptor": "COBRANCA"
  },
  "checkout": {
    "enabled": true,
    "successUrl": "https://sistema-consumidor.com/pagamento/sucesso",
    "cancelUrl": "https://sistema-consumidor.com/pagamento/cancelado"
  },
  "split": [],
  "metadata": {
    "entity": "order",
    "entityId": "12345"
  }
}
```

---

## 45. Resposta completa de cobrança criada

```json
{
  "id": "uuid",
  "status": "WAITING_PAYMENT",
  "provider": "ASAAS",
  "providerReference": "pay_123",
  "sourceSystem": "sistema-consumidor",
  "externalReference": "REF-12345",
  "amount": 100.00,
  "currency": "BRL",
  "dueDate": "2026-06-20",
  "paymentUrl": "https://...",
  "paymentMethods": ["PIX", "BOLETO", "CREDIT_CARD"],
  "pix": {
    "copyPaste": "000201...",
    "qrCodeUrl": "https://...",
    "expiresAt": "2026-06-20T23:59:59-03:00"
  },
  "boleto": {
    "digitableLine": "...",
    "barcode": "...",
    "bankSlipUrl": "https://..."
  },
  "checkout": {
    "url": "https://..."
  },
  "createdAt": "2026-06-11T10:00:00-03:00"
}
```

---

## 46. Segurança

### 46.1 Autenticação dos sistemas consumidores

```text
API Key por sistema
JWT assinado para chamadas internas
Scopes por operação
Rate limit por sistema
IP allowlist opcional
```

### 46.2 Credenciais dos providers

```text
Tokens criptografados
Secrets criptografados
Nunca registrar token em log
Rotação de credenciais
Ambiente separado: sandbox/produção
```

### 46.3 Dados de cartão

Regra principal:

```text
Não armazenar PAN completo, CVV ou dados sensíveis de cartão.
```

Preferir:

```text
Checkout hospedado
Link de pagamento
Tokenização do provider
3DS gerenciado pelo provider
```

### 46.4 Webhooks

```text
Validar assinatura/token
Salvar payload bruto
Responder rápido
Processar assíncrono
Garantir idempotência
Assinar webhooks internos
```

---

## 47. Observabilidade

A API deve ter:

```text
Logs estruturados
Correlation ID
Provider request ID
Métricas por provider
Métricas por status
Taxa de aprovação
Tempo médio de confirmação
Falhas de webhook
Dead letter queue
Alertas de indisponibilidade
```

Métricas:

```text
charges_created_total
payments_received_total
payments_failed_total
refunds_total
provider_errors_total
webhook_failures_total
reconciliation_divergences_total
```

---

## 48. Painel administrativo

A API deve ter um painel administrativo simples.

Menu:

```text
Dashboard
Merchants
Provider Accounts
Clientes
Cobranças
Pagamentos
Estornos
Assinaturas
Conciliação
Webhooks recebidos
Webhooks enviados
Logs de provider
Configurações
```

Indicadores:

```text
Total recebido hoje
Cobranças pendentes
Cobranças vencidas
Pagamentos confirmados
Pagamentos com erro
Estornos
Webhooks com falha
Divergências de conciliação
Provider indisponível
```

---

## 49. Regras de negócio essenciais

1. Todo pagamento deve ter uma `charge`.
2. Toda `charge` deve ter `sourceSystem` e `externalReference`.
3. Toda criação deve ser idempotente.
4. Toda chamada ao provider deve gerar log.
5. Todo webhook recebido deve ser armazenado bruto.
6. Todo webhook interno deve ter assinatura.
7. O sistema consumidor não deve depender de status específicos do provider.
8. A API deve normalizar todos os status.
9. A API deve permitir múltiplos providers por merchant.
10. Uma cobrança enviada ao cliente não deve trocar de provider automaticamente.
11. Estornos devem ser rastreáveis.
12. Divergências devem ir para conciliação manual.
13. Dados sensíveis devem ser criptografados.
14. Dados de cartão devem ser tokenizados ou hospedados pelo provider.
15. O sistema deve ser preparado para Pix, boleto, cartão, split, recorrência e conciliação.

---

## 50. Roadmap de desenvolvimento

### Fase 1 — Core da API

```text
NestJS
PostgreSQL
Prisma
Auth/API Key
Merchants
Provider Accounts
Customers
Charges
Payments
Provider Factory
Webhooks internos
Logs
Idempotência
```

### Fase 2 — Integração Asaas

```text
Criar cliente
Criar cobrança Pix
Criar cobrança boleto
Criar cobrança cartão/checkout
Cobrança UNDEFINED
Consulta de cobrança
Webhook de cobranças
Estorno
Status mapping
```

### Fase 3 — Integração PagBank

```text
Criar pedido
Criar pagamento
Checkout/link
Pix
Boleto
Cartão
Consulta
Cancelamento/estorno
Webhooks
Status mapping
```

### Fase 4 — Conciliação

```text
Payment entries
Fees
Net amount
Settlement
Relatório de divergências
Matching por externalReference
Matching por valor/data
Exportação
```

### Fase 5 — Recorrência

```text
Assinaturas
Planos
Ciclos
Cobranças recorrentes
Webhooks recorrentes
Cancelamento/pausa
```

### Fase 6 — Split e subcontas

```text
Recebedores
Split rules
Repasse
Taxas por recebedor
Relatórios
```

### Fase 7 — InfinitePay

```text
Provider base
Checkout integrado
InfiniteTap
Webhooks
Conciliação
```

### Fase 8 — Stone

```text
Provider base
Autorização
Captura
Cancelamento
Consulta
Pix/Open Banking
TEF/POS, se necessário
```

---

## 51. Evolução ao longo do tempo

A API deve facilitar mudanças de provider e regras de pagamento através de:

```text
Provider Pattern
Status interno padronizado
Payload interno canônico
Mapeadores por provider
Versão de API
Rotas versionadas
Feature flags
Configuração por merchant
Roteamento por estratégia
Jobs assíncronos
Webhooks padronizados
```

Estratégia de versionamento:

```text
/v1/charges
/v1/payments
/v1/webhooks

/v2/charges, no futuro se quebrar contrato
```

---

## 52. Contrato mínimo para integração dos sistemas consumidores

Para facilitar a integração, qualquer sistema que precise cobrar deve enviar pelo menos:

```text
sourceSystem
externalReference
merchantId
customer.name
customer.cpfCnpj
amount
description
dueDate ou expiresAt
paymentMethods
callback/webhook configurado previamente
```

Para melhorar conciliação, enviar também:

```text
items
metadata.entity
metadata.entityId
costCenter
tags
```

Para cartão/tokenização:

```text
checkout.enabled = true
ou
card.token
```

Para Pix:

```text
pix.expiresIn
```

Para boleto:

```text
boleto.instructions
boleto.fine
boleto.interest
```

Para recorrência:

```text
billingCycle
startDate
endDate
amount
customer
paymentMethod
```

---

## 53. Desenho final do fluxo completo

```text
[ Sistema consumidor ]
        │
        │ POST /charges
        ↓
[ API Gateway / Auth ]
        │
        ↓
[ Charges Service ]
        │
        ├── valida merchant
        ├── valida cliente
        ├── valida idempotência
        ├── cria charge interna
        │
        ↓
[ Provider Routing ]
        │
        ├── provider definido
        └── provider automático
        │
        ↓
[ Provider Adapter ]
        │
        ├── Asaas
        ├── PagBank
        ├── InfinitePay
        └── Stone
        │
        ↓
[ Gateway de pagamento ]
        │
        ├── Pix
        ├── Boleto
        ├── Cartão
        ├── Checkout
        └── Recorrência
        │
        ↓
[ Retorno da criação ]
        │
        ├── paymentUrl
        ├── QR Code Pix
        ├── boleto
        └── status
        │
        ↓
[ Cliente realiza pagamento ]
        │
        ↓
[ Webhook Provider ]
        │
        ↓
[ Webhook Receiver ]
        │
        ├── valida
        ├── salva payload bruto
        ├── normaliza evento
        ├── atualiza charge/payment
        └── enfileira webhook interno
        │
        ↓
[ Webhook interno ]
        │
        ↓
[ Sistema consumidor atualiza seu processo ]
        │
        ↓
[ Conciliação ]
        │
        ├── bruto
        ├── taxas
        ├── líquido
        ├── data de pagamento
        └── data de liquidação
```

---

## 54. Conclusão

Esta API de Pagamentos Central deve nascer como uma infraestrutura financeira reutilizável, multi-provider, segura, idempotente, orientada a eventos e preparada para crescimento.

O primeiro objetivo é integrar **Asaas** e **PagBank** para cobranças online com Pix, boleto, cartão, checkout, links, webhooks e estornos.

A arquitetura já deve deixar preparados os providers futuros **InfinitePay** e **Stone**, sem reescrever os sistemas consumidores.

A regra principal é:

```text
Os sistemas consumidores solicitam uma cobrança.
A API de Pagamentos resolve provider, payload, status, webhook, conciliação e rastreabilidade.
```
