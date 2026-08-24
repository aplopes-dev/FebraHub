# EnderecosAPI

All URIs are relative to *http://127.0.0.1:4010*

Method | HTTP request | Description
------------- | ------------- | -------------
[**createAddress**](EnderecosAPI.md#createaddress) | **POST** /me/addresses | Criar endereço (B3)
[**deleteAddress**](EnderecosAPI.md#deleteaddress) | **DELETE** /me/addresses/{addressId} | Excluir endereço (B2)
[**listAddresses**](EnderecosAPI.md#listaddresses) | **GET** /me/addresses | Listar endereços (B2)
[**lookupZip**](EnderecosAPI.md#lookupzip) | **GET** /addresses/zip/{zipCode} | Busca por CEP (B3)
[**setDefaultAddress**](EnderecosAPI.md#setdefaultaddress) | **PATCH** /me/addresses/{addressId}/default | Definir endereço padrão (B2/C1)
[**updateAddress**](EnderecosAPI.md#updateaddress) | **PUT** /me/addresses/{addressId} | Editar endereço (B3)


# **createAddress**
```swift
    open class func createAddress(addressInput: AddressInput, completion: @escaping (_ data: AddressEnvelope?, _ error: Error?) -> Void)
```

Criar endereço (B3)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI

let addressInput = AddressInput(label: "label_example", zipCode: "zipCode_example", street: "street_example", number: "number_example", complement: "complement_example", neighborhood: "neighborhood_example", city: "city_example", state: "state_example", isDefault: false) // AddressInput | 

// Criar endereço (B3)
EnderecosAPI.createAddress(addressInput: addressInput) { (response, error) in
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
 **addressInput** | [**AddressInput**](AddressInput.md) |  | 

### Return type

[**AddressEnvelope**](AddressEnvelope.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **deleteAddress**
```swift
    open class func deleteAddress(addressId: String, completion: @escaping (_ data: Void?, _ error: Error?) -> Void)
```

Excluir endereço (B2)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI

let addressId = "addressId_example" // String | 

// Excluir endereço (B2)
EnderecosAPI.deleteAddress(addressId: addressId) { (response, error) in
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
 **addressId** | **String** |  | 

### Return type

Void (empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **listAddresses**
```swift
    open class func listAddresses(completion: @escaping (_ data: ListAddresses200Response?, _ error: Error?) -> Void)
```

Listar endereços (B2)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI


// Listar endereços (B2)
EnderecosAPI.listAddresses() { (response, error) in
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

[**ListAddresses200Response**](ListAddresses200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **lookupZip**
```swift
    open class func lookupZip(zipCode: String, completion: @escaping (_ data: LookupZip200Response?, _ error: Error?) -> Void)
```

Busca por CEP (B3)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI

let zipCode = "zipCode_example" // String | 

// Busca por CEP (B3)
EnderecosAPI.lookupZip(zipCode: zipCode) { (response, error) in
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
 **zipCode** | **String** |  | 

### Return type

[**LookupZip200Response**](LookupZip200Response.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **setDefaultAddress**
```swift
    open class func setDefaultAddress(addressId: String, completion: @escaping (_ data: AddressEnvelope?, _ error: Error?) -> Void)
```

Definir endereço padrão (B2/C1)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI

let addressId = "addressId_example" // String | 

// Definir endereço padrão (B2/C1)
EnderecosAPI.setDefaultAddress(addressId: addressId) { (response, error) in
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
 **addressId** | **String** |  | 

### Return type

[**AddressEnvelope**](AddressEnvelope.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updateAddress**
```swift
    open class func updateAddress(addressId: String, addressInput: AddressInput, completion: @escaping (_ data: AddressEnvelope?, _ error: Error?) -> Void)
```

Editar endereço (B3)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI

let addressId = "addressId_example" // String | 
let addressInput = AddressInput(label: "label_example", zipCode: "zipCode_example", street: "street_example", number: "number_example", complement: "complement_example", neighborhood: "neighborhood_example", city: "city_example", state: "state_example", isDefault: false) // AddressInput | 

// Editar endereço (B3)
EnderecosAPI.updateAddress(addressId: addressId, addressInput: addressInput) { (response, error) in
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
 **addressId** | **String** |  | 
 **addressInput** | [**AddressInput**](AddressInput.md) |  | 

### Return type

[**AddressEnvelope**](AddressEnvelope.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

