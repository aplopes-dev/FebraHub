# AssinaturaApi

All URIs are relative to *http://127.0.0.1:4010*

| Method | HTTP request | Description |
| ------------- | ------------- | ------------- |
| [**cancelSubscription**](AssinaturaApi.md#cancelSubscription) | **POST** me/subscription/cancel | Cancelar assinatura (B8) |
| [**getSubscription**](AssinaturaApi.md#getSubscription) | **GET** me/subscription | Assinatura CityBox+ (B8) |



Cancelar assinatura (B8)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(AssinaturaApi::class.java)
val cancelSubscriptionRequest : CancelSubscriptionRequest =  // CancelSubscriptionRequest | 

val result : CancelSubscription200Response = webService.cancelSubscription(cancelSubscriptionRequest)
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **cancelSubscriptionRequest** | [**CancelSubscriptionRequest**](CancelSubscriptionRequest.md)|  | [optional] |

### Return type

[**CancelSubscription200Response**](CancelSubscription200Response.md)

### Authorization


Configure bearerAuth:
    ApiClient().setBearerToken("TOKEN")

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


Assinatura CityBox+ (B8)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(AssinaturaApi::class.java)

val result : GetSubscription200Response = webService.getSubscription()
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**GetSubscription200Response**](GetSubscription200Response.md)

### Authorization


Configure bearerAuth:
    ApiClient().setBearerToken("TOKEN")

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

