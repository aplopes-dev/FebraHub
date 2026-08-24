# CheckoutApi

All URIs are relative to *http://127.0.0.1:4010*

| Method | HTTP request | Description |
| ------------- | ------------- | ------------- |
| [**checkoutPreview**](CheckoutApi.md#checkoutPreview) | **POST** checkout/preview | Resumo do checkout sem persistir |
| [**createOrder**](CheckoutApi.md#createOrder) | **POST** checkout/orders | Confirmar pedido (C4/C5) |
| [**getCheckoutSession**](CheckoutApi.md#getCheckoutSession) | **GET** checkout/session | Obter sessão de checkout |
| [**getShippingOptions**](CheckoutApi.md#getShippingOptions) | **POST** checkout/shipping-options | Cotar opções de envio (C2) |
| [**listCoupons**](CheckoutApi.md#listCoupons) | **GET** me/coupons | Cupons disponíveis (C3) |
| [**removeCoupon**](CheckoutApi.md#removeCoupon) | **DELETE** checkout/coupons | Remover cupom aplicado (C3) |
| [**updateCheckoutSession**](CheckoutApi.md#updateCheckoutSession) | **PATCH** checkout/session | Atualizar sessão (endereço/envio/pagamento) |
| [**validateCoupon**](CheckoutApi.md#validateCoupon) | **POST** checkout/coupons/validate | Validar/aplicar cupom (C3) |



Resumo do checkout sem persistir

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(CheckoutApi::class.java)
val checkoutPreviewRequest : CheckoutPreviewRequest =  // CheckoutPreviewRequest | 

val result : CheckoutPreview200Response = webService.checkoutPreview(checkoutPreviewRequest)
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **checkoutPreviewRequest** | [**CheckoutPreviewRequest**](CheckoutPreviewRequest.md)|  | |

### Return type

[**CheckoutPreview200Response**](CheckoutPreview200Response.md)

### Authorization


Configure bearerAuth:
    ApiClient().setBearerToken("TOKEN")

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


Confirmar pedido (C4/C5)

Aceita body completo ou sessão já preenchida. &#x60;buyNow: true&#x60; substitui o carrinho pelos itens informados. 

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(CheckoutApi::class.java)
val idempotencyKey : java.util.UUID = 38400000-8cf0-11bd-b23e-10b96e4ef00d // java.util.UUID | UUID v4 para evitar pedido duplicado em retry
val createOrderRequest : CreateOrderRequest =  // CreateOrderRequest | 

val result : CreateOrder201Response = webService.createOrder(idempotencyKey, createOrderRequest)
```

### Parameters
| **idempotencyKey** | **java.util.UUID**| UUID v4 para evitar pedido duplicado em retry | |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **createOrderRequest** | [**CreateOrderRequest**](CreateOrderRequest.md)|  | |

### Return type

[**CreateOrder201Response**](CreateOrder201Response.md)

### Authorization


Configure bearerAuth:
    ApiClient().setBearerToken("TOKEN")

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


Obter sessão de checkout

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(CheckoutApi::class.java)

val result : CheckoutSessionEnvelope = webService.getCheckoutSession()
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**CheckoutSessionEnvelope**](CheckoutSessionEnvelope.md)

### Authorization


Configure bearerAuth:
    ApiClient().setBearerToken("TOKEN")

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


Cotar opções de envio (C2)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(CheckoutApi::class.java)
val getShippingOptionsRequest : GetShippingOptionsRequest =  // GetShippingOptionsRequest | 

val result : GetShippingOptions200Response = webService.getShippingOptions(getShippingOptionsRequest)
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **getShippingOptionsRequest** | [**GetShippingOptionsRequest**](GetShippingOptionsRequest.md)|  | |

### Return type

[**GetShippingOptions200Response**](GetShippingOptions200Response.md)

### Authorization


Configure bearerAuth:
    ApiClient().setBearerToken("TOKEN")

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


Cupons disponíveis (C3)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(CheckoutApi::class.java)

val result : ListCoupons200Response = webService.listCoupons()
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**ListCoupons200Response**](ListCoupons200Response.md)

### Authorization


Configure bearerAuth:
    ApiClient().setBearerToken("TOKEN")

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


Remover cupom aplicado (C3)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(CheckoutApi::class.java)

val result : RemoveCoupon200Response = webService.removeCoupon()
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**RemoveCoupon200Response**](RemoveCoupon200Response.md)

### Authorization


Configure bearerAuth:
    ApiClient().setBearerToken("TOKEN")

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


Atualizar sessão (endereço/envio/pagamento)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(CheckoutApi::class.java)
val updateCheckoutSessionRequest : UpdateCheckoutSessionRequest =  // UpdateCheckoutSessionRequest | 

val result : CheckoutSessionEnvelope = webService.updateCheckoutSession(updateCheckoutSessionRequest)
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **updateCheckoutSessionRequest** | [**UpdateCheckoutSessionRequest**](UpdateCheckoutSessionRequest.md)|  | |

### Return type

[**CheckoutSessionEnvelope**](CheckoutSessionEnvelope.md)

### Authorization


Configure bearerAuth:
    ApiClient().setBearerToken("TOKEN")

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


Validar/aplicar cupom (C3)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(CheckoutApi::class.java)
val validateCouponRequest : ValidateCouponRequest =  // ValidateCouponRequest | 

val result : ValidateCoupon200Response = webService.validateCoupon(validateCouponRequest)
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **validateCouponRequest** | [**ValidateCouponRequest**](ValidateCouponRequest.md)|  | |

### Return type

[**ValidateCoupon200Response**](ValidateCoupon200Response.md)

### Authorization


Configure bearerAuth:
    ApiClient().setBearerToken("TOKEN")

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

