# PedidosApi

All URIs are relative to *http://127.0.0.1:4010*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**buyAgain**](PedidosApi.md#buyagain) | **POST** /me/orders/{orderId}/buy-again | Comprar novamente (D1) |
| [**cancelOrder**](PedidosApi.md#cancelorderoperation) | **POST** /me/orders/{orderId}/cancel | Cancelar pedido (D1/D4) |
| [**createReturn**](PedidosApi.md#createreturnoperation) | **POST** /me/orders/{orderId}/returns | Solicitar devolução (D4) |
| [**getInvoice**](PedidosApi.md#getinvoice) | **GET** /me/orders/{orderId}/invoice | Nota fiscal (D1) |
| [**getOrder**](PedidosApi.md#getorder) | **GET** /me/orders/{orderId} | Detalhe do pedido (D1) |
| [**getReturn**](PedidosApi.md#getreturn) | **GET** /me/orders/{orderId}/returns/{returnId} | Consultar devolução (D4) |
| [**getTracking**](PedidosApi.md#gettracking) | **GET** /me/orders/{orderId}/tracking | Rastreamento (D2) |
| [**listOrders**](PedidosApi.md#listorders) | **GET** /me/orders | Listar pedidos |



## buyAgain

> BuyAgain200Response buyAgain(orderId)

Comprar novamente (D1)

Adiciona os itens do pedido ao carrinho (merge de quantidades).

### Example

```ts
import {
  Configuration,
  PedidosApi,
} from '@citybox/api-client';
import type { BuyAgainRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new PedidosApi(config);

  const body = {
    // string
    orderId: CB-001234,
  } satisfies BuyAgainRequest;

  try {
    const data = await api.buyAgain(body);
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
| **orderId** | `string` |  | [Defaults to `undefined`] |

### Return type

[**BuyAgain200Response**](BuyAgain200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Carrinho atualizado |  -  |
| **401** | Token inválido ou expirado |  -  |
| **404** | Recurso não encontrado |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## cancelOrder

> GetOrder200Response cancelOrder(orderId, cancelOrderRequest)

Cancelar pedido (D1/D4)

### Example

```ts
import {
  Configuration,
  PedidosApi,
} from '@citybox/api-client';
import type { CancelOrderOperationRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new PedidosApi(config);

  const body = {
    // string
    orderId: CB-001234,
    // CancelOrderRequest
    cancelOrderRequest: ...,
  } satisfies CancelOrderOperationRequest;

  try {
    const data = await api.cancelOrder(body);
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
| **orderId** | `string` |  | [Defaults to `undefined`] |
| **cancelOrderRequest** | [CancelOrderRequest](CancelOrderRequest.md) |  | |

### Return type

[**GetOrder200Response**](GetOrder200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Pedido cancelado |  -  |
| **422** | Pedido não pode ser cancelado |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## createReturn

> CreateReturn201Response createReturn(orderId, createReturnRequest)

Solicitar devolução (D4)

### Example

```ts
import {
  Configuration,
  PedidosApi,
} from '@citybox/api-client';
import type { CreateReturnOperationRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new PedidosApi(config);

  const body = {
    // string
    orderId: CB-001234,
    // CreateReturnRequest
    createReturnRequest: ...,
  } satisfies CreateReturnOperationRequest;

  try {
    const data = await api.createReturn(body);
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
| **orderId** | `string` |  | [Defaults to `undefined`] |
| **createReturnRequest** | [CreateReturnRequest](CreateReturnRequest.md) |  | |

### Return type

[**CreateReturn201Response**](CreateReturn201Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** | Devolução solicitada |  -  |
| **401** | Token inválido ou expirado |  -  |
| **404** | Recurso não encontrado |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getInvoice

> GetInvoice200Response getInvoice(orderId)

Nota fiscal (D1)

### Example

```ts
import {
  Configuration,
  PedidosApi,
} from '@citybox/api-client';
import type { GetInvoiceRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new PedidosApi(config);

  const body = {
    // string
    orderId: CB-001234,
  } satisfies GetInvoiceRequest;

  try {
    const data = await api.getInvoice(body);
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
| **orderId** | `string` |  | [Defaults to `undefined`] |

### Return type

[**GetInvoice200Response**](GetInvoice200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | URL da NF |  -  |
| **401** | Token inválido ou expirado |  -  |
| **404** | Recurso não encontrado |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getOrder

> GetOrder200Response getOrder(orderId, ifNoneMatch)

Detalhe do pedido (D1)

Suporta cache condicional (ETag/If-None-Match) para polling de status.

### Example

```ts
import {
  Configuration,
  PedidosApi,
} from '@citybox/api-client';
import type { GetOrderRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new PedidosApi(config);

  const body = {
    // string
    orderId: CB-001234,
    // string (optional)
    ifNoneMatch: ifNoneMatch_example,
  } satisfies GetOrderRequest;

  try {
    const data = await api.getOrder(body);
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
| **orderId** | `string` |  | [Defaults to `undefined`] |
| **ifNoneMatch** | `string` |  | [Optional] [Defaults to `undefined`] |

### Return type

[**GetOrder200Response**](GetOrder200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Pedido |  * ETag -  <br>  * Last-Modified -  <br>  |
| **304** | Status inalterado (sem corpo) |  -  |
| **401** | Token inválido ou expirado |  -  |
| **404** | Recurso não encontrado |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getReturn

> GetReturn200Response getReturn(orderId, returnId)

Consultar devolução (D4)

### Example

```ts
import {
  Configuration,
  PedidosApi,
} from '@citybox/api-client';
import type { GetReturnRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new PedidosApi(config);

  const body = {
    // string
    orderId: CB-001234,
    // string
    returnId: returnId_example,
  } satisfies GetReturnRequest;

  try {
    const data = await api.getReturn(body);
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
| **orderId** | `string` |  | [Defaults to `undefined`] |
| **returnId** | `string` |  | [Defaults to `undefined`] |

### Return type

[**GetReturn200Response**](GetReturn200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Detalhe da devolução |  -  |
| **401** | Token inválido ou expirado |  -  |
| **404** | Recurso não encontrado |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getTracking

> GetTracking200Response getTracking(orderId)

Rastreamento (D2)

### Example

```ts
import {
  Configuration,
  PedidosApi,
} from '@citybox/api-client';
import type { GetTrackingRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new PedidosApi(config);

  const body = {
    // string
    orderId: CB-001234,
  } satisfies GetTrackingRequest;

  try {
    const data = await api.getTracking(body);
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
| **orderId** | `string` |  | [Defaults to `undefined`] |

### Return type

[**GetTracking200Response**](GetTracking200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Timeline de rastreio |  -  |
| **401** | Token inválido ou expirado |  -  |
| **404** | Recurso não encontrado |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## listOrders

> ListOrders200Response listOrders(page, pageSize, status)

Listar pedidos

### Example

```ts
import {
  Configuration,
  PedidosApi,
} from '@citybox/api-client';
import type { ListOrdersRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new PedidosApi(config);

  const body = {
    // number (optional)
    page: 56,
    // number (optional)
    pageSize: 56,
    // OrderStatus (optional)
    status: ...,
  } satisfies ListOrdersRequest;

  try {
    const data = await api.listOrders(body);
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
| **status** | `OrderStatus` |  | [Optional] [Defaults to `undefined`] [Enum: CONFIRMED, PREPARING, SHIPPED, DELIVERED, CANCELLED, RETURN_REQUESTED, RETURNED] |

### Return type

[**ListOrders200Response**](ListOrders200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Lista de pedidos |  -  |
| **401** | Token inválido ou expirado |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

