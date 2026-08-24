# AssinaturaAPI

All URIs are relative to *http://127.0.0.1:4010*

Method | HTTP request | Description
------------- | ------------- | -------------
[**cancelSubscription**](AssinaturaAPI.md#cancelsubscription) | **POST** /me/subscription/cancel | Cancelar assinatura (B8)
[**getSubscription**](AssinaturaAPI.md#getsubscription) | **GET** /me/subscription | Assinatura CityBox+ (B8)


# **cancelSubscription**
```swift
    open class func cancelSubscription(cancelSubscriptionRequest: CancelSubscriptionRequest? = nil, completion: @escaping (_ data: CancelSubscription200Response?, _ error: Error?) -> Void)
```

Cancelar assinatura (B8)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI

let cancelSubscriptionRequest = cancelSubscription_request(reason: "reason_example", feedback: "feedback_example") // CancelSubscriptionRequest |  (optional)

// Cancelar assinatura (B8)
AssinaturaAPI.cancelSubscription(cancelSubscriptionRequest: cancelSubscriptionRequest) { (response, error) in
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
 **cancelSubscriptionRequest** | [**CancelSubscriptionRequest**](CancelSubscriptionRequest.md) |  | [optional] 

### Return type

[**CancelSubscription200Response**](CancelSubscription200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getSubscription**
```swift
    open class func getSubscription(completion: @escaping (_ data: GetSubscription200Response?, _ error: Error?) -> Void)
```

Assinatura CityBox+ (B8)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI


// Assinatura CityBox+ (B8)
AssinaturaAPI.getSubscription() { (response, error) in
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

[**GetSubscription200Response**](GetSubscription200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

