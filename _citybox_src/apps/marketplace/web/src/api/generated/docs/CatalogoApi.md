# CatalogoApi

All URIs are relative to *http://127.0.0.1:4010*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**addReviewPhoto**](CatalogoApi.md#addreviewphoto) | **POST** /catalog/products/{productId}/reviews/{reviewId}/photos | Anexar foto a avaliação (D3) |
| [**addSearchHistory**](CatalogoApi.md#addsearchhistoryoperation) | **POST** /me/search-history | Registrar busca (E4) |
| [**clearSearchHistory**](CatalogoApi.md#clearsearchhistory) | **DELETE** /me/search-history | Limpar histórico (E4) |
| [**createReview**](CatalogoApi.md#createreviewoperation) | **POST** /catalog/products/{productId}/reviews | Escrever avaliação (D3) |
| [**getCategoryProducts**](CatalogoApi.md#getcategoryproducts) | **GET** /catalog/categories/{categoryId}/products | Produtos por categoria (E1) |
| [**getFiltersMetadata**](CatalogoApi.md#getfiltersmetadata) | **GET** /catalog/filters/metadata | Metadados de filtros (E2) |
| [**getHome**](CatalogoApi.md#gethome) | **GET** /catalog/home | Feed da Home (seções pré-montadas) |
| [**getProduct**](CatalogoApi.md#getproduct) | **GET** /catalog/products/{productId} | Detalhe do produto (PDP) |
| [**getReviews**](CatalogoApi.md#getreviews) | **GET** /catalog/products/{productId}/reviews | Avaliações do produto (E3) |
| [**getSearchHistory**](CatalogoApi.md#getsearchhistory) | **GET** /me/search-history | Histórico de busca (E4) |
| [**listCategories**](CatalogoApi.md#listcategories) | **GET** /catalog/categories | Listar categorias (E1) |
| [**searchProducts**](CatalogoApi.md#searchproducts) | **GET** /catalog/search | Busca de produtos (E2/E4) |
| [**searchSuggestions**](CatalogoApi.md#searchsuggestions) | **GET** /catalog/search/suggestions | Sugestões de busca (E4) |



## addReviewPhoto

> AddReviewPhoto201Response addReviewPhoto(productId, reviewId, file)

Anexar foto a avaliação (D3)

### Example

```ts
import {
  Configuration,
  CatalogoApi,
} from '@citybox/api-client';
import type { AddReviewPhotoRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new CatalogoApi(config);

  const body = {
    // string
    productId: iphone15pro,
    // string
    reviewId: reviewId_example,
    // Blob (optional)
    file: BINARY_DATA_HERE,
  } satisfies AddReviewPhotoRequest;

  try {
    const data = await api.addReviewPhoto(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **productId** | `string` |  | [Defaults to `undefined`] |
| **reviewId** | `string` |  | [Defaults to `undefined`] |
| **file** | `Blob` |  | [Optional] [Defaults to `undefined`] |

### Return type

[**AddReviewPhoto201Response**](AddReviewPhoto201Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `multipart/form-data`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** | Foto anexada |  -  |
| **401** | Token inválido ou expirado |  -  |
| **404** | Recurso não encontrado |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## addSearchHistory

> SearchHistoryEnvelope addSearchHistory(addSearchHistoryRequest)

Registrar busca (E4)

### Example

```ts
import {
  Configuration,
  CatalogoApi,
} from '@citybox/api-client';
import type { AddSearchHistoryOperationRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new CatalogoApi(config);

  const body = {
    // AddSearchHistoryRequest
    addSearchHistoryRequest: ...,
  } satisfies AddSearchHistoryOperationRequest;

  try {
    const data = await api.addSearchHistory(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **addSearchHistoryRequest** | [AddSearchHistoryRequest](AddSearchHistoryRequest.md) |  | |

### Return type

[**SearchHistoryEnvelope**](SearchHistoryEnvelope.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** | Histórico atualizado (máx. 10, dedup) |  -  |
| **401** | Token inválido ou expirado |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## clearSearchHistory

> clearSearchHistory()

Limpar histórico (E4)

### Example

```ts
import {
  Configuration,
  CatalogoApi,
} from '@citybox/api-client';
import type { ClearSearchHistoryRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new CatalogoApi(config);

  try {
    const data = await api.clearSearchHistory();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

`void` (Empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **204** | Histórico limpo |  -  |
| **401** | Token inválido ou expirado |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## createReview

> CreateReview201Response createReview(productId, createReviewRequest)

Escrever avaliação (D3)

Aceita JSON ou multipart (com fotos). &#x60;orderId&#x60; representa compra verificada — opcional quando criada via tela de Avaliações. 

### Example

```ts
import {
  Configuration,
  CatalogoApi,
} from '@citybox/api-client';
import type { CreateReviewOperationRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new CatalogoApi(config);

  const body = {
    // string
    productId: iphone15pro,
    // CreateReviewRequest
    createReviewRequest: ...,
  } satisfies CreateReviewOperationRequest;

  try {
    const data = await api.createReview(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **productId** | `string` |  | [Defaults to `undefined`] |
| **createReviewRequest** | [CreateReviewRequest](CreateReviewRequest.md) |  | |

### Return type

[**CreateReview201Response**](CreateReview201Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `multipart/form-data`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** | Avaliação criada |  -  |
| **401** | Token inválido ou expirado |  -  |
| **404** | Recurso não encontrado |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getCategoryProducts

> GetCategoryProducts200Response getCategoryProducts(categoryId, page, pageSize)

Produtos por categoria (E1)

### Example

```ts
import {
  Configuration,
  CatalogoApi,
} from '@citybox/api-client';
import type { GetCategoryProductsRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const api = new CatalogoApi();

  const body = {
    // string
    categoryId: tecnologia,
    // number (optional)
    page: 56,
    // number (optional)
    pageSize: 56,
  } satisfies GetCategoryProductsRequest;

  try {
    const data = await api.getCategoryProducts(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **categoryId** | `string` |  | [Defaults to `undefined`] |
| **page** | `number` |  | [Optional] [Defaults to `1`] |
| **pageSize** | `number` |  | [Optional] [Defaults to `20`] |

### Return type

[**GetCategoryProducts200Response**](GetCategoryProducts200Response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Categoria + produtos |  -  |
| **404** | Recurso não encontrado |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getFiltersMetadata

> GetFiltersMetadata200Response getFiltersMetadata()

Metadados de filtros (E2)

### Example

```ts
import {
  Configuration,
  CatalogoApi,
} from '@citybox/api-client';
import type { GetFiltersMetadataRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const api = new CatalogoApi();

  try {
    const data = await api.getFiltersMetadata();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**GetFiltersMetadata200Response**](GetFiltersMetadata200Response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Marcas, faixas, ordenações, flags |  -  |
| **400** | Requisição inválida (parâmetros malformados) |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getHome

> GetHome200Response getHome()

Feed da Home (seções pré-montadas)

### Example

```ts
import {
  Configuration,
  CatalogoApi,
} from '@citybox/api-client';
import type { GetHomeRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const api = new CatalogoApi();

  try {
    const data = await api.getHome();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**GetHome200Response**](GetHome200Response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Seções + produtos |  -  |
| **400** | Requisição inválida (parâmetros malformados) |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getProduct

> GetProduct200Response getProduct(productId)

Detalhe do produto (PDP)

### Example

```ts
import {
  Configuration,
  CatalogoApi,
} from '@citybox/api-client';
import type { GetProductRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const api = new CatalogoApi();

  const body = {
    // string
    productId: iphone15pro,
  } satisfies GetProductRequest;

  try {
    const data = await api.getProduct(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **productId** | `string` |  | [Defaults to `undefined`] |

### Return type

[**GetProduct200Response**](GetProduct200Response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Produto + parcelamento |  -  |
| **404** | Recurso não encontrado |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getReviews

> GetReviews200Response getReviews(productId, page, pageSize)

Avaliações do produto (E3)

### Example

```ts
import {
  Configuration,
  CatalogoApi,
} from '@citybox/api-client';
import type { GetReviewsRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const api = new CatalogoApi();

  const body = {
    // string
    productId: iphone15pro,
    // number (optional)
    page: 56,
    // number (optional)
    pageSize: 56,
  } satisfies GetReviewsRequest;

  try {
    const data = await api.getReviews(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **productId** | `string` |  | [Defaults to `undefined`] |
| **page** | `number` |  | [Optional] [Defaults to `1`] |
| **pageSize** | `number` |  | [Optional] [Defaults to `20`] |

### Return type

[**GetReviews200Response**](GetReviews200Response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Média, distribuição e lista |  -  |
| **404** | Recurso não encontrado |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getSearchHistory

> SearchHistoryEnvelope getSearchHistory()

Histórico de busca (E4)

### Example

```ts
import {
  Configuration,
  CatalogoApi,
} from '@citybox/api-client';
import type { GetSearchHistoryRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new CatalogoApi(config);

  try {
    const data = await api.getSearchHistory();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**SearchHistoryEnvelope**](SearchHistoryEnvelope.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Buscas recentes |  -  |
| **401** | Token inválido ou expirado |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## listCategories

> ListCategories200Response listCategories()

Listar categorias (E1)

### Example

```ts
import {
  Configuration,
  CatalogoApi,
} from '@citybox/api-client';
import type { ListCategoriesRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const api = new CatalogoApi();

  try {
    const data = await api.listCategories();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**ListCategories200Response**](ListCategories200Response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Categorias |  -  |
| **400** | Requisição inválida (parâmetros malformados) |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## searchProducts

> SearchProducts200Response searchProducts(q, minPrice, maxPrice, minRating, freeShipping, express, brand, sortBy, page, pageSize)

Busca de produtos (E2/E4)

### Example

```ts
import {
  Configuration,
  CatalogoApi,
} from '@citybox/api-client';
import type { SearchProductsRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const api = new CatalogoApi();

  const body = {
    // string (optional)
    q: q_example,
    // number (optional)
    minPrice: 8.14,
    // number (optional)
    maxPrice: 8.14,
    // number (optional)
    minRating: 8.14,
    // boolean (optional)
    freeShipping: true,
    // boolean (optional)
    express: true,
    // string (optional)
    brand: brand_example,
    // SortOption (optional)
    sortBy: ...,
    // number (optional)
    page: 56,
    // number (optional)
    pageSize: 56,
  } satisfies SearchProductsRequest;

  try {
    const data = await api.searchProducts(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **q** | `string` |  | [Optional] [Defaults to `undefined`] |
| **minPrice** | `number` |  | [Optional] [Defaults to `undefined`] |
| **maxPrice** | `number` |  | [Optional] [Defaults to `undefined`] |
| **minRating** | `number` |  | [Optional] [Defaults to `undefined`] |
| **freeShipping** | `boolean` |  | [Optional] [Defaults to `undefined`] |
| **express** | `boolean` |  | [Optional] [Defaults to `undefined`] |
| **brand** | `string` |  | [Optional] [Defaults to `undefined`] |
| **sortBy** | `SortOption` |  | [Optional] [Defaults to `undefined`] [Enum: RELEVANCE, PRICE_ASC, PRICE_DESC, BEST_SELLERS] |
| **page** | `number` |  | [Optional] [Defaults to `1`] |
| **pageSize** | `number` |  | [Optional] [Defaults to `20`] |

### Return type

[**SearchProducts200Response**](SearchProducts200Response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Resultados |  -  |
| **400** | Requisição inválida (parâmetros malformados) |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## searchSuggestions

> SearchSuggestions200Response searchSuggestions(q)

Sugestões de busca (E4)

### Example

```ts
import {
  Configuration,
  CatalogoApi,
} from '@citybox/api-client';
import type { SearchSuggestionsRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const api = new CatalogoApi();

  const body = {
    // string (optional)
    q: q_example,
  } satisfies SearchSuggestionsRequest;

  try {
    const data = await api.searchSuggestions(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **q** | `string` |  | [Optional] [Defaults to `undefined`] |

### Return type

[**SearchSuggestions200Response**](SearchSuggestions200Response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Sugestões + marcas |  -  |
| **400** | Requisição inválida (parâmetros malformados) |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

