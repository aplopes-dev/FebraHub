# CarrinhoApi

All URIs are relative to *http://127.0.0.1:4010*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**addCartItem**](CarrinhoApi.md#addcartitemoperation) | **POST** /me/cart/items | Adicionar item ao carrinho |
| [**applyCartCoupon**](CarrinhoApi.md#applycartcouponoperation) | **POST** /me/cart/coupon | Aplicar cupom via carrinho (alias) |
| [**clearCart**](CarrinhoApi.md#clearcart) | **DELETE** /me/cart | Limpar carrinho |
| [**getCart**](CarrinhoApi.md#getcart) | **GET** /me/cart | Obter carrinho (+ badge) |
| [**removeCartItem**](CarrinhoApi.md#removecartitem) | **DELETE** /me/cart/items/{productId} | Remover item |
| [**updateCartItem**](CarrinhoApi.md#updatecartitemoperation) | **PATCH** /me/cart/items/{productId} | Atualizar quantidade (0 remove) |



## addCartItem

> GetCart200Response addCartItem(addCartItemRequest)

Adicionar item ao carrinho

### Example

```ts
import {
  Configuration,
  CarrinhoApi,
} from '@citybox/api-client';
import type { AddCartItemOperationRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new CarrinhoApi(config);

  const body = {
    // AddCartItemRequest
    addCartItemRequest: ...,
  } satisfies AddCartItemOperationRequest;

  try {
    const data = await api.addCartItem(body);
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
| **addCartItemRequest** | [AddCartItemRequest](AddCartItemRequest.md) |  | |

### Return type

[**GetCart200Response**](GetCart200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Carrinho atualizado |  -  |
| **401** | Token inválido ou expirado |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## applyCartCoupon

> ApplyCartCoupon200Response applyCartCoupon(applyCartCouponRequest)

Aplicar cupom via carrinho (alias)

### Example

```ts
import {
  Configuration,
  CarrinhoApi,
} from '@citybox/api-client';
import type { ApplyCartCouponOperationRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new CarrinhoApi(config);

  const body = {
    // ApplyCartCouponRequest
    applyCartCouponRequest: ...,
  } satisfies ApplyCartCouponOperationRequest;

  try {
    const data = await api.applyCartCoupon(body);
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
| **applyCartCouponRequest** | [ApplyCartCouponRequest](ApplyCartCouponRequest.md) |  | |

### Return type

[**ApplyCartCoupon200Response**](ApplyCartCoupon200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Cupom aplicado |  -  |
| **404** | Cupom não encontrado |  -  |
| **422** | Cupom expirado ou não aplicável |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## clearCart

> clearCart()

Limpar carrinho

### Example

```ts
import {
  Configuration,
  CarrinhoApi,
} from '@citybox/api-client';
import type { ClearCartRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new CarrinhoApi(config);

  try {
    const data = await api.clearCart();
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

`void` (Empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **204** | Carrinho limpo |  -  |
| **401** | Token inválido ou expirado |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getCart

> GetCart200Response getCart()

Obter carrinho (+ badge)

### Example

```ts
import {
  Configuration,
  CarrinhoApi,
} from '@citybox/api-client';
import type { GetCartRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new CarrinhoApi(config);

  try {
    const data = await api.getCart();
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

[**GetCart200Response**](GetCart200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Carrinho |  -  |
| **401** | Token inválido ou expirado |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## removeCartItem

> GetCart200Response removeCartItem(productId)

Remover item

### Example

```ts
import {
  Configuration,
  CarrinhoApi,
} from '@citybox/api-client';
import type { RemoveCartItemRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new CarrinhoApi(config);

  const body = {
    // string
    productId: iphone15pro,
  } satisfies RemoveCartItemRequest;

  try {
    const data = await api.removeCartItem(body);
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
| **productId** | `string` |  | [Defaults to `undefined`] |

### Return type

[**GetCart200Response**](GetCart200Response.md)

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


## updateCartItem

> GetCart200Response updateCartItem(productId, updateCartItemRequest)

Atualizar quantidade (0 remove)

### Example

```ts
import {
  Configuration,
  CarrinhoApi,
} from '@citybox/api-client';
import type { UpdateCartItemOperationRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new CarrinhoApi(config);

  const body = {
    // string
    productId: iphone15pro,
    // UpdateCartItemRequest
    updateCartItemRequest: ...,
  } satisfies UpdateCartItemOperationRequest;

  try {
    const data = await api.updateCartItem(body);
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
| **productId** | `string` |  | [Defaults to `undefined`] |
| **updateCartItemRequest** | [UpdateCartItemRequest](UpdateCartItemRequest.md) |  | |

### Return type

[**GetCart200Response**](GetCart200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Carrinho atualizado |  -  |
| **401** | Token inválido ou expirado |  -  |
| **404** | Recurso não encontrado |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

