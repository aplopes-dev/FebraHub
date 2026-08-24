# PagamentosApi

All URIs are relative to *http://127.0.0.1:4010*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**createPaymentMethod**](PagamentosApi.md#createpaymentmethodoperation) | **POST** /me/payment-methods | Adicionar cartão (B5) |
| [**deletePaymentMethod**](PagamentosApi.md#deletepaymentmethod) | **DELETE** /me/payment-methods/{paymentMethodId} | Excluir cartão (B4) |
| [**listPaymentMethods**](PagamentosApi.md#listpaymentmethods) | **GET** /me/payment-methods | Listar cartões (B4) |
| [**setDefaultPaymentMethod**](PagamentosApi.md#setdefaultpaymentmethod) | **PATCH** /me/payment-methods/{paymentMethodId}/default | Definir cartão padrão (B4/C5) |



## createPaymentMethod

> CreatePaymentMethod201Response createPaymentMethod(createPaymentMethodRequest)

Adicionar cartão (B5)

Backend tokeniza via gateway. Nunca persistir PAN/CVV em claro.

### Example

```ts
import {
  Configuration,
  PagamentosApi,
} from '@citybox/api-client';
import type { CreatePaymentMethodOperationRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new PagamentosApi(config);

  const body = {
    // CreatePaymentMethodRequest
    createPaymentMethodRequest: ...,
  } satisfies CreatePaymentMethodOperationRequest;

  try {
    const data = await api.createPaymentMethod(body);
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
| **createPaymentMethodRequest** | [CreatePaymentMethodRequest](CreatePaymentMethodRequest.md) |  | |

### Return type

[**CreatePaymentMethod201Response**](CreatePaymentMethod201Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** | Cartão adicionado |  -  |
| **401** | Token inválido ou expirado |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## deletePaymentMethod

> deletePaymentMethod(paymentMethodId)

Excluir cartão (B4)

### Example

```ts
import {
  Configuration,
  PagamentosApi,
} from '@citybox/api-client';
import type { DeletePaymentMethodRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new PagamentosApi(config);

  const body = {
    // string
    paymentMethodId: card-1,
  } satisfies DeletePaymentMethodRequest;

  try {
    const data = await api.deletePaymentMethod(body);
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
| **paymentMethodId** | `string` |  | [Defaults to `undefined`] |

### Return type

`void` (Empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **204** | Cartão excluído |  -  |
| **401** | Token inválido ou expirado |  -  |
| **404** | Recurso não encontrado |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## listPaymentMethods

> ListPaymentMethods200Response listPaymentMethods()

Listar cartões (B4)

### Example

```ts
import {
  Configuration,
  PagamentosApi,
} from '@citybox/api-client';
import type { ListPaymentMethodsRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new PagamentosApi(config);

  try {
    const data = await api.listPaymentMethods();
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

[**ListPaymentMethods200Response**](ListPaymentMethods200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Lista de cartões |  -  |
| **401** | Token inválido ou expirado |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## setDefaultPaymentMethod

> SetDefaultPaymentMethod200Response setDefaultPaymentMethod(paymentMethodId)

Definir cartão padrão (B4/C5)

### Example

```ts
import {
  Configuration,
  PagamentosApi,
} from '@citybox/api-client';
import type { SetDefaultPaymentMethodRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new PagamentosApi(config);

  const body = {
    // string
    paymentMethodId: card-1,
  } satisfies SetDefaultPaymentMethodRequest;

  try {
    const data = await api.setDefaultPaymentMethod(body);
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
| **paymentMethodId** | `string` |  | [Defaults to `undefined`] |

### Return type

[**SetDefaultPaymentMethod200Response**](SetDefaultPaymentMethod200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Cartão padrão definido |  -  |
| **401** | Token inválido ou expirado |  -  |
| **404** | Recurso não encontrado |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

