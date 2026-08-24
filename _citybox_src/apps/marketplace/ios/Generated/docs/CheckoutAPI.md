# CheckoutAPI

All URIs are relative to *http://127.0.0.1:4010*

Method | HTTP request | Description
------------- | ------------- | -------------
[**checkoutPreview**](CheckoutAPI.md#checkoutpreview) | **POST** /checkout/preview | Resumo do checkout sem persistir
[**createOrder**](CheckoutAPI.md#createorder) | **POST** /checkout/orders | Confirmar pedido (C4/C5)
[**getCheckoutSession**](CheckoutAPI.md#getcheckoutsession) | **GET** /checkout/session | Obter sessão de checkout
[**getShippingOptions**](CheckoutAPI.md#getshippingoptions) | **POST** /checkout/shipping-options | Cotar opções de envio (C2)
[**listCoupons**](CheckoutAPI.md#listcoupons) | **GET** /me/coupons | Cupons disponíveis (C3)
[**removeCoupon**](CheckoutAPI.md#removecoupon) | **DELETE** /checkout/coupons | Remover cupom aplicado (C3)
[**updateCheckoutSession**](CheckoutAPI.md#updatecheckoutsession) | **PATCH** /checkout/session | Atualizar sessão (endereço/envio/pagamento)
[**validateCoupon**](CheckoutAPI.md#validatecoupon) | **POST** /checkout/coupons/validate | Validar/aplicar cupom (C3)


# **checkoutPreview**
```swift
    open class func checkoutPreview(checkoutPreviewRequest: CheckoutPreviewRequest, completion: @escaping (_ data: CheckoutPreview200Response?, _ error: Error?) -> Void)
```

Resumo do checkout sem persistir

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI

let checkoutPreviewRequest = checkoutPreview_request(addressId: "addressId_example", shippingOptionId: "shippingOptionId_example", couponCode: "couponCode_example", paymentType: PaymentType(), items: [CartItemInput(productId: "productId_example", quantity: 123)]) // CheckoutPreviewRequest | 

// Resumo do checkout sem persistir
CheckoutAPI.checkoutPreview(checkoutPreviewRequest: checkoutPreviewRequest) { (response, error) in
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
 **checkoutPreviewRequest** | [**CheckoutPreviewRequest**](CheckoutPreviewRequest.md) |  | 

### Return type

[**CheckoutPreview200Response**](CheckoutPreview200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **createOrder**
```swift
    open class func createOrder(idempotencyKey: UUID, createOrderRequest: CreateOrderRequest, completion: @escaping (_ data: CreateOrder201Response?, _ error: Error?) -> Void)
```

Confirmar pedido (C4/C5)

Aceita body completo ou sessão já preenchida. `buyNow: true` substitui o carrinho pelos itens informados. 

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI

let idempotencyKey = 987 // UUID | UUID v4 para evitar pedido duplicado em retry
let createOrderRequest = createOrder_request(addressId: "addressId_example", shippingOptionId: "shippingOptionId_example", couponCode: "couponCode_example", payment: PaymentInput(type: PaymentType(), paymentMethodId: "paymentMethodId_example", cpf: "cpf_example"), items: [CartItemInput(productId: "productId_example", quantity: 123)], buyNow: false) // CreateOrderRequest | 

// Confirmar pedido (C4/C5)
CheckoutAPI.createOrder(idempotencyKey: idempotencyKey, createOrderRequest: createOrderRequest) { (response, error) in
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
 **idempotencyKey** | **UUID** | UUID v4 para evitar pedido duplicado em retry | 
 **createOrderRequest** | [**CreateOrderRequest**](CreateOrderRequest.md) |  | 

### Return type

[**CreateOrder201Response**](CreateOrder201Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getCheckoutSession**
```swift
    open class func getCheckoutSession(completion: @escaping (_ data: CheckoutSessionEnvelope?, _ error: Error?) -> Void)
```

Obter sessão de checkout

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI


// Obter sessão de checkout
CheckoutAPI.getCheckoutSession() { (response, error) in
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

[**CheckoutSessionEnvelope**](CheckoutSessionEnvelope.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getShippingOptions**
```swift
    open class func getShippingOptions(getShippingOptionsRequest: GetShippingOptionsRequest, completion: @escaping (_ data: GetShippingOptions200Response?, _ error: Error?) -> Void)
```

Cotar opções de envio (C2)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI

let getShippingOptionsRequest = getShippingOptions_request(addressId: "addressId_example", items: [CartItemInput(productId: "productId_example", quantity: 123)]) // GetShippingOptionsRequest | 

// Cotar opções de envio (C2)
CheckoutAPI.getShippingOptions(getShippingOptionsRequest: getShippingOptionsRequest) { (response, error) in
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
 **getShippingOptionsRequest** | [**GetShippingOptionsRequest**](GetShippingOptionsRequest.md) |  | 

### Return type

[**GetShippingOptions200Response**](GetShippingOptions200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **listCoupons**
```swift
    open class func listCoupons(completion: @escaping (_ data: ListCoupons200Response?, _ error: Error?) -> Void)
```

Cupons disponíveis (C3)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI


// Cupons disponíveis (C3)
CheckoutAPI.listCoupons() { (response, error) in
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

[**ListCoupons200Response**](ListCoupons200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **removeCoupon**
```swift
    open class func removeCoupon(completion: @escaping (_ data: RemoveCoupon200Response?, _ error: Error?) -> Void)
```

Remover cupom aplicado (C3)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI


// Remover cupom aplicado (C3)
CheckoutAPI.removeCoupon() { (response, error) in
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

[**RemoveCoupon200Response**](RemoveCoupon200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updateCheckoutSession**
```swift
    open class func updateCheckoutSession(updateCheckoutSessionRequest: UpdateCheckoutSessionRequest, completion: @escaping (_ data: CheckoutSessionEnvelope?, _ error: Error?) -> Void)
```

Atualizar sessão (endereço/envio/pagamento)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI

let updateCheckoutSessionRequest = updateCheckoutSession_request(selectedAddressId: "selectedAddressId_example", shippingOptionId: "shippingOptionId_example", paymentType: PaymentType(), paymentMethodId: "paymentMethodId_example", boletoCpf: "boletoCpf_example") // UpdateCheckoutSessionRequest | 

// Atualizar sessão (endereço/envio/pagamento)
CheckoutAPI.updateCheckoutSession(updateCheckoutSessionRequest: updateCheckoutSessionRequest) { (response, error) in
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
 **updateCheckoutSessionRequest** | [**UpdateCheckoutSessionRequest**](UpdateCheckoutSessionRequest.md) |  | 

### Return type

[**CheckoutSessionEnvelope**](CheckoutSessionEnvelope.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **validateCoupon**
```swift
    open class func validateCoupon(validateCouponRequest: ValidateCouponRequest, completion: @escaping (_ data: ValidateCoupon200Response?, _ error: Error?) -> Void)
```

Validar/aplicar cupom (C3)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI

let validateCouponRequest = validateCoupon_request(code: "code_example", items: [CartItemInput(productId: "productId_example", quantity: 123)], subtotal: 123) // ValidateCouponRequest | 

// Validar/aplicar cupom (C3)
CheckoutAPI.validateCoupon(validateCouponRequest: validateCouponRequest) { (response, error) in
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
 **validateCouponRequest** | [**ValidateCouponRequest**](ValidateCouponRequest.md) |  | 

### Return type

[**ValidateCoupon200Response**](ValidateCoupon200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

