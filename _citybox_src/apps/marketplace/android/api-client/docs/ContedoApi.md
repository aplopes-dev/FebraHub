# ContedoApi

All URIs are relative to *http://127.0.0.1:4010*

| Method | HTTP request | Description |
| ------------- | ------------- | ------------- |
| [**getBanners**](ContedoApi.md#getBanners) | **GET** content/banners | Banners promocionais (Home) |
| [**getHealth**](ContedoApi.md#getHealth) | **GET** health | Health check |
| [**getRoot**](ContedoApi.md#getRoot) | **GET**  | Raiz do mock local (smoke test) |
| [**getStaticPage**](ContedoApi.md#getStaticPage) | **GET** content/pages/{slug} | Página estática (B7) |



Banners promocionais (Home)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
val webService = apiClient.createWebservice(ContedoApi::class.java)

val result : GetBanners200Response = webService.getBanners()
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**GetBanners200Response**](GetBanners200Response.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


Health check

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
val webService = apiClient.createWebservice(ContedoApi::class.java)

val result : HealthResponse = webService.getHealth()
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**HealthResponse**](HealthResponse.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


Raiz do mock local (smoke test)

Resposta amigável ao abrir http://127.0.0.1:4010/ no navegador.

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
val webService = apiClient.createWebservice(ContedoApi::class.java)

val result : MockRootResponse = webService.getRoot()
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**MockRootResponse**](MockRootResponse.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


Página estática (B7)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
val webService = apiClient.createWebservice(ContedoApi::class.java)
val slug : kotlin.String = slug_example // kotlin.String | 

val result : GetStaticPage200Response = webService.getStaticPage(slug)
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **slug** | **kotlin.String**|  | [enum: about, terms, privacy] |

### Return type

[**GetStaticPage200Response**](GetStaticPage200Response.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

