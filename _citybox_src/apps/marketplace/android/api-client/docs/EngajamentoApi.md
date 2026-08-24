# EngajamentoApi

All URIs are relative to *http://127.0.0.1:4010*

| Method | HTTP request | Description |
| ------------- | ------------- | ------------- |
| [**createTicket**](EngajamentoApi.md#createTicket) | **POST** me/support/tickets | Abrir ticket de suporte (F3 alt) |
| [**getChatMessages**](EngajamentoApi.md#getChatMessages) | **GET** me/support/chat/messages | Histórico do chat (F3) |
| [**getFaq**](EngajamentoApi.md#getFaq) | **GET** support/faq | FAQ / Ajuda (F2) |
| [**listNotifications**](EngajamentoApi.md#listNotifications) | **GET** me/notifications | Listar notificações (F1) |
| [**markAllNotificationsRead**](EngajamentoApi.md#markAllNotificationsRead) | **POST** me/notifications/read-all | Marcar todas como lidas (F1) |
| [**markNotificationRead**](EngajamentoApi.md#markNotificationRead) | **PATCH** me/notifications/{notificationId}/read | Marcar notificação como lida (F1) |
| [**sendChatMessage**](EngajamentoApi.md#sendChatMessage) | **POST** me/support/chat/messages | Enviar mensagem ao chat (F3) |



Abrir ticket de suporte (F3 alt)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(EngajamentoApi::class.java)
val createTicketRequest : CreateTicketRequest =  // CreateTicketRequest | 

val result : CreateTicket201Response = webService.createTicket(createTicketRequest)
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **createTicketRequest** | [**CreateTicketRequest**](CreateTicketRequest.md)|  | |

### Return type

[**CreateTicket201Response**](CreateTicket201Response.md)

### Authorization


Configure bearerAuth:
    ApiClient().setBearerToken("TOKEN")

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


Histórico do chat (F3)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(EngajamentoApi::class.java)
val before : kotlin.String = before_example // kotlin.String | 
val limit : kotlin.Int = 56 // kotlin.Int | 

val result : GetChatMessages200Response = webService.getChatMessages(before, limit)
```

### Parameters
| **before** | **kotlin.String**|  | [optional] |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **limit** | **kotlin.Int**|  | [optional] |

### Return type

[**GetChatMessages200Response**](GetChatMessages200Response.md)

### Authorization


Configure bearerAuth:
    ApiClient().setBearerToken("TOKEN")

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


FAQ / Ajuda (F2)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
val webService = apiClient.createWebservice(EngajamentoApi::class.java)

val result : GetFaq200Response = webService.getFaq()
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


Listar notificações (F1)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(EngajamentoApi::class.java)
val page : kotlin.Int = 56 // kotlin.Int | 
val pageSize : kotlin.Int = 56 // kotlin.Int | 
val unreadOnly : kotlin.Boolean = true // kotlin.Boolean | 

val result : ListNotifications200Response = webService.listNotifications(page, pageSize, unreadOnly)
```

### Parameters
| **page** | **kotlin.Int**|  | [optional] [default to 1] |
| **pageSize** | **kotlin.Int**|  | [optional] [default to 20] |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **unreadOnly** | **kotlin.Boolean**|  | [optional] |

### Return type

[**ListNotifications200Response**](ListNotifications200Response.md)

### Authorization


Configure bearerAuth:
    ApiClient().setBearerToken("TOKEN")

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


Marcar todas como lidas (F1)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(EngajamentoApi::class.java)

val result : MarkAllNotificationsRead200Response = webService.markAllNotificationsRead()
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**MarkAllNotificationsRead200Response**](MarkAllNotificationsRead200Response.md)

### Authorization


Configure bearerAuth:
    ApiClient().setBearerToken("TOKEN")

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


Marcar notificação como lida (F1)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(EngajamentoApi::class.java)
val notificationId : kotlin.String = notificationId_example // kotlin.String | 

val result : MarkNotificationRead200Response = webService.markNotificationRead(notificationId)
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **notificationId** | **kotlin.String**|  | |

### Return type

[**MarkNotificationRead200Response**](MarkNotificationRead200Response.md)

### Authorization


Configure bearerAuth:
    ApiClient().setBearerToken("TOKEN")

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


Enviar mensagem ao chat (F3)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(EngajamentoApi::class.java)
val sendChatMessageRequest : SendChatMessageRequest =  // SendChatMessageRequest | 

val result : SendChatMessage201Response = webService.sendChatMessage(sendChatMessageRequest)
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **sendChatMessageRequest** | [**SendChatMessageRequest**](SendChatMessageRequest.md)|  | |

### Return type

[**SendChatMessage201Response**](SendChatMessage201Response.md)

### Authorization


Configure bearerAuth:
    ApiClient().setBearerToken("TOKEN")

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

