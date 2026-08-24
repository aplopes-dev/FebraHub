# PagamentosAPI

All URIs are relative to *http://127.0.0.1:4010*

Method | HTTP request | Description
------------- | ------------- | -------------
[**createPaymentMethod**](PagamentosAPI.md#createpaymentmethod) | **POST** /me/payment-methods | Adicionar cartão (B5)
[**deletePaymentMethod**](PagamentosAPI.md#deletepaymentmethod) | **DELETE** /me/payment-methods/{paymentMethodId} | Excluir cartão (B4)
[**listPaymentMethods**](PagamentosAPI.md#listpaymentmethods) | **GET** /me/payment-methods | Listar cartões (B4)
[**setDefaultPaymentMethod**](PagamentosAPI.md#setdefaultpaymentmethod) | **PATCH** /me/payment-methods/{paymentMethodId}/default | Definir cartão padrão (B4/C5)


# **createPaymentMethod**
```swift
    open class func createPaymentMethod(createPaymentMethodRequest: CreatePaymentMethodRequest, completion: @escaping (_ data: CreatePaymentMethod201Response?, _ error: Error?) -> Void)
```

Adicionar cartão (B5)

Backend tokeniza via gateway. Nunca persistir PAN/CVV em claro.

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI

let createPaymentMethodRequest = createPaymentMethod_request(number: "number_example", holderName: "holderName_example", expiry: "expiry_example", cvv: "cvv_example", label: "label_example", isDefault: false) // CreatePaymentMethodRequest | 

// Adicionar cartão (B5)
PagamentosAPI.createPaymentMethod(createPaymentMethodRequest: createPaymentMethodRequest) { (response, error) in
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
 **createPaymentMethodRequest** | [**CreatePaymentMethodRequest**](CreatePaymentMethodRequest.md) |  | 

### Return type

[**CreatePaymentMethod201Response**](CreatePaymentMethod201Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **deletePaymentMethod**
```swift
    open class func deletePaymentMethod(paymentMethodId: String, completion: @escaping (_ data: Void?, _ error: Error?) -> Void)
```

Excluir cartão (B4)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI

let paymentMethodId = "paymentMethodId_example" // String | 

// Excluir cartão (B4)
PagamentosAPI.deletePaymentMethod(paymentMethodId: paymentMethodId) { (response, error) in
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
 **paymentMethodId** | **String** |  | 

### Return type

Void (empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **listPaymentMethods**
```swift
    open class func listPaymentMethods(completion: @escaping (_ data: ListPaymentMethods200Response?, _ error: Error?) -> Void)
```

Listar cartões (B4)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI


// Listar cartões (B4)
PagamentosAPI.listPaymentMethods() { (response, error) in
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

[**ListPaymentMethods200Response**](ListPaymentMethods200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **setDefaultPaymentMethod**
```swift
    open class func setDefaultPaymentMethod(paymentMethodId: String, completion: @escaping (_ data: SetDefaultPaymentMethod200Response?, _ error: Error?) -> Void)
```

Definir cartão padrão (B4/C5)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI

let paymentMethodId = "paymentMethodId_example" // String | 

// Definir cartão padrão (B4/C5)
PagamentosAPI.setDefaultPaymentMethod(paymentMethodId: paymentMethodId) { (response, error) in
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
 **paymentMethodId** | **String** |  | 

### Return type

[**SetDefaultPaymentMethod200Response**](SetDefaultPaymentMethod200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

