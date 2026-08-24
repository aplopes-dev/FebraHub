# CatalogoAPI

All URIs are relative to *http://127.0.0.1:4010*

Method | HTTP request | Description
------------- | ------------- | -------------
[**addReviewPhoto**](CatalogoAPI.md#addreviewphoto) | **POST** /catalog/products/{productId}/reviews/{reviewId}/photos | Anexar foto a avaliação (D3)
[**addSearchHistory**](CatalogoAPI.md#addsearchhistory) | **POST** /me/search-history | Registrar busca (E4)
[**clearSearchHistory**](CatalogoAPI.md#clearsearchhistory) | **DELETE** /me/search-history | Limpar histórico (E4)
[**createReview**](CatalogoAPI.md#createreview) | **POST** /catalog/products/{productId}/reviews | Escrever avaliação (D3)
[**getCategoryProducts**](CatalogoAPI.md#getcategoryproducts) | **GET** /catalog/categories/{categoryId}/products | Produtos por categoria (E1)
[**getFiltersMetadata**](CatalogoAPI.md#getfiltersmetadata) | **GET** /catalog/filters/metadata | Metadados de filtros (E2)
[**getHome**](CatalogoAPI.md#gethome) | **GET** /catalog/home | Feed da Home (seções pré-montadas)
[**getProduct**](CatalogoAPI.md#getproduct) | **GET** /catalog/products/{productId} | Detalhe do produto (PDP)
[**getReviews**](CatalogoAPI.md#getreviews) | **GET** /catalog/products/{productId}/reviews | Avaliações do produto (E3)
[**getSearchHistory**](CatalogoAPI.md#getsearchhistory) | **GET** /me/search-history | Histórico de busca (E4)
[**listCategories**](CatalogoAPI.md#listcategories) | **GET** /catalog/categories | Listar categorias (E1)
[**searchProducts**](CatalogoAPI.md#searchproducts) | **GET** /catalog/search | Busca de produtos (E2/E4)
[**searchSuggestions**](CatalogoAPI.md#searchsuggestions) | **GET** /catalog/search/suggestions | Sugestões de busca (E4)


# **addReviewPhoto**
```swift
    open class func addReviewPhoto(productId: String, reviewId: String, file: URL? = nil, completion: @escaping (_ data: AddReviewPhoto201Response?, _ error: Error?) -> Void)
```

Anexar foto a avaliação (D3)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI

let productId = "productId_example" // String | 
let reviewId = "reviewId_example" // String | 
let file = URL(string: "https://example.com")! // URL |  (optional)

// Anexar foto a avaliação (D3)
CatalogoAPI.addReviewPhoto(productId: productId, reviewId: reviewId, file: file) { (response, error) in
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
 **reviewId** | **String** |  | 
 **file** | **URL** |  | [optional] 

### Return type

[**AddReviewPhoto201Response**](AddReviewPhoto201Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: multipart/form-data
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **addSearchHistory**
```swift
    open class func addSearchHistory(addSearchHistoryRequest: AddSearchHistoryRequest, completion: @escaping (_ data: SearchHistoryEnvelope?, _ error: Error?) -> Void)
```

Registrar busca (E4)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI

let addSearchHistoryRequest = addSearchHistory_request(query: "query_example") // AddSearchHistoryRequest | 

// Registrar busca (E4)
CatalogoAPI.addSearchHistory(addSearchHistoryRequest: addSearchHistoryRequest) { (response, error) in
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
 **addSearchHistoryRequest** | [**AddSearchHistoryRequest**](AddSearchHistoryRequest.md) |  | 

### Return type

[**SearchHistoryEnvelope**](SearchHistoryEnvelope.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **clearSearchHistory**
```swift
    open class func clearSearchHistory(completion: @escaping (_ data: Void?, _ error: Error?) -> Void)
```

Limpar histórico (E4)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI


// Limpar histórico (E4)
CatalogoAPI.clearSearchHistory() { (response, error) in
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

Void (empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **createReview**
```swift
    open class func createReview(productId: String, createReviewRequest: CreateReviewRequest, completion: @escaping (_ data: CreateReview201Response?, _ error: Error?) -> Void)
```

Escrever avaliação (D3)

Aceita JSON ou multipart (com fotos). `orderId` representa compra verificada — opcional quando criada via tela de Avaliações. 

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI

let productId = "productId_example" // String | 
let createReviewRequest = createReview_request(orderId: "orderId_example", rating: 123, text: "text_example", photoUrls: ["photoUrls_example"]) // CreateReviewRequest | 

// Escrever avaliação (D3)
CatalogoAPI.createReview(productId: productId, createReviewRequest: createReviewRequest) { (response, error) in
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
 **createReviewRequest** | [**CreateReviewRequest**](CreateReviewRequest.md) |  | 

### Return type

[**CreateReview201Response**](CreateReview201Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json, multipart/form-data
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getCategoryProducts**
```swift
    open class func getCategoryProducts(categoryId: String, page: Int? = nil, pageSize: Int? = nil, completion: @escaping (_ data: GetCategoryProducts200Response?, _ error: Error?) -> Void)
```

Produtos por categoria (E1)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI

let categoryId = "categoryId_example" // String | 
let page = 987 // Int |  (optional) (default to 1)
let pageSize = 987 // Int |  (optional) (default to 20)

// Produtos por categoria (E1)
CatalogoAPI.getCategoryProducts(categoryId: categoryId, page: page, pageSize: pageSize) { (response, error) in
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
 **categoryId** | **String** |  | 
 **page** | **Int** |  | [optional] [default to 1]
 **pageSize** | **Int** |  | [optional] [default to 20]

### Return type

[**GetCategoryProducts200Response**](GetCategoryProducts200Response.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getFiltersMetadata**
```swift
    open class func getFiltersMetadata(completion: @escaping (_ data: GetFiltersMetadata200Response?, _ error: Error?) -> Void)
```

Metadados de filtros (E2)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI


// Metadados de filtros (E2)
CatalogoAPI.getFiltersMetadata() { (response, error) in
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

[**GetFiltersMetadata200Response**](GetFiltersMetadata200Response.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getHome**
```swift
    open class func getHome(completion: @escaping (_ data: GetHome200Response?, _ error: Error?) -> Void)
```

Feed da Home (seções pré-montadas)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI


// Feed da Home (seções pré-montadas)
CatalogoAPI.getHome() { (response, error) in
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

[**GetHome200Response**](GetHome200Response.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getProduct**
```swift
    open class func getProduct(productId: String, completion: @escaping (_ data: GetProduct200Response?, _ error: Error?) -> Void)
```

Detalhe do produto (PDP)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI

let productId = "productId_example" // String | 

// Detalhe do produto (PDP)
CatalogoAPI.getProduct(productId: productId) { (response, error) in
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

### Return type

[**GetProduct200Response**](GetProduct200Response.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getReviews**
```swift
    open class func getReviews(productId: String, page: Int? = nil, pageSize: Int? = nil, completion: @escaping (_ data: GetReviews200Response?, _ error: Error?) -> Void)
```

Avaliações do produto (E3)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI

let productId = "productId_example" // String | 
let page = 987 // Int |  (optional) (default to 1)
let pageSize = 987 // Int |  (optional) (default to 20)

// Avaliações do produto (E3)
CatalogoAPI.getReviews(productId: productId, page: page, pageSize: pageSize) { (response, error) in
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
 **page** | **Int** |  | [optional] [default to 1]
 **pageSize** | **Int** |  | [optional] [default to 20]

### Return type

[**GetReviews200Response**](GetReviews200Response.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getSearchHistory**
```swift
    open class func getSearchHistory(completion: @escaping (_ data: SearchHistoryEnvelope?, _ error: Error?) -> Void)
```

Histórico de busca (E4)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI


// Histórico de busca (E4)
CatalogoAPI.getSearchHistory() { (response, error) in
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

[**SearchHistoryEnvelope**](SearchHistoryEnvelope.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **listCategories**
```swift
    open class func listCategories(completion: @escaping (_ data: ListCategories200Response?, _ error: Error?) -> Void)
```

Listar categorias (E1)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI


// Listar categorias (E1)
CatalogoAPI.listCategories() { (response, error) in
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

[**ListCategories200Response**](ListCategories200Response.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **searchProducts**
```swift
    open class func searchProducts(q: String? = nil, minPrice: Double? = nil, maxPrice: Double? = nil, minRating: Double? = nil, freeShipping: Bool? = nil, express: Bool? = nil, brand: String? = nil, sortBy: SortOption? = nil, page: Int? = nil, pageSize: Int? = nil, completion: @escaping (_ data: SearchProducts200Response?, _ error: Error?) -> Void)
```

Busca de produtos (E2/E4)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI

let q = "q_example" // String |  (optional)
let minPrice = 987 // Double |  (optional)
let maxPrice = 987 // Double |  (optional)
let minRating = 987 // Double |  (optional)
let freeShipping = true // Bool |  (optional)
let express = true // Bool |  (optional)
let brand = "brand_example" // String |  (optional)
let sortBy = SortOption() // SortOption |  (optional)
let page = 987 // Int |  (optional) (default to 1)
let pageSize = 987 // Int |  (optional) (default to 20)

// Busca de produtos (E2/E4)
CatalogoAPI.searchProducts(q: q, minPrice: minPrice, maxPrice: maxPrice, minRating: minRating, freeShipping: freeShipping, express: express, brand: brand, sortBy: sortBy, page: page, pageSize: pageSize) { (response, error) in
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
 **q** | **String** |  | [optional] 
 **minPrice** | **Double** |  | [optional] 
 **maxPrice** | **Double** |  | [optional] 
 **minRating** | **Double** |  | [optional] 
 **freeShipping** | **Bool** |  | [optional] 
 **express** | **Bool** |  | [optional] 
 **brand** | **String** |  | [optional] 
 **sortBy** | [**SortOption**](.md) |  | [optional] 
 **page** | **Int** |  | [optional] [default to 1]
 **pageSize** | **Int** |  | [optional] [default to 20]

### Return type

[**SearchProducts200Response**](SearchProducts200Response.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **searchSuggestions**
```swift
    open class func searchSuggestions(q: String? = nil, completion: @escaping (_ data: SearchSuggestions200Response?, _ error: Error?) -> Void)
```

Sugestões de busca (E4)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI

let q = "q_example" // String |  (optional)

// Sugestões de busca (E4)
CatalogoAPI.searchSuggestions(q: q) { (response, error) in
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
 **q** | **String** |  | [optional] 

### Return type

[**SearchSuggestions200Response**](SearchSuggestions200Response.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

