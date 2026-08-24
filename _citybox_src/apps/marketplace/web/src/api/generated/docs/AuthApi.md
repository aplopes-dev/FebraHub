# AuthApi

All URIs are relative to *http://127.0.0.1:4010*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**forgotPassword**](AuthApi.md#forgotpasswordoperation) | **POST** /auth/forgot-password | Solicitar redefinição de senha (A2) |
| [**getSession**](AuthApi.md#getsession) | **GET** /auth/session | Restaurar sessão (Splash → auto-login) |
| [**login**](AuthApi.md#loginoperation) | **POST** /auth/login | Login com e-mail/telefone e senha |
| [**loginGoogle**](AuthApi.md#logingoogleoperation) | **POST** /auth/google | Login com Google (A1) |
| [**logout**](AuthApi.md#logoutoperation) | **POST** /auth/logout | Logout |
| [**onboardingPostLogin**](AuthApi.md#onboardingpostloginoperation) | **PATCH** /me/onboarding | Sincronizar onboarding (pós-login, A3) |
| [**onboardingPreLogin**](AuthApi.md#onboardingpreloginoperation) | **POST** /auth/onboarding | Marcar onboarding visto (pré-login, A3) |
| [**refreshToken**](AuthApi.md#refreshtoken) | **POST** /auth/refresh | Renovar access token |
| [**register**](AuthApi.md#registeroperation) | **POST** /auth/register | Criar conta (A1) |
| [**resetPassword**](AuthApi.md#resetpasswordoperation) | **POST** /auth/reset-password | Redefinir senha via token do e-mail (A2) |



## forgotPassword

> ForgotPasswordEnvelope forgotPassword(forgotPasswordRequest)

Solicitar redefinição de senha (A2)

Fluxo A2 — Login → \&quot;Esqueci minha senha\&quot; (&#x60;/esqueci-senha&#x60;). Resposta sempre genérica (segurança). No mock web, após \&quot;E-mail enviado ✓\&quot;, CTA opcional para &#x60;/redefinir-senha?token&#x3D;mock-reset-token&#x60;. 

### Example

```ts
import {
  Configuration,
  AuthApi,
} from '@citybox/api-client';
import type { ForgotPasswordOperationRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const api = new AuthApi();

  const body = {
    // ForgotPasswordRequest
    forgotPasswordRequest: {"email":"camila@email.com"},
  } satisfies ForgotPasswordOperationRequest;

  try {
    const data = await api.forgotPassword(body);
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
| **forgotPasswordRequest** | [ForgotPasswordRequest](ForgotPasswordRequest.md) |  | |

### Return type

[**ForgotPasswordEnvelope**](ForgotPasswordEnvelope.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Resposta genérica (segurança) |  -  |
| **422** | Erro de validação |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getSession

> SessionEnvelope getSession()

Restaurar sessão (Splash → auto-login)

### Example

```ts
import {
  Configuration,
  AuthApi,
} from '@citybox/api-client';
import type { GetSessionRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AuthApi(config);

  try {
    const data = await api.getSession();
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

[**SessionEnvelope**](SessionEnvelope.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Sessão válida |  -  |
| **401** | Token inválido ou expirado |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## login

> AuthEnvelope login(loginRequest)

Login com e-mail/telefone e senha

### Example

```ts
import {
  Configuration,
  AuthApi,
} from '@citybox/api-client';
import type { LoginOperationRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const api = new AuthApi();

  const body = {
    // LoginRequest
    loginRequest: {"account":"camila@email.com","password":"123456","hasSeenOnboarding":true},
  } satisfies LoginOperationRequest;

  try {
    const data = await api.login(body);
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
| **loginRequest** | [LoginRequest](LoginRequest.md) |  | |

### Return type

[**AuthEnvelope**](AuthEnvelope.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Autenticado |  -  |
| **401** | Credenciais inválidas |  -  |
| **422** | Erro de validação |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## loginGoogle

> AuthEnvelope loginGoogle(loginGoogleRequest)

Login com Google (A1)

### Example

```ts
import {
  Configuration,
  AuthApi,
} from '@citybox/api-client';
import type { LoginGoogleOperationRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const api = new AuthApi();

  const body = {
    // LoginGoogleRequest
    loginGoogleRequest: ...,
  } satisfies LoginGoogleOperationRequest;

  try {
    const data = await api.loginGoogle(body);
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
| **loginGoogleRequest** | [LoginGoogleRequest](LoginGoogleRequest.md) |  | |

### Return type

[**AuthEnvelope**](AuthEnvelope.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Autenticado |  -  |
| **400** | Requisição inválida (parâmetros malformados) |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## logout

> logout(logoutRequest)

Logout

### Example

```ts
import {
  Configuration,
  AuthApi,
} from '@citybox/api-client';
import type { LogoutOperationRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AuthApi(config);

  const body = {
    // LogoutRequest
    logoutRequest: ...,
  } satisfies LogoutOperationRequest;

  try {
    const data = await api.logout(body);
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
| **logoutRequest** | [LogoutRequest](LogoutRequest.md) |  | |

### Return type

`void` (Empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **204** | Sessão encerrada |  -  |
| **401** | Token inválido ou expirado |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## onboardingPostLogin

> OnboardingEnvelope onboardingPostLogin(onboardingPostLoginRequest)

Sincronizar onboarding (pós-login, A3)

### Example

```ts
import {
  Configuration,
  AuthApi,
} from '@citybox/api-client';
import type { OnboardingPostLoginOperationRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AuthApi(config);

  const body = {
    // OnboardingPostLoginRequest
    onboardingPostLoginRequest: ...,
  } satisfies OnboardingPostLoginOperationRequest;

  try {
    const data = await api.onboardingPostLogin(body);
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
| **onboardingPostLoginRequest** | [OnboardingPostLoginRequest](OnboardingPostLoginRequest.md) |  | |

### Return type

[**OnboardingEnvelope**](OnboardingEnvelope.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | OK |  -  |
| **401** | Token inválido ou expirado |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## onboardingPreLogin

> OnboardingEnvelope onboardingPreLogin(onboardingPreLoginRequest)

Marcar onboarding visto (pré-login, A3)

### Example

```ts
import {
  Configuration,
  AuthApi,
} from '@citybox/api-client';
import type { OnboardingPreLoginOperationRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const api = new AuthApi();

  const body = {
    // OnboardingPreLoginRequest
    onboardingPreLoginRequest: ...,
  } satisfies OnboardingPreLoginOperationRequest;

  try {
    const data = await api.onboardingPreLogin(body);
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
| **onboardingPreLoginRequest** | [OnboardingPreLoginRequest](OnboardingPreLoginRequest.md) |  | |

### Return type

[**OnboardingEnvelope**](OnboardingEnvelope.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | OK |  -  |
| **400** | Requisição inválida (parâmetros malformados) |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## refreshToken

> RefreshToken200Response refreshToken(logoutRequest)

Renovar access token

### Example

```ts
import {
  Configuration,
  AuthApi,
} from '@citybox/api-client';
import type { RefreshTokenRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const api = new AuthApi();

  const body = {
    // LogoutRequest
    logoutRequest: ...,
  } satisfies RefreshTokenRequest;

  try {
    const data = await api.refreshToken(body);
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
| **logoutRequest** | [LogoutRequest](LogoutRequest.md) |  | |

### Return type

[**RefreshToken200Response**](RefreshToken200Response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Novo access token |  -  |
| **401** | Token inválido ou expirado |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## register

> AuthEnvelope register(registerRequest)

Criar conta (A1)

### Example

```ts
import {
  Configuration,
  AuthApi,
} from '@citybox/api-client';
import type { RegisterOperationRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const api = new AuthApi();

  const body = {
    // RegisterRequest
    registerRequest: ...,
  } satisfies RegisterOperationRequest;

  try {
    const data = await api.register(body);
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
| **registerRequest** | [RegisterRequest](RegisterRequest.md) |  | |

### Return type

[**AuthEnvelope**](AuthEnvelope.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** | Conta criada e autenticada |  -  |
| **409** | E-mail já cadastrado |  -  |
| **422** | Erro de validação |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## resetPassword

> MessageEnvelope resetPassword(resetPasswordRequest)

Redefinir senha via token do e-mail (A2)

Fluxo A2 — link do e-mail abre &#x60;/redefinir-senha?token&#x3D;{token}&#x60; (web, sem auth). Token mock MSW: &#x60;mock-reset-token&#x60;. Após sucesso, tela exibe \&quot;Senha alterada\&quot; e redireciona ao login. 

### Example

```ts
import {
  Configuration,
  AuthApi,
} from '@citybox/api-client';
import type { ResetPasswordOperationRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const api = new AuthApi();

  const body = {
    // ResetPasswordRequest
    resetPasswordRequest: {"token":"mock-reset-token","password":"novaSenha123","confirmPassword":"novaSenha123"},
  } satisfies ResetPasswordOperationRequest;

  try {
    const data = await api.resetPassword(body);
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
| **resetPasswordRequest** | [ResetPasswordRequest](ResetPasswordRequest.md) |  | |

### Return type

[**MessageEnvelope**](MessageEnvelope.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Senha alterada |  -  |
| **422** | Erro de validação (senhas diferentes, senha curta, token inválido) |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

