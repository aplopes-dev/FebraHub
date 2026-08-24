# PedidosPsCompraAPI

All URIs are relative to *http://127.0.0.1:4010*

Method | HTTP request | Description
------------- | ------------- | -------------
[**buyAgain**](PedidosPsCompraAPI.md#buyagain) | **POST** /me/orders/{orderId}/buy-again | Comprar novamente (D1)
[**cancelOrder**](PedidosPsCompraAPI.md#cancelorder) | **POST** /me/orders/{orderId}/cancel | Cancelar pedido (D1/D4)
[**createReturn**](PedidosPsCompraAPI.md#createreturn) | **POST** /me/orders/{orderId}/returns | Solicitar devolução (D4)
[**getInvoice**](PedidosPsCompraAPI.md#getinvoice) | **GET** /me/orders/{orderId}/invoice | Nota fiscal (D1)
[**getOrder**](PedidosPsCompraAPI.md#getorder) | **GET** /me/orders/{orderId} | Detalhe do pedido (D1)
[**getReturn**](PedidosPsCompraAPI.md#getreturn) | **GET** /me/orders/{orderId}/returns/{returnId} | Consultar devolução (D4)
[**getTracking**](PedidosPsCompraAPI.md#gettracking) | **GET** /me/orders/{orderId}/tracking | Rastreamento (D2)
[**listOrders**](PedidosPsCompraAPI.md#listorders) | **GET** /me/orders | Listar pedidos


# **buyAgain**
```swift
    open class func buyAgain(orderId: String, completion: @escaping (_ data: BuyAgain200Response?, _ error: Error?) -> Void)
```

Comprar novamente (D1)

Adiciona os itens do pedido ao carrinho (merge de quantidades).

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI

let orderId = "orderId_example" // String | 

// Comprar novamente (D1)
PedidosPsCompraAPI.buyAgain(orderId: orderId) { (response, error) in
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
 **orderId** | **String** |  | 

### Return type

[**BuyAgain200Response**](BuyAgain200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **cancelOrder**
```swift
    open class func cancelOrder(orderId: String, cancelOrderRequest: CancelOrderRequest, completion: @escaping (_ data: GetOrder200Response?, _ error: Error?) -> Void)
```

Cancelar pedido (D1/D4)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI

let orderId = "orderId_example" // String | 
let cancelOrderRequest = cancelOrder_request(reason: "reason_example", description: "description_example") // CancelOrderRequest | 

// Cancelar pedido (D1/D4)
PedidosPsCompraAPI.cancelOrder(orderId: orderId, cancelOrderRequest: cancelOrderRequest) { (response, error) in
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
 **orderId** | **String** |  | 
 **cancelOrderRequest** | [**CancelOrderRequest**](CancelOrderRequest.md) |  | 

### Return type

[**GetOrder200Response**](GetOrder200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **createReturn**
```swift
    open class func createReturn(orderId: String, createReturnRequest: CreateReturnRequest, completion: @escaping (_ data: CreateReturn201Response?, _ error: Error?) -> Void)
```

Solicitar devolução (D4)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI

let orderId = "orderId_example" // String | 
let createReturnRequest = createReturn_request(item: CartItemInput(productId: "productId_example", quantity: 123), reason: ReturnReason(), description: "description_example") // CreateReturnRequest | 

// Solicitar devolução (D4)
PedidosPsCompraAPI.createReturn(orderId: orderId, createReturnRequest: createReturnRequest) { (response, error) in
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
 **orderId** | **String** |  | 
 **createReturnRequest** | [**CreateReturnRequest**](CreateReturnRequest.md) |  | 

### Return type

[**CreateReturn201Response**](CreateReturn201Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getInvoice**
```swift
    open class func getInvoice(orderId: String, completion: @escaping (_ data: GetInvoice200Response?, _ error: Error?) -> Void)
```

Nota fiscal (D1)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI

let orderId = "orderId_example" // String | 

// Nota fiscal (D1)
PedidosPsCompraAPI.getInvoice(orderId: orderId) { (response, error) in
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
 **orderId** | **String** |  | 

### Return type

[**GetInvoice200Response**](GetInvoice200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getOrder**
```swift
    open class func getOrder(orderId: String, ifNoneMatch: String? = nil, completion: @escaping (_ data: GetOrder200Response?, _ error: Error?) -> Void)
```

Detalhe do pedido (D1)

Suporta cache condicional (ETag/If-None-Match) para polling de status.

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI

let orderId = "orderId_example" // String | 
let ifNoneMatch = "ifNoneMatch_example" // String |  (optional)

// Detalhe do pedido (D1)
PedidosPsCompraAPI.getOrder(orderId: orderId, ifNoneMatch: ifNoneMatch) { (response, error) in
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
 **orderId** | **String** |  | 
 **ifNoneMatch** | **String** |  | [optional] 

### Return type

[**GetOrder200Response**](GetOrder200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getReturn**
```swift
    open class func getReturn(orderId: String, returnId: String, completion: @escaping (_ data: GetReturn200Response?, _ error: Error?) -> Void)
```

Consultar devolução (D4)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI

let orderId = "orderId_example" // String | 
let returnId = "returnId_example" // String | 

// Consultar devolução (D4)
PedidosPsCompraAPI.getReturn(orderId: orderId, returnId: returnId) { (response, error) in
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
 **orderId** | **String** |  | 
 **returnId** | **String** |  | 

### Return type

[**GetReturn200Response**](GetReturn200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getTracking**
```swift
    open class func getTracking(orderId: String, completion: @escaping (_ data: GetTracking200Response?, _ error: Error?) -> Void)
```

Rastreamento (D2)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI

let orderId = "orderId_example" // String | 

// Rastreamento (D2)
PedidosPsCompraAPI.getTracking(orderId: orderId) { (response, error) in
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
 **orderId** | **String** |  | 

### Return type

[**GetTracking200Response**](GetTracking200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **listOrders**
```swift
    open class func listOrders(page: Int? = nil, pageSize: Int? = nil, status: OrderStatus? = nil, completion: @escaping (_ data: ListOrders200Response?, _ error: Error?) -> Void)
```

Listar pedidos

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI

let page = 987 // Int |  (optional) (default to 1)
let pageSize = 987 // Int |  (optional) (default to 20)
let status = OrderStatus() // OrderStatus |  (optional)

// Listar pedidos
PedidosPsCompraAPI.listOrders(page: page, pageSize: pageSize, status: status) { (response, error) in
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
 **page** | **Int** |  | [optional] [default to 1]
 **pageSize** | **Int** |  | [optional] [default to 20]
 **status** | [**OrderStatus**](.md) |  | [optional] 

### Return type

[**ListOrders200Response**](ListOrders200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

