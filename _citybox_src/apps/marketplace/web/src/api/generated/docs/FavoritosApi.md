# FavoritosApi

All URIs are relative to *http://127.0.0.1:4010*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**listFavorites**](FavoritosApi.md#listfavorites) | **GET** /me/favorites | Listar favoritos |
| [**toggleFavorite**](FavoritosApi.md#togglefavoriteoperation) | **PUT** /me/favorites/{productId} | Toggle favorito |



## listFavorites

> ListFavorites200Response listFavorites()

Listar favoritos

### Example

```ts
import {
  Configuration,
  FavoritosApi,
} from '@citybox/api-client';
import type { ListFavoritesRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new FavoritosApi(config);

  try {
    const data = await api.listFavorites();
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

[**ListFavorites200Response**](ListFavorites200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | IDs + produtos favoritos |  -  |
| **401** | Token inválido ou expirado |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## toggleFavorite

> ToggleFavorite200Response toggleFavorite(productId, toggleFavoriteRequest)

Toggle favorito

### Example

```ts
import {
  Configuration,
  FavoritosApi,
} from '@citybox/api-client';
import type { ToggleFavoriteOperationRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new FavoritosApi(config);

  const body = {
    // string
    productId: iphone15pro,
    // ToggleFavoriteRequest
    toggleFavoriteRequest: ...,
  } satisfies ToggleFavoriteOperationRequest;

  try {
    const data = await api.toggleFavorite(body);
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
| **toggleFavoriteRequest** | [ToggleFavoriteRequest](ToggleFavoriteRequest.md) |  | |

### Return type

[**ToggleFavorite200Response**](ToggleFavorite200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Estado atualizado |  -  |
| **401** | Token inválido ou expirado |  -  |
| **404** | Recurso não encontrado |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

