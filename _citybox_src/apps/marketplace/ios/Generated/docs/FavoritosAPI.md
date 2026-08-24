# FavoritosAPI

All URIs are relative to *http://127.0.0.1:4010*

Method | HTTP request | Description
------------- | ------------- | -------------
[**listFavorites**](FavoritosAPI.md#listfavorites) | **GET** /me/favorites | Listar favoritos
[**toggleFavorite**](FavoritosAPI.md#togglefavorite) | **PUT** /me/favorites/{productId} | Toggle favorito


# **listFavorites**
```swift
    open class func listFavorites(completion: @escaping (_ data: ListFavorites200Response?, _ error: Error?) -> Void)
```

Listar favoritos

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI


// Listar favoritos
FavoritosAPI.listFavorites() { (response, error) in
    guard error == nil else {
        print(error)
        return
    }

    if (response) {
        dump(response)
    }
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**ListFavorites200Response**](ListFavorites200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **toggleFavorite**
```swift
    open class func toggleFavorite(productId: String, toggleFavoriteRequest: ToggleFavoriteRequest, completion: @escaping (_ data: ToggleFavorite200Response?, _ error: Error?) -> Void)
```

Toggle favorito

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI

let productId = "productId_example" // String | 
let toggleFavoriteRequest = toggleFavorite_request(isFavorite: false) // ToggleFavoriteRequest | 

// Toggle favorito
FavoritosAPI.toggleFavorite(productId: productId, toggleFavoriteRequest: toggleFavoriteRequest) { (response, error) in
    guard error == nil else {
        print(error)
        return
    }

    if (response) {
        dump(response)
    }
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **productId** | **String** |  | 
 **toggleFavoriteRequest** | [**ToggleFavoriteRequest**](ToggleFavoriteRequest.md) |  | 

### Return type

[**ToggleFavorite200Response**](ToggleFavorite200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

