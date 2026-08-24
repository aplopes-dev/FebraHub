# ContedoAPI

All URIs are relative to *http://127.0.0.1:4010*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getBanners**](ContedoAPI.md#getbanners) | **GET** /content/banners | Banners promocionais (Home)
[**getHealth**](ContedoAPI.md#gethealth) | **GET** /health | Health check
[**getRoot**](ContedoAPI.md#getroot) | **GET** / | Raiz do mock local (smoke test)
[**getStaticPage**](ContedoAPI.md#getstaticpage) | **GET** /content/pages/{slug} | Página estática (B7)


# **getBanners**
```swift
    open class func getBanners(completion: @escaping (_ data: GetBanners200Response?, _ error: Error?) -> Void)
```

Banners promocionais (Home)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI


// Banners promocionais (Home)
ContedoAPI.getBanners() { (response, error) in
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

[**GetBanners200Response**](GetBanners200Response.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getHealth**
```swift
    open class func getHealth(completion: @escaping (_ data: HealthResponse?, _ error: Error?) -> Void)
```

Health check

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI


// Health check
ContedoAPI.getHealth() { (response, error) in
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

[**HealthResponse**](HealthResponse.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getRoot**
```swift
    open class func getRoot(completion: @escaping (_ data: MockRootResponse?, _ error: Error?) -> Void)
```

Raiz do mock local (smoke test)

Resposta amigável ao abrir http://127.0.0.1:4010/ no navegador.

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI


// Raiz do mock local (smoke test)
ContedoAPI.getRoot() { (response, error) in
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

[**MockRootResponse**](MockRootResponse.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getStaticPage**
```swift
    open class func getStaticPage(slug: Slug_getStaticPage, completion: @escaping (_ data: GetStaticPage200Response?, _ error: Error?) -> Void)
```

Página estática (B7)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI

let slug = "slug_example" // String | 

// Página estática (B7)
ContedoAPI.getStaticPage(slug: slug) { (response, error) in
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
 **slug** | **String** |  | 

### Return type

[**GetStaticPage200Response**](GetStaticPage200Response.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

