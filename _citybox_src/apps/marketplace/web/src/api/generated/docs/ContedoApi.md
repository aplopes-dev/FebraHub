# ContedoApi

All URIs are relative to *http://127.0.0.1:4010*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**getBanners**](ContedoApi.md#getbanners) | **GET** /content/banners | Banners promocionais (Home) |
| [**getHealth**](ContedoApi.md#gethealth) | **GET** /health | Health check |
| [**getRoot**](ContedoApi.md#getroot) | **GET** / | Raiz do mock local (smoke test) |
| [**getStaticPage**](ContedoApi.md#getstaticpage) | **GET** /content/pages/{slug} | Página estática (B7) |



## getBanners

> GetBanners200Response getBanners()

Banners promocionais (Home)

### Example

```ts
import {
  Configuration,
  ContedoApi,
} from '@citybox/api-client';
import type { GetBannersRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const api = new ContedoApi();

  try {
    const data = await api.getBanners();
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

[**GetBanners200Response**](GetBanners200Response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Banners |  -  |
| **400** | Requisição inválida (parâmetros malformados) |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getHealth

> HealthResponse getHealth()

Health check

### Example

```ts
import {
  Configuration,
  ContedoApi,
} from '@citybox/api-client';
import type { GetHealthRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const api = new ContedoApi();

  try {
    const data = await api.getHealth();
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

[**HealthResponse**](HealthResponse.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Serviço disponível |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getRoot

> MockRootResponse getRoot()

Raiz do mock local (smoke test)

Resposta amigável ao abrir http://127.0.0.1:4010/ no navegador.

### Example

```ts
import {
  Configuration,
  ContedoApi,
} from '@citybox/api-client';
import type { GetRootRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const api = new ContedoApi();

  try {
    const data = await api.getRoot();
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

[**MockRootResponse**](MockRootResponse.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Mock ativo |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getStaticPage

> GetStaticPage200Response getStaticPage(slug)

Página estática (B7)

### Example

```ts
import {
  Configuration,
  ContedoApi,
} from '@citybox/api-client';
import type { GetStaticPageRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const api = new ContedoApi();

  const body = {
    // 'about' | 'terms' | 'privacy'
    slug: slug_example,
  } satisfies GetStaticPageRequest;

  try {
    const data = await api.getStaticPage(body);
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
| **slug** | `about`, `terms`, `privacy` |  | [Defaults to `undefined`] [Enum: about, terms, privacy] |

### Return type

[**GetStaticPage200Response**](GetStaticPage200Response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Página |  -  |
| **404** | Recurso não encontrado |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

