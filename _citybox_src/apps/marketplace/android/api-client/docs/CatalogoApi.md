# CatalogoApi

All URIs are relative to *http://127.0.0.1:4010*

| Method | HTTP request | Description |
| ------------- | ------------- | ------------- |
| [**addReviewPhoto**](CatalogoApi.md#addReviewPhoto) | **POST** catalog/products/{productId}/reviews/{reviewId}/photos | Anexar foto a avaliação (D3) |
| [**addSearchHistory**](CatalogoApi.md#addSearchHistory) | **POST** me/search-history | Registrar busca (E4) |
| [**clearSearchHistory**](CatalogoApi.md#clearSearchHistory) | **DELETE** me/search-history | Limpar histórico (E4) |
| [**createReview**](CatalogoApi.md#createReview) | **POST** catalog/products/{productId}/reviews | Escrever avaliação (D3) |
| [**getCategoryProducts**](CatalogoApi.md#getCategoryProducts) | **GET** catalog/categories/{categoryId}/products | Produtos por categoria (E1) |
| [**getFiltersMetadata**](CatalogoApi.md#getFiltersMetadata) | **GET** catalog/filters/metadata | Metadados de filtros (E2) |
| [**getHome**](CatalogoApi.md#getHome) | **GET** catalog/home | Feed da Home (seções pré-montadas) |
| [**getProduct**](CatalogoApi.md#getProduct) | **GET** catalog/products/{productId} | Detalhe do produto (PDP) |
| [**getReviews**](CatalogoApi.md#getReviews) | **GET** catalog/products/{productId}/reviews | Avaliações do produto (E3) |
| [**getSearchHistory**](CatalogoApi.md#getSearchHistory) | **GET** me/search-history | Histórico de busca (E4) |
| [**listCategories**](CatalogoApi.md#listCategories) | **GET** catalog/categories | Listar categorias (E1) |
| [**searchProducts**](CatalogoApi.md#searchProducts) | **GET** catalog/search | Busca de produtos (E2/E4) |
| [**searchSuggestions**](CatalogoApi.md#searchSuggestions) | **GET** catalog/search/suggestions | Sugestões de busca (E4) |



Anexar foto a avaliação (D3)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(CatalogoApi::class.java)
val productId : kotlin.String = iphone15pro // kotlin.String | 
val reviewId : kotlin.String = reviewId_example // kotlin.String | 
val file : java.io.File = BINARY_DATA_HERE // java.io.File | 

val result : AddReviewPhoto201Response = webService.addReviewPhoto(productId, reviewId, file)
```

### Parameters
| **productId** | **kotlin.String**|  | |
| **reviewId** | **kotlin.String**|  | |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **file** | **java.io.File**|  | [optional] |

### Return type

[**AddReviewPhoto201Response**](AddReviewPhoto201Response.md)

### Authorization


Configure bearerAuth:
    ApiClient().setBearerToken("TOKEN")

### HTTP request headers

 - **Content-Type**: multipart/form-data
 - **Accept**: application/json


Registrar busca (E4)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(CatalogoApi::class.java)
val addSearchHistoryRequest : AddSearchHistoryRequest =  // AddSearchHistoryRequest | 

val result : SearchHistoryEnvelope = webService.addSearchHistory(addSearchHistoryRequest)
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **addSearchHistoryRequest** | [**AddSearchHistoryRequest**](AddSearchHistoryRequest.md)|  | |

### Return type

[**SearchHistoryEnvelope**](SearchHistoryEnvelope.md)

### Authorization


Configure bearerAuth:
    ApiClient().setBearerToken("TOKEN")

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


Limpar histórico (E4)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(CatalogoApi::class.java)

webService.clearSearchHistory()
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


Escrever avaliação (D3)

Aceita JSON ou multipart (com fotos). &#x60;orderId&#x60; representa compra verificada — opcional quando criada via tela de Avaliações. 

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(CatalogoApi::class.java)
val productId : kotlin.String = iphone15pro // kotlin.String | 
val createReviewRequest : CreateReviewRequest =  // CreateReviewRequest | 

val result : CreateReview201Response = webService.createReview(productId, createReviewRequest)
```

### Parameters
| **productId** | **kotlin.String**|  | |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **createReviewRequest** | [**CreateReviewRequest**](CreateReviewRequest.md)|  | |

### Return type

[**CreateReview201Response**](CreateReview201Response.md)

### Authorization


Configure bearerAuth:
    ApiClient().setBearerToken("TOKEN")

### HTTP request headers

 - **Content-Type**: application/json, multipart/form-data
 - **Accept**: application/json


Produtos por categoria (E1)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
val webService = apiClient.createWebservice(CatalogoApi::class.java)
val categoryId : kotlin.String = tecnologia // kotlin.String | 
val page : kotlin.Int = 56 // kotlin.Int | 
val pageSize : kotlin.Int = 56 // kotlin.Int | 

val result : GetCategoryProducts200Response = webService.getCategoryProducts(categoryId, page, pageSize)
```

### Parameters
| **categoryId** | **kotlin.String**|  | |
| **page** | **kotlin.Int**|  | [optional] [default to 1] |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **pageSize** | **kotlin.Int**|  | [optional] [default to 20] |

### Return type

[**GetCategoryProducts200Response**](GetCategoryProducts200Response.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


Metadados de filtros (E2)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
val webService = apiClient.createWebservice(CatalogoApi::class.java)

val result : GetFiltersMetadata200Response = webService.getFiltersMetadata()
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


Feed da Home (seções pré-montadas)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
val webService = apiClient.createWebservice(CatalogoApi::class.java)

val result : GetHome200Response = webService.getHome()
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


Detalhe do produto (PDP)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
val webService = apiClient.createWebservice(CatalogoApi::class.java)
val productId : kotlin.String = iphone15pro // kotlin.String | 

val result : GetProduct200Response = webService.getProduct(productId)
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **productId** | **kotlin.String**|  | |

### Return type

[**GetProduct200Response**](GetProduct200Response.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


Avaliações do produto (E3)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
val webService = apiClient.createWebservice(CatalogoApi::class.java)
val productId : kotlin.String = iphone15pro // kotlin.String | 
val page : kotlin.Int = 56 // kotlin.Int | 
val pageSize : kotlin.Int = 56 // kotlin.Int | 

val result : GetReviews200Response = webService.getReviews(productId, page, pageSize)
```

### Parameters
| **productId** | **kotlin.String**|  | |
| **page** | **kotlin.Int**|  | [optional] [default to 1] |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **pageSize** | **kotlin.Int**|  | [optional] [default to 20] |

### Return type

[**GetReviews200Response**](GetReviews200Response.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


Histórico de busca (E4)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(CatalogoApi::class.java)

val result : SearchHistoryEnvelope = webService.getSearchHistory()
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**SearchHistoryEnvelope**](SearchHistoryEnvelope.md)

### Authorization


Configure bearerAuth:
    ApiClient().setBearerToken("TOKEN")

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


Listar categorias (E1)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
val webService = apiClient.createWebservice(CatalogoApi::class.java)

val result : ListCategories200Response = webService.listCategories()
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


Busca de produtos (E2/E4)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
val webService = apiClient.createWebservice(CatalogoApi::class.java)
val q : kotlin.String = q_example // kotlin.String | 
val minPrice : java.math.BigDecimal = 8.14 // java.math.BigDecimal | 
val maxPrice : java.math.BigDecimal = 8.14 // java.math.BigDecimal | 
val minRating : java.math.BigDecimal = 8.14 // java.math.BigDecimal | 
val freeShipping : kotlin.Boolean = true // kotlin.Boolean | 
val express : kotlin.Boolean = true // kotlin.Boolean | 
val brand : kotlin.String = brand_example // kotlin.String | 
val sortBy : SortOption =  // SortOption | 
val page : kotlin.Int = 56 // kotlin.Int | 
val pageSize : kotlin.Int = 56 // kotlin.Int | 

val result : SearchProducts200Response = webService.searchProducts(q, minPrice, maxPrice, minRating, freeShipping, express, brand, sortBy, page, pageSize)
```

### Parameters
| **q** | **kotlin.String**|  | [optional] |
| **minPrice** | **java.math.BigDecimal**|  | [optional] |
| **maxPrice** | **java.math.BigDecimal**|  | [optional] |
| **minRating** | **java.math.BigDecimal**|  | [optional] |
| **freeShipping** | **kotlin.Boolean**|  | [optional] |
| **express** | **kotlin.Boolean**|  | [optional] |
| **brand** | **kotlin.String**|  | [optional] |
| **sortBy** | [**SortOption**](.md)|  | [optional] [enum: RELEVANCE, PRICE_ASC, PRICE_DESC, BEST_SELLERS] |
| **page** | **kotlin.Int**|  | [optional] [default to 1] |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **pageSize** | **kotlin.Int**|  | [optional] [default to 20] |

### Return type

[**SearchProducts200Response**](SearchProducts200Response.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


Sugestões de busca (E4)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
val webService = apiClient.createWebservice(CatalogoApi::class.java)
val q : kotlin.String = q_example // kotlin.String | 

val result : SearchSuggestions200Response = webService.searchSuggestions(q)
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **q** | **kotlin.String**|  | [optional] |

### Return type

[**SearchSuggestions200Response**](SearchSuggestions200Response.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

