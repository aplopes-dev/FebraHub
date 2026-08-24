# PagamentosApi

All URIs are relative to *http://127.0.0.1:4010*

| Method | HTTP request | Description |
| ------------- | ------------- | ------------- |
| [**createPaymentMethod**](PagamentosApi.md#createPaymentMethod) | **POST** me/payment-methods | Adicionar cartão (B5) |
| [**deletePaymentMethod**](PagamentosApi.md#deletePaymentMethod) | **DELETE** me/payment-methods/{paymentMethodId} | Excluir cartão (B4) |
| [**listPaymentMethods**](PagamentosApi.md#listPaymentMethods) | **GET** me/payment-methods | Listar cartões (B4) |
| [**setDefaultPaymentMethod**](PagamentosApi.md#setDefaultPaymentMethod) | **PATCH** me/payment-methods/{paymentMethodId}/default | Definir cartão padrão (B4/C5) |



Adicionar cartão (B5)

Backend tokeniza via gateway. Nunca persistir PAN/CVV em claro.

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(PagamentosApi::class.java)
val createPaymentMethodRequest : CreatePaymentMethodRequest =  // CreatePaymentMethodRequest | 

val result : CreatePaymentMethod201Response = webService.createPaymentMethod(createPaymentMethodRequest)
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **createPaymentMethodRequest** | [**CreatePaymentMethodRequest**](CreatePaymentMethodRequest.md)|  | |

### Return type

[**CreatePaymentMethod201Response**](CreatePaymentMethod201Response.md)

### Authorization


Configure bearerAuth:
    ApiClient().setBearerToken("TOKEN")

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


Excluir cartão (B4)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(PagamentosApi::class.java)
val paymentMethodId : kotlin.String = card-1 // kotlin.String | 

webService.deletePaymentMethod(paymentMethodId)
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **paymentMethodId** | **kotlin.String**|  | |

### Return type

null (empty response body)

### Authorization


Configure bearerAuth:
    ApiClient().setBearerToken("TOKEN")

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


Listar cartões (B4)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(PagamentosApi::class.java)

val result : ListPaymentMethods200Response = webService.listPaymentMethods()
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**ListPaymentMethods200Response**](ListPaymentMethods200Response.md)

### Authorization


Configure bearerAuth:
    ApiClient().setBearerToken("TOKEN")

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


Definir cartão padrão (B4/C5)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(PagamentosApi::class.java)
val paymentMethodId : kotlin.String = card-1 // kotlin.String | 

val result : SetDefaultPaymentMethod200Response = webService.setDefaultPaymentMethod(paymentMethodId)
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **paymentMethodId** | **kotlin.String**|  | |

### Return type

[**SetDefaultPaymentMethod200Response**](SetDefaultPaymentMethod200Response.md)

### Authorization


Configure bearerAuth:
    ApiClient().setBearerToken("TOKEN")

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

