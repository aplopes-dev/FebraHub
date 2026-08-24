# CheckoutApi

All URIs are relative to *http://127.0.0.1:4010*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**checkoutPreview**](CheckoutApi.md#checkoutpreviewoperation) | **POST** /checkout/preview | Resumo do checkout sem persistir |
| [**createOrder**](CheckoutApi.md#createorderoperation) | **POST** /checkout/orders | Confirmar pedido (C4/C5) |
| [**getCheckoutSession**](CheckoutApi.md#getcheckoutsession) | **GET** /checkout/session | Obter sessão de checkout |
| [**getShippingOptions**](CheckoutApi.md#getshippingoptionsoperation) | **POST** /checkout/shipping-options | Cotar opções de envio (C2) |
| [**listCoupons**](CheckoutApi.md#listcoupons) | **GET** /me/coupons | Cupons disponíveis (C3) |
| [**removeCoupon**](CheckoutApi.md#removecoupon) | **DELETE** /checkout/coupons | Remover cupom aplicado (C3) |
| [**updateCheckoutSession**](CheckoutApi.md#updatecheckoutsessionoperation) | **PATCH** /checkout/session | Atualizar sessão (endereço/envio/pagamento) |
| [**validateCoupon**](CheckoutApi.md#validatecouponoperation) | **POST** /checkout/coupons/validate | Validar/aplicar cupom (C3) |



## checkoutPreview

> CheckoutPreview200Response checkoutPreview(checkoutPreviewRequest)

Resumo do checkout sem persistir

### Example

```ts
import {
  Configuration,
  CheckoutApi,
} from '@citybox/api-client';
import type { CheckoutPreviewOperationRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new CheckoutApi(config);

  const body = {
    // CheckoutPreviewRequest
    checkoutPreviewRequest: ...,
  } satisfies CheckoutPreviewOperationRequest;

  try {
    const data = await api.checkoutPreview(body);
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
| **checkoutPreviewRequest** | [CheckoutPreviewRequest](CheckoutPreviewRequest.md) |  | |

### Return type

[**CheckoutPreview200Response**](CheckoutPreview200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Preview detalhado |  -  |
| **401** | Token inválido ou expirado |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## createOrder

> CreateOrder201Response createOrder(idempotencyKey, createOrderRequest)

Confirmar pedido (C4/C5)

Aceita body completo ou sessão já preenchida. &#x60;buyNow: true&#x60; substitui o carrinho pelos itens informados. 

### Example

```ts
import {
  Configuration,
  CheckoutApi,
} from '@citybox/api-client';
import type { CreateOrderOperationRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new CheckoutApi(config);

  const body = {
    // string | UUID v4 para evitar pedido duplicado em retry
    idempotencyKey: 38400000-8cf0-11bd-b23e-10b96e4ef00d,
    // CreateOrderRequest
    createOrderRequest: ...,
  } satisfies CreateOrderOperationRequest;

  try {
    const data = await api.createOrder(body);
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
| **idempotencyKey** | `string` | UUID v4 para evitar pedido duplicado em retry | [Defaults to `undefined`] |
| **createOrderRequest** | [CreateOrderRequest](CreateOrderRequest.md) |  | |

### Return type

[**CreateOrder201Response**](CreateOrder201Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** | Pedido criado |  -  |
| **402** | Pagamento recusado |  -  |
| **422** | Checkout inválido (faltam dados) |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getCheckoutSession

> CheckoutSessionEnvelope getCheckoutSession()

Obter sessão de checkout

### Example

```ts
import {
  Configuration,
  CheckoutApi,
} from '@citybox/api-client';
import type { GetCheckoutSessionRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new CheckoutApi(config);

  try {
    const data = await api.getCheckoutSession();
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

[**CheckoutSessionEnvelope**](CheckoutSessionEnvelope.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Carrinho + sessão + preview |  -  |
| **401** | Token inválido ou expirado |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getShippingOptions

> GetShippingOptions200Response getShippingOptions(getShippingOptionsRequest)

Cotar opções de envio (C2)

### Example

```ts
import {
  Configuration,
  CheckoutApi,
} from '@citybox/api-client';
import type { GetShippingOptionsOperationRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new CheckoutApi(config);

  const body = {
    // GetShippingOptionsRequest
    getShippingOptionsRequest: ...,
  } satisfies GetShippingOptionsOperationRequest;

  try {
    const data = await api.getShippingOptions(body);
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
| **getShippingOptionsRequest** | [GetShippingOptionsRequest](GetShippingOptionsRequest.md) |  | |

### Return type

[**GetShippingOptions200Response**](GetShippingOptions200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Opções + mensagem de frete |  -  |
| **401** | Token inválido ou expirado |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## listCoupons

> ListCoupons200Response listCoupons()

Cupons disponíveis (C3)

### Example

```ts
import {
  Configuration,
  CheckoutApi,
} from '@citybox/api-client';
import type { ListCouponsRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new CheckoutApi(config);

  try {
    const data = await api.listCoupons();
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

[**ListCoupons200Response**](ListCoupons200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Lista de cupons |  -  |
| **401** | Token inválido ou expirado |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## removeCoupon

> RemoveCoupon200Response removeCoupon()

Remover cupom aplicado (C3)

### Example

```ts
import {
  Configuration,
  CheckoutApi,
} from '@citybox/api-client';
import type { RemoveCouponRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new CheckoutApi(config);

  try {
    const data = await api.removeCoupon();
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

[**RemoveCoupon200Response**](RemoveCoupon200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Cupom removido (preview recalculado) |  -  |
| **401** | Token inválido ou expirado |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## updateCheckoutSession

> CheckoutSessionEnvelope updateCheckoutSession(updateCheckoutSessionRequest)

Atualizar sessão (endereço/envio/pagamento)

### Example

```ts
import {
  Configuration,
  CheckoutApi,
} from '@citybox/api-client';
import type { UpdateCheckoutSessionOperationRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new CheckoutApi(config);

  const body = {
    // UpdateCheckoutSessionRequest
    updateCheckoutSessionRequest: ...,
  } satisfies UpdateCheckoutSessionOperationRequest;

  try {
    const data = await api.updateCheckoutSession(body);
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
| **updateCheckoutSessionRequest** | [UpdateCheckoutSessionRequest](UpdateCheckoutSessionRequest.md) |  | |

### Return type

[**CheckoutSessionEnvelope**](CheckoutSessionEnvelope.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Sessão atualizada (preview recalculado) |  -  |
| **401** | Token inválido ou expirado |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## validateCoupon

> ValidateCoupon200Response validateCoupon(validateCouponRequest)

Validar/aplicar cupom (C3)

### Example

```ts
import {
  Configuration,
  CheckoutApi,
} from '@citybox/api-client';
import type { ValidateCouponOperationRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new CheckoutApi(config);

  const body = {
    // ValidateCouponRequest
    validateCouponRequest: ...,
  } satisfies ValidateCouponOperationRequest;

  try {
    const data = await api.validateCoupon(body);
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
| **validateCouponRequest** | [ValidateCouponRequest](ValidateCouponRequest.md) |  | |

### Return type

[**ValidateCoupon200Response**](ValidateCoupon200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Cupom válido |  -  |
| **404** | Cupom não encontrado |  -  |
| **422** | Cupom expirado ou não aplicável |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

