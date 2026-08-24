# EngajamentoAPI

All URIs are relative to *http://127.0.0.1:4010*

Method | HTTP request | Description
------------- | ------------- | -------------
[**createTicket**](EngajamentoAPI.md#createticket) | **POST** /me/support/tickets | Abrir ticket de suporte (F3 alt)
[**getChatMessages**](EngajamentoAPI.md#getchatmessages) | **GET** /me/support/chat/messages | Histórico do chat (F3)
[**getFaq**](EngajamentoAPI.md#getfaq) | **GET** /support/faq | FAQ / Ajuda (F2)
[**listNotifications**](EngajamentoAPI.md#listnotifications) | **GET** /me/notifications | Listar notificações (F1)
[**markAllNotificationsRead**](EngajamentoAPI.md#markallnotificationsread) | **POST** /me/notifications/read-all | Marcar todas como lidas (F1)
[**markNotificationRead**](EngajamentoAPI.md#marknotificationread) | **PATCH** /me/notifications/{notificationId}/read | Marcar notificação como lida (F1)
[**sendChatMessage**](EngajamentoAPI.md#sendchatmessage) | **POST** /me/support/chat/messages | Enviar mensagem ao chat (F3)


# **createTicket**
```swift
    open class func createTicket(createTicketRequest: CreateTicketRequest, completion: @escaping (_ data: CreateTicket201Response?, _ error: Error?) -> Void)
```

Abrir ticket de suporte (F3 alt)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI

let createTicketRequest = createTicket_request(subject: "subject_example", orderId: "orderId_example", message: "message_example") // CreateTicketRequest | 

// Abrir ticket de suporte (F3 alt)
EngajamentoAPI.createTicket(createTicketRequest: createTicketRequest) { (response, error) in
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
 **createTicketRequest** | [**CreateTicketRequest**](CreateTicketRequest.md) |  | 

### Return type

[**CreateTicket201Response**](CreateTicket201Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getChatMessages**
```swift
    open class func getChatMessages(before: String? = nil, limit: Int? = nil, completion: @escaping (_ data: GetChatMessages200Response?, _ error: Error?) -> Void)
```

Histórico do chat (F3)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI

let before = "before_example" // String |  (optional)
let limit = 987 // Int |  (optional)

// Histórico do chat (F3)
EngajamentoAPI.getChatMessages(before: before, limit: limit) { (response, error) in
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
 **before** | **String** |  | [optional] 
 **limit** | **Int** |  | [optional] 

### Return type

[**GetChatMessages200Response**](GetChatMessages200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getFaq**
```swift
    open class func getFaq(completion: @escaping (_ data: GetFaq200Response?, _ error: Error?) -> Void)
```

FAQ / Ajuda (F2)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI


// FAQ / Ajuda (F2)
EngajamentoAPI.getFaq() { (response, error) in
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

[**GetFaq200Response**](GetFaq200Response.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **listNotifications**
```swift
    open class func listNotifications(page: Int? = nil, pageSize: Int? = nil, unreadOnly: Bool? = nil, completion: @escaping (_ data: ListNotifications200Response?, _ error: Error?) -> Void)
```

Listar notificações (F1)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI

let page = 987 // Int |  (optional) (default to 1)
let pageSize = 987 // Int |  (optional) (default to 20)
let unreadOnly = true // Bool |  (optional)

// Listar notificações (F1)
EngajamentoAPI.listNotifications(page: page, pageSize: pageSize, unreadOnly: unreadOnly) { (response, error) in
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
 **unreadOnly** | **Bool** |  | [optional] 

### Return type

[**ListNotifications200Response**](ListNotifications200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **markAllNotificationsRead**
```swift
    open class func markAllNotificationsRead(completion: @escaping (_ data: MarkAllNotificationsRead200Response?, _ error: Error?) -> Void)
```

Marcar todas como lidas (F1)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI


// Marcar todas como lidas (F1)
EngajamentoAPI.markAllNotificationsRead() { (response, error) in
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

[**MarkAllNotificationsRead200Response**](MarkAllNotificationsRead200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **markNotificationRead**
```swift
    open class func markNotificationRead(notificationId: String, completion: @escaping (_ data: MarkNotificationRead200Response?, _ error: Error?) -> Void)
```

Marcar notificação como lida (F1)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI

let notificationId = "notificationId_example" // String | 

// Marcar notificação como lida (F1)
EngajamentoAPI.markNotificationRead(notificationId: notificationId) { (response, error) in
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
 **notificationId** | **String** |  | 

### Return type

[**MarkNotificationRead200Response**](MarkNotificationRead200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **sendChatMessage**
```swift
    open class func sendChatMessage(sendChatMessageRequest: SendChatMessageRequest, completion: @escaping (_ data: SendChatMessage201Response?, _ error: Error?) -> Void)
```

Enviar mensagem ao chat (F3)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI

let sendChatMessageRequest = sendChatMessage_request(text: "text_example") // SendChatMessageRequest | 

// Enviar mensagem ao chat (F3)
EngajamentoAPI.sendChatMessage(sendChatMessageRequest: sendChatMessageRequest) { (response, error) in
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
 **sendChatMessageRequest** | [**SendChatMessageRequest**](SendChatMessageRequest.md) |  | 

### Return type

[**SendChatMessage201Response**](SendChatMessage201Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

