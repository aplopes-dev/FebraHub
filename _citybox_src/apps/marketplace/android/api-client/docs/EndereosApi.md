# EndereosApi

All URIs are relative to *http://127.0.0.1:4010*

| Method | HTTP request | Description |
| ------------- | ------------- | ------------- |
| [**createAddress**](EndereosApi.md#createAddress) | **POST** me/addresses | Criar endereço (B3) |
| [**deleteAddress**](EndereosApi.md#deleteAddress) | **DELETE** me/addresses/{addressId} | Excluir endereço (B2) |
| [**listAddresses**](EndereosApi.md#listAddresses) | **GET** me/addresses | Listar endereços (B2) |
| [**lookupZip**](EndereosApi.md#lookupZip) | **GET** addresses/zip/{zipCode} | Busca por CEP (B3) |
| [**setDefaultAddress**](EndereosApi.md#setDefaultAddress) | **PATCH** me/addresses/{addressId}/default | Definir endereço padrão (B2/C1) |
| [**updateAddress**](EndereosApi.md#updateAddress) | **PUT** me/addresses/{addressId} | Editar endereço (B3) |



Criar endereço (B3)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(EndereosApi::class.java)
val addressInput : AddressInput =  // AddressInput | 

val result : AddressEnvelope = webService.createAddress(addressInput)
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **addressInput** | [**AddressInput**](AddressInput.md)|  | |

### Return type

[**AddressEnvelope**](AddressEnvelope.md)

### Authorization


Configure bearerAuth:
    ApiClient().setBearerToken("TOKEN")

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


Excluir endereço (B2)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(EndereosApi::class.java)
val addressId : kotlin.String = addr-1 // kotlin.String | 

webService.deleteAddress(addressId)
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **addressId** | **kotlin.String**|  | |

### Return type

null (empty response body)

### Authorization


Configure bearerAuth:
    ApiClient().setBearerToken("TOKEN")

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


Listar endereços (B2)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(EndereosApi::class.java)

val result : ListAddresses200Response = webService.listAddresses()
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**ListAddresses200Response**](ListAddresses200Response.md)

### Authorization


Configure bearerAuth:
    ApiClient().setBearerToken("TOKEN")

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


Busca por CEP (B3)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
val webService = apiClient.createWebservice(EndereosApi::class.java)
val zipCode : kotlin.String = 01310-100 // kotlin.String | 

val result : LookupZip200Response = webService.lookupZip(zipCode)
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **zipCode** | **kotlin.String**|  | |

### Return type

[**LookupZip200Response**](LookupZip200Response.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


Definir endereço padrão (B2/C1)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(EndereosApi::class.java)
val addressId : kotlin.String = addr-1 // kotlin.String | 

val result : AddressEnvelope = webService.setDefaultAddress(addressId)
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **addressId** | **kotlin.String**|  | |

### Return type

[**AddressEnvelope**](AddressEnvelope.md)

### Authorization


Configure bearerAuth:
    ApiClient().setBearerToken("TOKEN")

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


Editar endereço (B3)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(EndereosApi::class.java)
val addressId : kotlin.String = addr-1 // kotlin.String | 
val addressInput : AddressInput =  // AddressInput | 

val result : AddressEnvelope = webService.updateAddress(addressId, addressInput)
```

### Parameters
| **addressId** | **kotlin.String**|  | |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **addressInput** | [**AddressInput**](AddressInput.md)|  | |

### Return type

[**AddressEnvelope**](AddressEnvelope.md)

### Authorization


Configure bearerAuth:
    ApiClient().setBearerToken("TOKEN")

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

