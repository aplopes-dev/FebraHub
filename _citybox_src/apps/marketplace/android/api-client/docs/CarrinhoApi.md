# CarrinhoApi

All URIs are relative to *http://127.0.0.1:4010*

| Method | HTTP request | Description |
| ------------- | ------------- | ------------- |
| [**addCartItem**](CarrinhoApi.md#addCartItem) | **POST** me/cart/items | Adicionar item ao carrinho |
| [**applyCartCoupon**](CarrinhoApi.md#applyCartCoupon) | **POST** me/cart/coupon | Aplicar cupom via carrinho (alias) |
| [**clearCart**](CarrinhoApi.md#clearCart) | **DELETE** me/cart | Limpar carrinho |
| [**getCart**](CarrinhoApi.md#getCart) | **GET** me/cart | Obter carrinho (+ badge) |
| [**removeCartItem**](CarrinhoApi.md#removeCartItem) | **DELETE** me/cart/items/{productId} | Remover item |
| [**updateCartItem**](CarrinhoApi.md#updateCartItem) | **PATCH** me/cart/items/{productId} | Atualizar quantidade (0 remove) |



Adicionar item ao carrinho

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(CarrinhoApi::class.java)
val addCartItemRequest : AddCartItemRequest =  // AddCartItemRequest | 

val result : GetCart200Response = webService.addCartItem(addCartItemRequest)
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **addCartItemRequest** | [**AddCartItemRequest**](AddCartItemRequest.md)|  | |

### Return type

[**GetCart200Response**](GetCart200Response.md)

### Authorization


Configure bearerAuth:
    ApiClient().setBearerToken("TOKEN")

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


Aplicar cupom via carrinho (alias)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(CarrinhoApi::class.java)
val applyCartCouponRequest : ApplyCartCouponRequest =  // ApplyCartCouponRequest | 

val result : ApplyCartCoupon200Response = webService.applyCartCoupon(applyCartCouponRequest)
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **applyCartCouponRequest** | [**ApplyCartCouponRequest**](ApplyCartCouponRequest.md)|  | |

### Return type

[**ApplyCartCoupon200Response**](ApplyCartCoupon200Response.md)

### Authorization


Configure bearerAuth:
    ApiClient().setBearerToken("TOKEN")

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


Limpar carrinho

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(CarrinhoApi::class.java)

webService.clearCart()
```

### Parameters
This endpoint does not need any parameter.

### Return type

null (empty response body)

### Authorization


Configure bearerAuth:
    ApiClient().setBearerToken("TOKEN")

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


Obter carrinho (+ badge)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(CarrinhoApi::class.java)

val result : GetCart200Response = webService.getCart()
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**GetCart200Response**](GetCart200Response.md)

### Authorization


Configure bearerAuth:
    ApiClient().setBearerToken("TOKEN")

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


Remover item

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(CarrinhoApi::class.java)
val productId : kotlin.String = iphone15pro // kotlin.String | 

val result : GetCart200Response = webService.removeCartItem(productId)
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **productId** | **kotlin.String**|  | |

### Return type

[**GetCart200Response**](GetCart200Response.md)

### Authorization


Configure bearerAuth:
    ApiClient().setBearerToken("TOKEN")

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


Atualizar quantidade (0 remove)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(CarrinhoApi::class.java)
val productId : kotlin.String = iphone15pro // kotlin.String | 
val updateCartItemRequest : UpdateCartItemRequest =  // UpdateCartItemRequest | 

val result : GetCart200Response = webService.updateCartItem(productId, updateCartItemRequest)
```

### Parameters
| **productId** | **kotlin.String**|  | |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **updateCartItemRequest** | [**UpdateCartItemRequest**](UpdateCartItemRequest.md)|  | |

### Return type

[**GetCart200Response**](GetCart200Response.md)

### Authorization


Configure bearerAuth:
    ApiClient().setBearerToken("TOKEN")

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

