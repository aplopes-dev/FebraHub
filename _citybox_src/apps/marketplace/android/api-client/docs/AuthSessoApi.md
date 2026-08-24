# AuthSessoApi

All URIs are relative to *http://127.0.0.1:4010*

| Method | HTTP request | Description |
| ------------- | ------------- | ------------- |
| [**forgotPassword**](AuthSessoApi.md#forgotPassword) | **POST** auth/forgot-password | Solicitar redefinição de senha (A2) |
| [**getSession**](AuthSessoApi.md#getSession) | **GET** auth/session | Restaurar sessão (Splash → auto-login) |
| [**login**](AuthSessoApi.md#login) | **POST** auth/login | Login com e-mail/telefone e senha |
| [**loginGoogle**](AuthSessoApi.md#loginGoogle) | **POST** auth/google | Login com Google (A1) |
| [**logout**](AuthSessoApi.md#logout) | **POST** auth/logout | Logout |
| [**onboardingPostLogin**](AuthSessoApi.md#onboardingPostLogin) | **PATCH** me/onboarding | Sincronizar onboarding (pós-login, A3) |
| [**onboardingPreLogin**](AuthSessoApi.md#onboardingPreLogin) | **POST** auth/onboarding | Marcar onboarding visto (pré-login, A3) |
| [**refreshToken**](AuthSessoApi.md#refreshToken) | **POST** auth/refresh | Renovar access token |
| [**register**](AuthSessoApi.md#register) | **POST** auth/register | Criar conta (A1) |
| [**resetPassword**](AuthSessoApi.md#resetPassword) | **POST** auth/reset-password | Redefinir senha via token do e-mail (A2) |



Solicitar redefinição de senha (A2)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
val webService = apiClient.createWebservice(AuthSessoApi::class.java)
val forgotPasswordRequest : ForgotPasswordRequest =  // ForgotPasswordRequest | 

val result : ForgotPassword200Response = webService.forgotPassword(forgotPasswordRequest)
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **forgotPasswordRequest** | [**ForgotPasswordRequest**](ForgotPasswordRequest.md)|  | |

### Return type

[**ForgotPassword200Response**](ForgotPassword200Response.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


Restaurar sessão (Splash → auto-login)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(AuthSessoApi::class.java)

val result : SessionEnvelope = webService.getSession()
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**SessionEnvelope**](SessionEnvelope.md)

### Authorization


Configure bearerAuth:
    ApiClient().setBearerToken("TOKEN")

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


Login com e-mail/telefone e senha

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
val webService = apiClient.createWebservice(AuthSessoApi::class.java)
val loginRequest : LoginRequest = {"account":"camila@email.com","password":"123456","hasSeenOnboarding":true} // LoginRequest | 

val result : AuthEnvelope = webService.login(loginRequest)
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **loginRequest** | [**LoginRequest**](LoginRequest.md)|  | |

### Return type

[**AuthEnvelope**](AuthEnvelope.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


Login com Google (A1)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
val webService = apiClient.createWebservice(AuthSessoApi::class.java)
val loginGoogleRequest : LoginGoogleRequest =  // LoginGoogleRequest | 

val result : AuthEnvelope = webService.loginGoogle(loginGoogleRequest)
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **loginGoogleRequest** | [**LoginGoogleRequest**](LoginGoogleRequest.md)|  | |

### Return type

[**AuthEnvelope**](AuthEnvelope.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


Logout

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(AuthSessoApi::class.java)
val logoutRequest : LogoutRequest =  // LogoutRequest | 

webService.logout(logoutRequest)
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **logoutRequest** | [**LogoutRequest**](LogoutRequest.md)|  | |

### Return type

null (empty response body)

### Authorization


Configure bearerAuth:
    ApiClient().setBearerToken("TOKEN")

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


Sincronizar onboarding (pós-login, A3)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
apiClient.setBearerToken("TOKEN")
val webService = apiClient.createWebservice(AuthSessoApi::class.java)
val onboardingPostLoginRequest : OnboardingPostLoginRequest =  // OnboardingPostLoginRequest | 

val result : OnboardingEnvelope = webService.onboardingPostLogin(onboardingPostLoginRequest)
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **onboardingPostLoginRequest** | [**OnboardingPostLoginRequest**](OnboardingPostLoginRequest.md)|  | |

### Return type

[**OnboardingEnvelope**](OnboardingEnvelope.md)

### Authorization


Configure bearerAuth:
    ApiClient().setBearerToken("TOKEN")

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


Marcar onboarding visto (pré-login, A3)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
val webService = apiClient.createWebservice(AuthSessoApi::class.java)
val onboardingPreLoginRequest : OnboardingPreLoginRequest =  // OnboardingPreLoginRequest | 

val result : OnboardingEnvelope = webService.onboardingPreLogin(onboardingPreLoginRequest)
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **onboardingPreLoginRequest** | [**OnboardingPreLoginRequest**](OnboardingPreLoginRequest.md)|  | |

### Return type

[**OnboardingEnvelope**](OnboardingEnvelope.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


Renovar access token

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
val webService = apiClient.createWebservice(AuthSessoApi::class.java)
val logoutRequest : LogoutRequest =  // LogoutRequest | 

val result : RefreshToken200Response = webService.refreshToken(logoutRequest)
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **logoutRequest** | [**LogoutRequest**](LogoutRequest.md)|  | |

### Return type

[**RefreshToken200Response**](RefreshToken200Response.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


Criar conta (A1)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
val webService = apiClient.createWebservice(AuthSessoApi::class.java)
val registerRequest : RegisterRequest =  // RegisterRequest | 

val result : AuthEnvelope = webService.register(registerRequest)
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **registerRequest** | [**RegisterRequest**](RegisterRequest.md)|  | |

### Return type

[**AuthEnvelope**](AuthEnvelope.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


Redefinir senha via token do e-mail (A2)

### Example
```kotlin
// Import classes:
//import com.citybox.api.*
//import com.citybox.api.infrastructure.*
//import com.citybox.api.models.*

val apiClient = ApiClient()
val webService = apiClient.createWebservice(AuthSessoApi::class.java)
val resetPasswordRequest : ResetPasswordRequest =  // ResetPasswordRequest | 

val result : MessageEnvelope = webService.resetPassword(resetPasswordRequest)
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **resetPasswordRequest** | [**ResetPasswordRequest**](ResetPasswordRequest.md)|  | |

### Return type

[**MessageEnvelope**](MessageEnvelope.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

