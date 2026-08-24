# FavoritosApi

All URIs are relative to *http://127.0.0.1:4010*

| Method | HTTP request | Description |
| ------------- | ------------- | ------------- |
| [**listFavorites**](FavoritosApi.md#listFavorites) | **GET** me/favorites | Listar favoritos |
| [**toggleFavorite**](FavoritosApi.md#toggleFavorite) | **PUT** me/favorites/{productId} | Toggle favorito |



Listar favoritos

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(FavoritosApi::class.java)

val result : ListFavorites200Response = webService.listFavorites()
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**ListFavorites200Response**](ListFavorites200Response.md)

### Authorization


Configure bearerAuth:
    ApiClient().setBearerToken("TOKEN")

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


Toggle favorito

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(FavoritosApi::class.java)
val productId : kotlin.String = iphone15pro // kotlin.String | 
val toggleFavoriteRequest : ToggleFavoriteRequest =  // ToggleFavoriteRequest | 

val result : ToggleFavorite200Response = webService.toggleFavorite(productId, toggleFavoriteRequest)
```

### Parameters
| **productId** | **kotlin.String**|  | |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **toggleFavoriteRequest** | [**ToggleFavoriteRequest**](ToggleFavoriteRequest.md)|  | |

### Return type

[**ToggleFavorite200Response**](ToggleFavorite200Response.md)

### Authorization


Configure bearerAuth:
    ApiClient().setBearerToken("TOKEN")

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

