# CarrinhoAPI

All URIs are relative to *http://127.0.0.1:4010*

Method | HTTP request | Description
------------- | ------------- | -------------
[**addCartItem**](CarrinhoAPI.md#addcartitem) | **POST** /me/cart/items | Adicionar item ao carrinho
[**applyCartCoupon**](CarrinhoAPI.md#applycartcoupon) | **POST** /me/cart/coupon | Aplicar cupom via carrinho (alias)
[**clearCart**](CarrinhoAPI.md#clearcart) | **DELETE** /me/cart | Limpar carrinho
[**getCart**](CarrinhoAPI.md#getcart) | **GET** /me/cart | Obter carrinho (+ badge)
[**removeCartItem**](CarrinhoAPI.md#removecartitem) | **DELETE** /me/cart/items/{productId} | Remover item
[**updateCartItem**](CarrinhoAPI.md#updatecartitem) | **PATCH** /me/cart/items/{productId} | Atualizar quantidade (0 remove)


# **addCartItem**
```swift
    open class func addCartItem(addCartItemRequest: AddCartItemRequest, completion: @escaping (_ data: GetCart200Response?, _ error: Error?) -> Void)
```

Adicionar item ao carrinho

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI

let addCartItemRequest = addCartItem_request(productId: "productId_example", quantity: 123) // AddCartItemRequest | 

// Adicionar item ao carrinho
CarrinhoAPI.addCartItem(addCartItemRequest: addCartItemRequest) { (response, error) in
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
 **addCartItemRequest** | [**AddCartItemRequest**](AddCartItemRequest.md) |  | 

### Return type

[**GetCart200Response**](GetCart200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **applyCartCoupon**
```swift
    open class func applyCartCoupon(applyCartCouponRequest: ApplyCartCouponRequest, completion: @escaping (_ data: ApplyCartCoupon200Response?, _ error: Error?) -> Void)
```

Aplicar cupom via carrinho (alias)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI

let applyCartCouponRequest = applyCartCoupon_request(code: "code_example") // ApplyCartCouponRequest | 

// Aplicar cupom via carrinho (alias)
CarrinhoAPI.applyCartCoupon(applyCartCouponRequest: applyCartCouponRequest) { (response, error) in
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
 **applyCartCouponRequest** | [**ApplyCartCouponRequest**](ApplyCartCouponRequest.md) |  | 

### Return type

[**ApplyCartCoupon200Response**](ApplyCartCoupon200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **clearCart**
```swift
    open class func clearCart(completion: @escaping (_ data: Void?, _ error: Error?) -> Void)
```

Limpar carrinho

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI


// Limpar carrinho
CarrinhoAPI.clearCart() { (response, error) in
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

Void (empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getCart**
```swift
    open class func getCart(completion: @escaping (_ data: GetCart200Response?, _ error: Error?) -> Void)
```

Obter carrinho (+ badge)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI


// Obter carrinho (+ badge)
CarrinhoAPI.getCart() { (response, error) in
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

[**GetCart200Response**](GetCart200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **removeCartItem**
```swift
    open class func removeCartItem(productId: String, completion: @escaping (_ data: GetCart200Response?, _ error: Error?) -> Void)
```

Remover item

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI

let productId = "productId_example" // String | 

// Remover item
CarrinhoAPI.removeCartItem(productId: productId) { (response, error) in
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
 **productId** | **String** |  | 

### Return type

[**GetCart200Response**](GetCart200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updateCartItem**
```swift
    open class func updateCartItem(productId: String, updateCartItemRequest: UpdateCartItemRequest, completion: @escaping (_ data: GetCart200Response?, _ error: Error?) -> Void)
```

Atualizar quantidade (0 remove)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI

let productId = "productId_example" // String | 
let updateCartItemRequest = updateCartItem_request(quantity: 123) // UpdateCartItemRequest | 

// Atualizar quantidade (0 remove)
CarrinhoAPI.updateCartItem(productId: productId, updateCartItemRequest: updateCartItemRequest) { (response, error) in
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
 **productId** | **String** |  | 
 **updateCartItemRequest** | [**UpdateCartItemRequest**](UpdateCartItemRequest.md) |  | 

### Return type

[**GetCart200Response**](GetCart200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

