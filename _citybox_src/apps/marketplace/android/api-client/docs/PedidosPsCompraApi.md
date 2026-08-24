# PedidosPsCompraApi

All URIs are relative to *http://127.0.0.1:4010*

| Method | HTTP request | Description |
| ------------- | ------------- | ------------- |
| [**buyAgain**](PedidosPsCompraApi.md#buyAgain) | **POST** me/orders/{orderId}/buy-again | Comprar novamente (D1) |
| [**cancelOrder**](PedidosPsCompraApi.md#cancelOrder) | **POST** me/orders/{orderId}/cancel | Cancelar pedido (D1/D4) |
| [**createReturn**](PedidosPsCompraApi.md#createReturn) | **POST** me/orders/{orderId}/returns | Solicitar devolução (D4) |
| [**getInvoice**](PedidosPsCompraApi.md#getInvoice) | **GET** me/orders/{orderId}/invoice | Nota fiscal (D1) |
| [**getOrder**](PedidosPsCompraApi.md#getOrder) | **GET** me/orders/{orderId} | Detalhe do pedido (D1) |
| [**getReturn**](PedidosPsCompraApi.md#getReturn) | **GET** me/orders/{orderId}/returns/{returnId} | Consultar devolução (D4) |
| [**getTracking**](PedidosPsCompraApi.md#getTracking) | **GET** me/orders/{orderId}/tracking | Rastreamento (D2) |
| [**listOrders**](PedidosPsCompraApi.md#listOrders) | **GET** me/orders | Listar pedidos |



Comprar novamente (D1)

Adiciona os itens do pedido ao carrinho (merge de quantidades).

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(PedidosPsCompraApi::class.java)
val orderId : kotlin.String = CB-001234 // kotlin.String | 

val result : BuyAgain200Response = webService.buyAgain(orderId)
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **orderId** | **kotlin.String**|  | |

### Return type

[**BuyAgain200Response**](BuyAgain200Response.md)

### Authorization


Configure bearerAuth:
    ApiClient().setBearerToken("TOKEN")

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


Cancelar pedido (D1/D4)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(PedidosPsCompraApi::class.java)
val orderId : kotlin.String = CB-001234 // kotlin.String | 
val cancelOrderRequest : CancelOrderRequest =  // CancelOrderRequest | 

val result : GetOrder200Response = webService.cancelOrder(orderId, cancelOrderRequest)
```

### Parameters
| **orderId** | **kotlin.String**|  | |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **cancelOrderRequest** | [**CancelOrderRequest**](CancelOrderRequest.md)|  | |

### Return type

[**GetOrder200Response**](GetOrder200Response.md)

### Authorization


Configure bearerAuth:
    ApiClient().setBearerToken("TOKEN")

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


Solicitar devolução (D4)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(PedidosPsCompraApi::class.java)
val orderId : kotlin.String = CB-001234 // kotlin.String | 
val createReturnRequest : CreateReturnRequest =  // CreateReturnRequest | 

val result : CreateReturn201Response = webService.createReturn(orderId, createReturnRequest)
```

### Parameters
| **orderId** | **kotlin.String**|  | |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **createReturnRequest** | [**CreateReturnRequest**](CreateReturnRequest.md)|  | |

### Return type

[**CreateReturn201Response**](CreateReturn201Response.md)

### Authorization


Configure bearerAuth:
    ApiClient().setBearerToken("TOKEN")

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


Nota fiscal (D1)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(PedidosPsCompraApi::class.java)
val orderId : kotlin.String = CB-001234 // kotlin.String | 

val result : GetInvoice200Response = webService.getInvoice(orderId)
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **orderId** | **kotlin.String**|  | |

### Return type

[**GetInvoice200Response**](GetInvoice200Response.md)

### Authorization


Configure bearerAuth:
    ApiClient().setBearerToken("TOKEN")

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


Detalhe do pedido (D1)

Suporta cache condicional (ETag/If-None-Match) para polling de status.

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(PedidosPsCompraApi::class.java)
val orderId : kotlin.String = CB-001234 // kotlin.String | 
val ifNoneMatch : kotlin.String = ifNoneMatch_example // kotlin.String | 

val result : GetOrder200Response = webService.getOrder(orderId, ifNoneMatch)
```

### Parameters
| **orderId** | **kotlin.String**|  | |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **ifNoneMatch** | **kotlin.String**|  | [optional] |

### Return type

[**GetOrder200Response**](GetOrder200Response.md)

### Authorization


Configure bearerAuth:
    ApiClient().setBearerToken("TOKEN")

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


Consultar devolução (D4)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(PedidosPsCompraApi::class.java)
val orderId : kotlin.String = CB-001234 // kotlin.String | 
val returnId : kotlin.String = returnId_example // kotlin.String | 

val result : GetReturn200Response = webService.getReturn(orderId, returnId)
```

### Parameters
| **orderId** | **kotlin.String**|  | |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **returnId** | **kotlin.String**|  | |

### Return type

[**GetReturn200Response**](GetReturn200Response.md)

### Authorization


Configure bearerAuth:
    ApiClient().setBearerToken("TOKEN")

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


Rastreamento (D2)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(PedidosPsCompraApi::class.java)
val orderId : kotlin.String = CB-001234 // kotlin.String | 

val result : GetTracking200Response = webService.getTracking(orderId)
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **orderId** | **kotlin.String**|  | |

### Return type

[**GetTracking200Response**](GetTracking200Response.md)

### Authorization


Configure bearerAuth:
    ApiClient().setBearerToken("TOKEN")

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


Listar pedidos

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(PedidosPsCompraApi::class.java)
val page : kotlin.Int = 56 // kotlin.Int | 
val pageSize : kotlin.Int = 56 // kotlin.Int | 
val status : OrderStatus =  // OrderStatus | 

val result : ListOrders200Response = webService.listOrders(page, pageSize, status)
```

### Parameters
| **page** | **kotlin.Int**|  | [optional] [default to 1] |
| **pageSize** | **kotlin.Int**|  | [optional] [default to 20] |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **status** | [**OrderStatus**](.md)|  | [optional] [enum: CONFIRMED, PREPARING, SHIPPED, DELIVERED, CANCELLED, RETURN_REQUESTED, RETURNED] |

### Return type

[**ListOrders200Response**](ListOrders200Response.md)

### Authorization


Configure bearerAuth:
    ApiClient().setBearerToken("TOKEN")

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

