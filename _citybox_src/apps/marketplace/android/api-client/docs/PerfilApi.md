# PerfilApi

All URIs are relative to *http://127.0.0.1:4010*

| Method | HTTP request | Description |
| ------------- | ------------- | ------------- |
| [**deleteAccount**](PerfilApi.md#deleteAccount) | **DELETE** me | Excluir conta (B6) |
| [**getMe**](PerfilApi.md#getMe) | **GET** me | Obter perfil (B1) |
| [**getSettings**](PerfilApi.md#getSettings) | **GET** me/settings | Obter configurações (B6) |
| [**updateMe**](PerfilApi.md#updateMe) | **PATCH** me | Editar perfil (B1) |
| [**updateSettings**](PerfilApi.md#updateSettings) | **PATCH** me/settings | Atualizar configurações (B6) |
| [**uploadAvatar**](PerfilApi.md#uploadAvatar) | **POST** me/avatar | Upload de avatar (B1) |



Excluir conta (B6)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(PerfilApi::class.java)
val deleteAccountRequest : DeleteAccountRequest =  // DeleteAccountRequest | 

webService.deleteAccount(deleteAccountRequest)
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **deleteAccountRequest** | [**DeleteAccountRequest**](DeleteAccountRequest.md)|  | |

### Return type

null (empty response body)

### Authorization


Configure bearerAuth:
    ApiClient().setBearerToken("TOKEN")

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


Obter perfil (B1)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(PerfilApi::class.java)

val result : GetMe200Response = webService.getMe()
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**GetMe200Response**](GetMe200Response.md)

### Authorization


Configure bearerAuth:
    ApiClient().setBearerToken("TOKEN")

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


Obter configurações (B6)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(PerfilApi::class.java)

val result : GetSettings200Response = webService.getSettings()
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**GetSettings200Response**](GetSettings200Response.md)

### Authorization


Configure bearerAuth:
    ApiClient().setBearerToken("TOKEN")

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


Editar perfil (B1)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(PerfilApi::class.java)
val updateMeRequest : UpdateMeRequest =  // UpdateMeRequest | 

val result : GetMe200Response = webService.updateMe(updateMeRequest)
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **updateMeRequest** | [**UpdateMeRequest**](UpdateMeRequest.md)|  | |

### Return type

[**GetMe200Response**](GetMe200Response.md)

### Authorization


Configure bearerAuth:
    ApiClient().setBearerToken("TOKEN")

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


Atualizar configurações (B6)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(PerfilApi::class.java)
val settings : Settings =  // Settings | 

val result : GetSettings200Response = webService.updateSettings(settings)
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **settings** | [**Settings**](Settings.md)|  | |

### Return type

[**GetSettings200Response**](GetSettings200Response.md)

### Authorization


Configure bearerAuth:
    ApiClient().setBearerToken("TOKEN")

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


Upload de avatar (B1)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(PerfilApi::class.java)
val file : java.io.File = BINARY_DATA_HERE // java.io.File | 

val result : UploadAvatar200Response = webService.uploadAvatar(file)
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **file** | **java.io.File**|  | [optional] |

### Return type

[**UploadAvatar200Response**](UploadAvatar200Response.md)

### Authorization


Configure bearerAuth:
    ApiClient().setBearerToken("TOKEN")

### HTTP request headers

 - **Content-Type**: multipart/form-data
 - **Accept**: application/json

