# EnderecosApi

All URIs are relative to *http://127.0.0.1:4010*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**createAddress**](EnderecosApi.md#createaddress) | **POST** /me/addresses | Criar endereço (B3) |
| [**deleteAddress**](EnderecosApi.md#deleteaddress) | **DELETE** /me/addresses/{addressId} | Excluir endereço (B2) |
| [**listAddresses**](EnderecosApi.md#listaddresses) | **GET** /me/addresses | Listar endereços (B2) |
| [**lookupZip**](EnderecosApi.md#lookupzip) | **GET** /addresses/zip/{zipCode} | Busca por CEP (B3) |
| [**setDefaultAddress**](EnderecosApi.md#setdefaultaddress) | **PATCH** /me/addresses/{addressId}/default | Definir endereço padrão (B2/C1) |
| [**updateAddress**](EnderecosApi.md#updateaddress) | **PUT** /me/addresses/{addressId} | Editar endereço (B3) |



## createAddress

> AddressEnvelope createAddress(addressInput)

Criar endereço (B3)

### Example

```ts
import {
  Configuration,
  EnderecosApi,
} from '@citybox/api-client';
import type { CreateAddressRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new EnderecosApi(config);

  const body = {
    // AddressInput
    addressInput: ...,
  } satisfies CreateAddressRequest;

  try {
    const data = await api.createAddress(body);
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
| **addressInput** | [AddressInput](AddressInput.md) |  | |

### Return type

[**AddressEnvelope**](AddressEnvelope.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** | Endereço criado |  -  |
| **401** | Token inválido ou expirado |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## deleteAddress

> deleteAddress(addressId)

Excluir endereço (B2)

### Example

```ts
import {
  Configuration,
  EnderecosApi,
} from '@citybox/api-client';
import type { DeleteAddressRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new EnderecosApi(config);

  const body = {
    // string
    addressId: addr-1,
  } satisfies DeleteAddressRequest;

  try {
    const data = await api.deleteAddress(body);
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
| **addressId** | `string` |  | [Defaults to `undefined`] |

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
| **204** | Endereço excluído |  -  |
| **401** | Token inválido ou expirado |  -  |
| **404** | Recurso não encontrado |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## listAddresses

> ListAddresses200Response listAddresses()

Listar endereços (B2)

### Example

```ts
import {
  Configuration,
  EnderecosApi,
} from '@citybox/api-client';
import type { ListAddressesRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new EnderecosApi(config);

  try {
    const data = await api.listAddresses();
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

[**ListAddresses200Response**](ListAddresses200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Lista de endereços |  -  |
| **401** | Token inválido ou expirado |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## lookupZip

> LookupZip200Response lookupZip(zipCode)

Busca por CEP (B3)

### Example

```ts
import {
  Configuration,
  EnderecosApi,
} from '@citybox/api-client';
import type { LookupZipRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const api = new EnderecosApi();

  const body = {
    // string
    zipCode: 01310-100,
  } satisfies LookupZipRequest;

  try {
    const data = await api.lookupZip(body);
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
| **zipCode** | `string` |  | [Defaults to `undefined`] |

### Return type

[**LookupZip200Response**](LookupZip200Response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Endereço do CEP |  -  |
| **404** | Recurso não encontrado |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## setDefaultAddress

> AddressEnvelope setDefaultAddress(addressId)

Definir endereço padrão (B2/C1)

### Example

```ts
import {
  Configuration,
  EnderecosApi,
} from '@citybox/api-client';
import type { SetDefaultAddressRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new EnderecosApi(config);

  const body = {
    // string
    addressId: addr-1,
  } satisfies SetDefaultAddressRequest;

  try {
    const data = await api.setDefaultAddress(body);
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
| **addressId** | `string` |  | [Defaults to `undefined`] |

### Return type

[**AddressEnvelope**](AddressEnvelope.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Endereço padrão definido |  -  |
| **401** | Token inválido ou expirado |  -  |
| **404** | Recurso não encontrado |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## updateAddress

> AddressEnvelope updateAddress(addressId, addressInput)

Editar endereço (B3)

### Example

```ts
import {
  Configuration,
  EnderecosApi,
} from '@citybox/api-client';
import type { UpdateAddressRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new EnderecosApi(config);

  const body = {
    // string
    addressId: addr-1,
    // AddressInput
    addressInput: ...,
  } satisfies UpdateAddressRequest;

  try {
    const data = await api.updateAddress(body);
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
| **addressId** | `string` |  | [Defaults to `undefined`] |
| **addressInput** | [AddressInput](AddressInput.md) |  | |

### Return type

[**AddressEnvelope**](AddressEnvelope.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Endereço atualizado |  -  |
| **401** | Token inválido ou expirado |  -  |
| **404** | Recurso não encontrado |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

