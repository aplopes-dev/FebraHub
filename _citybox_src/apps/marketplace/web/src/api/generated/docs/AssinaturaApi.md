# AssinaturaApi

All URIs are relative to *http://127.0.0.1:4010*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**cancelSubscription**](AssinaturaApi.md#cancelsubscriptionoperation) | **POST** /me/subscription/cancel | Cancelar assinatura (B8) |
| [**getSubscription**](AssinaturaApi.md#getsubscription) | **GET** /me/subscription | Assinatura CityBox+ (B8) |



## cancelSubscription

> CancelSubscription200Response cancelSubscription(cancelSubscriptionRequest)

Cancelar assinatura (B8)

### Example

```ts
import {
  Configuration,
  AssinaturaApi,
} from '@citybox/api-client';
import type { CancelSubscriptionOperationRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AssinaturaApi(config);

  const body = {
    // CancelSubscriptionRequest (optional)
    cancelSubscriptionRequest: ...,
  } satisfies CancelSubscriptionOperationRequest;

  try {
    const data = await api.cancelSubscription(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **cancelSubscriptionRequest** | [CancelSubscriptionRequest](CancelSubscriptionRequest.md) |  | [Optional] |

### Return type

[**CancelSubscription200Response**](CancelSubscription200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Assinatura cancelada |  -  |
| **401** | Token inválido ou expirado |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getSubscription

> GetSubscription200Response getSubscription()

Assinatura CityBox+ (B8)

### Example

```ts
import {
  Configuration,
  AssinaturaApi,
} from '@citybox/api-client';
import type { GetSubscriptionRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AssinaturaApi(config);

  try {
    const data = await api.getSubscription();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**GetSubscription200Response**](GetSubscription200Response.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Estado da assinatura |  -  |
| **401** | Token inválido ou expirado |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

