# EngajamentoApi

All URIs are relative to *http://127.0.0.1:4010*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**createTicket**](EngajamentoApi.md#createticketoperation) | **POST** /me/support/tickets | Abrir ticket de suporte (F3 alt) |
| [**getChatMessages**](EngajamentoApi.md#getchatmessages) | **GET** /me/support/chat/messages | Histórico do chat (F3) |
| [**getFaq**](EngajamentoApi.md#getfaq) | **GET** /support/faq | FAQ / Ajuda (F2) |
| [**listNotifications**](EngajamentoApi.md#listnotifications) | **GET** /me/notifications | Listar notificações (F1) |
| [**markAllNotificationsRead**](EngajamentoApi.md#markallnotificationsread) | **POST** /me/notifications/read-all | Marcar todas como lidas (F1) |
| [**markNotificationRead**](EngajamentoApi.md#marknotificationread) | **PATCH** /me/notifications/{notificationId}/read | Marcar notificação como lida (F1) |
| [**sendChatMessage**](EngajamentoApi.md#sendchatmessageoperation) | **POST** /me/support/chat/messages | Enviar mensagem ao chat (F3) |



## createTicket

> CreateTicket201Response createTicket(createTicketRequest)

Abrir ticket de suporte (F3 alt)

### Example

```ts
import {
  Configuration,
  EngajamentoApi,
} from '@citybox/api-client';
import type { CreateTicketOperationRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new EngajamentoApi(config);

  const body = {
    // CreateTicketRequest
    createTicketRequest: ...,
  } satisfies CreateTicketOperationRequest;

  try {
    const data = await api.createTicket(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **createTicketRequest** | [CreateTicketRequest](CreateTicketRequest.md) |  | |

### Return type

[**CreateTicket201Response**](CreateTicket201Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** | Ticket criado |  -  |
| **401** | Token inválido ou expirado |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getChatMessages

> GetChatMessages200Response getChatMessages(before, limit)

Histórico do chat (F3)

### Example

```ts
import {
  Configuration,
  EngajamentoApi,
} from '@citybox/api-client';
import type { GetChatMessagesRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new EngajamentoApi(config);

  const body = {
    // string (optional)
    before: before_example,
    // number (optional)
    limit: 56,
  } satisfies GetChatMessagesRequest;

  try {
    const data = await api.getChatMessages(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **before** | `string` |  | [Optional] [Defaults to `undefined`] |
| **limit** | `number` |  | [Optional] [Defaults to `undefined`] |

### Return type

[**GetChatMessages200Response**](GetChatMessages200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Mensagens |  -  |
| **401** | Token inválido ou expirado |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getFaq

> GetFaq200Response getFaq()

FAQ / Ajuda (F2)

### Example

```ts
import {
  Configuration,
  EngajamentoApi,
} from '@citybox/api-client';
import type { GetFaqRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const api = new EngajamentoApi();

  try {
    const data = await api.getFaq();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**GetFaq200Response**](GetFaq200Response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Tópicos de FAQ |  -  |
| **400** | Requisição inválida (parâmetros malformados) |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## listNotifications

> ListNotifications200Response listNotifications(page, pageSize, unreadOnly)

Listar notificações (F1)

### Example

```ts
import {
  Configuration,
  EngajamentoApi,
} from '@citybox/api-client';
import type { ListNotificationsRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new EngajamentoApi(config);

  const body = {
    // number (optional)
    page: 56,
    // number (optional)
    pageSize: 56,
    // boolean (optional)
    unreadOnly: true,
  } satisfies ListNotificationsRequest;

  try {
    const data = await api.listNotifications(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **page** | `number` |  | [Optional] [Defaults to `1`] |
| **pageSize** | `number` |  | [Optional] [Defaults to `20`] |
| **unreadOnly** | `boolean` |  | [Optional] [Defaults to `undefined`] |

### Return type

[**ListNotifications200Response**](ListNotifications200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Notificações + contagem |  -  |
| **401** | Token inválido ou expirado |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## markAllNotificationsRead

> MarkAllNotificationsRead200Response markAllNotificationsRead()

Marcar todas como lidas (F1)

### Example

```ts
import {
  Configuration,
  EngajamentoApi,
} from '@citybox/api-client';
import type { MarkAllNotificationsReadRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new EngajamentoApi(config);

  try {
    const data = await api.markAllNotificationsRead();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**MarkAllNotificationsRead200Response**](MarkAllNotificationsRead200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Todas lidas |  -  |
| **401** | Token inválido ou expirado |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## markNotificationRead

> MarkNotificationRead200Response markNotificationRead(notificationId)

Marcar notificação como lida (F1)

### Example

```ts
import {
  Configuration,
  EngajamentoApi,
} from '@citybox/api-client';
import type { MarkNotificationReadRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new EngajamentoApi(config);

  const body = {
    // string
    notificationId: notificationId_example,
  } satisfies MarkNotificationReadRequest;

  try {
    const data = await api.markNotificationRead(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **notificationId** | `string` |  | [Defaults to `undefined`] |

### Return type

[**MarkNotificationRead200Response**](MarkNotificationRead200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Notificação lida |  -  |
| **401** | Token inválido ou expirado |  -  |
| **404** | Recurso não encontrado |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## sendChatMessage

> SendChatMessage201Response sendChatMessage(sendChatMessageRequest)

Enviar mensagem ao chat (F3)

### Example

```ts
import {
  Configuration,
  EngajamentoApi,
} from '@citybox/api-client';
import type { SendChatMessageOperationRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new EngajamentoApi(config);

  const body = {
    // SendChatMessageRequest
    sendChatMessageRequest: ...,
  } satisfies SendChatMessageOperationRequest;

  try {
    const data = await api.sendChatMessage(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **sendChatMessageRequest** | [SendChatMessageRequest](SendChatMessageRequest.md) |  | |

### Return type

[**SendChatMessage201Response**](SendChatMessage201Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** | Mensagem enviada + resposta do agente |  -  |
| **401** | Token inválido ou expirado |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

