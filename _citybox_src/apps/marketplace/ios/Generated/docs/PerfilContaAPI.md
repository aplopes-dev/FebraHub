# PerfilContaAPI

All URIs are relative to *http://127.0.0.1:4010*

Method | HTTP request | Description
------------- | ------------- | -------------
[**deleteAccount**](PerfilContaAPI.md#deleteaccount) | **DELETE** /me | Excluir conta (B6)
[**getMe**](PerfilContaAPI.md#getme) | **GET** /me | Obter perfil (B1)
[**getSettings**](PerfilContaAPI.md#getsettings) | **GET** /me/settings | Obter configurações (B6)
[**updateMe**](PerfilContaAPI.md#updateme) | **PATCH** /me | Editar perfil (B1)
[**updateSettings**](PerfilContaAPI.md#updatesettings) | **PATCH** /me/settings | Atualizar configurações (B6)
[**uploadAvatar**](PerfilContaAPI.md#uploadavatar) | **POST** /me/avatar | Upload de avatar (B1)


# **deleteAccount**
```swift
    open class func deleteAccount(deleteAccountRequest: DeleteAccountRequest, completion: @escaping (_ data: Void?, _ error: Error?) -> Void)
```

Excluir conta (B6)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI

let deleteAccountRequest = deleteAccount_request(password: "password_example", confirmation: "confirmation_example") // DeleteAccountRequest | 

// Excluir conta (B6)
PerfilContaAPI.deleteAccount(deleteAccountRequest: deleteAccountRequest) { (response, error) in
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
 **deleteAccountRequest** | [**DeleteAccountRequest**](DeleteAccountRequest.md) |  | 

### Return type

Void (empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getMe**
```swift
    open class func getMe(completion: @escaping (_ data: GetMe200Response?, _ error: Error?) -> Void)
```

Obter perfil (B1)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI


// Obter perfil (B1)
PerfilContaAPI.getMe() { (response, error) in
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

[**GetMe200Response**](GetMe200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getSettings**
```swift
    open class func getSettings(completion: @escaping (_ data: GetSettings200Response?, _ error: Error?) -> Void)
```

Obter configurações (B6)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI


// Obter configurações (B6)
PerfilContaAPI.getSettings() { (response, error) in
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

[**GetSettings200Response**](GetSettings200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updateMe**
```swift
    open class func updateMe(updateMeRequest: UpdateMeRequest, completion: @escaping (_ data: GetMe200Response?, _ error: Error?) -> Void)
```

Editar perfil (B1)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI

let updateMeRequest = updateMe_request(name: "name_example", email: "email_example", phone: "phone_example") // UpdateMeRequest | 

// Editar perfil (B1)
PerfilContaAPI.updateMe(updateMeRequest: updateMeRequest) { (response, error) in
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
 **updateMeRequest** | [**UpdateMeRequest**](UpdateMeRequest.md) |  | 

### Return type

[**GetMe200Response**](GetMe200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updateSettings**
```swift
    open class func updateSettings(settings: Settings, completion: @escaping (_ data: GetSettings200Response?, _ error: Error?) -> Void)
```

Atualizar configurações (B6)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI

let settings = Settings(pushOrdersEnabled: false, pushPromoEnabled: false, emailPromoEnabled: false, darkTheme: false, language: "language_example") // Settings | 

// Atualizar configurações (B6)
PerfilContaAPI.updateSettings(settings: settings) { (response, error) in
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
 **settings** | [**Settings**](Settings.md) |  | 

### Return type

[**GetSettings200Response**](GetSettings200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **uploadAvatar**
```swift
    open class func uploadAvatar(file: URL? = nil, completion: @escaping (_ data: UploadAvatar200Response?, _ error: Error?) -> Void)
```

Upload de avatar (B1)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI

let file = URL(string: "https://example.com")! // URL |  (optional)

// Upload de avatar (B1)
PerfilContaAPI.uploadAvatar(file: file) { (response, error) in
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
 **file** | **URL** |  | [optional] 

### Return type

[**UploadAvatar200Response**](UploadAvatar200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: multipart/form-data
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

