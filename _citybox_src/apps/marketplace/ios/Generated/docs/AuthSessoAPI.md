# AuthSessoAPI

All URIs are relative to *http://127.0.0.1:4010*

Method | HTTP request | Description
------------- | ------------- | -------------
[**forgotPassword**](AuthSessoAPI.md#forgotpassword) | **POST** /auth/forgot-password | Solicitar redefinição de senha (A2)
[**getSession**](AuthSessoAPI.md#getsession) | **GET** /auth/session | Restaurar sessão (Splash → auto-login)
[**login**](AuthSessoAPI.md#login) | **POST** /auth/login | Login com e-mail/telefone e senha
[**loginGoogle**](AuthSessoAPI.md#logingoogle) | **POST** /auth/google | Login com Google (A1)
[**logout**](AuthSessoAPI.md#logout) | **POST** /auth/logout | Logout
[**onboardingPostLogin**](AuthSessoAPI.md#onboardingpostlogin) | **PATCH** /me/onboarding | Sincronizar onboarding (pós-login, A3)
[**onboardingPreLogin**](AuthSessoAPI.md#onboardingprelogin) | **POST** /auth/onboarding | Marcar onboarding visto (pré-login, A3)
[**refreshToken**](AuthSessoAPI.md#refreshtoken) | **POST** /auth/refresh | Renovar access token
[**register**](AuthSessoAPI.md#register) | **POST** /auth/register | Criar conta (A1)
[**resetPassword**](AuthSessoAPI.md#resetpassword) | **POST** /auth/reset-password | Redefinir senha via token do e-mail (A2)


# **forgotPassword**
```swift
    open class func forgotPassword(forgotPasswordRequest: ForgotPasswordRequest, completion: @escaping (_ data: ForgotPassword200Response?, _ error: Error?) -> Void)
```

Solicitar redefinição de senha (A2)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI

let forgotPasswordRequest = forgotPassword_request(email: "email_example") // ForgotPasswordRequest | 

// Solicitar redefinição de senha (A2)
AuthSessoAPI.forgotPassword(forgotPasswordRequest: forgotPasswordRequest) { (response, error) in
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
 **forgotPasswordRequest** | [**ForgotPasswordRequest**](ForgotPasswordRequest.md) |  | 

### Return type

[**ForgotPassword200Response**](ForgotPassword200Response.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getSession**
```swift
    open class func getSession(completion: @escaping (_ data: SessionEnvelope?, _ error: Error?) -> Void)
```

Restaurar sessão (Splash → auto-login)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI


// Restaurar sessão (Splash → auto-login)
AuthSessoAPI.getSession() { (response, error) in
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

[**SessionEnvelope**](SessionEnvelope.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **login**
```swift
    open class func login(loginRequest: LoginRequest, completion: @escaping (_ data: AuthEnvelope?, _ error: Error?) -> Void)
```

Login com e-mail/telefone e senha

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI

let loginRequest = LoginRequest(account: "account_example", password: "password_example", hasSeenOnboarding: false) // LoginRequest | 

// Login com e-mail/telefone e senha
AuthSessoAPI.login(loginRequest: loginRequest) { (response, error) in
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
 **loginRequest** | [**LoginRequest**](LoginRequest.md) |  | 

### Return type

[**AuthEnvelope**](AuthEnvelope.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **loginGoogle**
```swift
    open class func loginGoogle(loginGoogleRequest: LoginGoogleRequest, completion: @escaping (_ data: AuthEnvelope?, _ error: Error?) -> Void)
```

Login com Google (A1)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI

let loginGoogleRequest = loginGoogle_request(idToken: "idToken_example", hasSeenOnboarding: false) // LoginGoogleRequest | 

// Login com Google (A1)
AuthSessoAPI.loginGoogle(loginGoogleRequest: loginGoogleRequest) { (response, error) in
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
 **loginGoogleRequest** | [**LoginGoogleRequest**](LoginGoogleRequest.md) |  | 

### Return type

[**AuthEnvelope**](AuthEnvelope.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **logout**
```swift
    open class func logout(logoutRequest: LogoutRequest, completion: @escaping (_ data: Void?, _ error: Error?) -> Void)
```

Logout

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI

let logoutRequest = logout_request(refreshToken: "refreshToken_example") // LogoutRequest | 

// Logout
AuthSessoAPI.logout(logoutRequest: logoutRequest) { (response, error) in
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
 **logoutRequest** | [**LogoutRequest**](LogoutRequest.md) |  | 

### Return type

Void (empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **onboardingPostLogin**
```swift
    open class func onboardingPostLogin(onboardingPostLoginRequest: OnboardingPostLoginRequest, completion: @escaping (_ data: OnboardingEnvelope?, _ error: Error?) -> Void)
```

Sincronizar onboarding (pós-login, A3)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI

let onboardingPostLoginRequest = onboardingPostLogin_request(hasSeenOnboarding: false) // OnboardingPostLoginRequest | 

// Sincronizar onboarding (pós-login, A3)
AuthSessoAPI.onboardingPostLogin(onboardingPostLoginRequest: onboardingPostLoginRequest) { (response, error) in
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
 **onboardingPostLoginRequest** | [**OnboardingPostLoginRequest**](OnboardingPostLoginRequest.md) |  | 

### Return type

[**OnboardingEnvelope**](OnboardingEnvelope.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **onboardingPreLogin**
```swift
    open class func onboardingPreLogin(onboardingPreLoginRequest: OnboardingPreLoginRequest, completion: @escaping (_ data: OnboardingEnvelope?, _ error: Error?) -> Void)
```

Marcar onboarding visto (pré-login, A3)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI

let onboardingPreLoginRequest = onboardingPreLogin_request(deviceId: "deviceId_example", hasSeenOnboarding: false) // OnboardingPreLoginRequest | 

// Marcar onboarding visto (pré-login, A3)
AuthSessoAPI.onboardingPreLogin(onboardingPreLoginRequest: onboardingPreLoginRequest) { (response, error) in
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
 **onboardingPreLoginRequest** | [**OnboardingPreLoginRequest**](OnboardingPreLoginRequest.md) |  | 

### Return type

[**OnboardingEnvelope**](OnboardingEnvelope.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **refreshToken**
```swift
    open class func refreshToken(logoutRequest: LogoutRequest, completion: @escaping (_ data: RefreshToken200Response?, _ error: Error?) -> Void)
```

Renovar access token

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI

let logoutRequest = logout_request(refreshToken: "refreshToken_example") // LogoutRequest | 

// Renovar access token
AuthSessoAPI.refreshToken(logoutRequest: logoutRequest) { (response, error) in
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
 **logoutRequest** | [**LogoutRequest**](LogoutRequest.md) |  | 

### Return type

[**RefreshToken200Response**](RefreshToken200Response.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **register**
```swift
    open class func register(registerRequest: RegisterRequest, completion: @escaping (_ data: AuthEnvelope?, _ error: Error?) -> Void)
```

Criar conta (A1)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI

let registerRequest = RegisterRequest(name: "name_example", email: "email_example", phone: "phone_example", password: "password_example", confirmPassword: "confirmPassword_example", acceptedTerms: false, hasSeenOnboarding: false) // RegisterRequest | 

// Criar conta (A1)
AuthSessoAPI.register(registerRequest: registerRequest) { (response, error) in
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
 **registerRequest** | [**RegisterRequest**](RegisterRequest.md) |  | 

### Return type

[**AuthEnvelope**](AuthEnvelope.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **resetPassword**
```swift
    open class func resetPassword(resetPasswordRequest: ResetPasswordRequest, completion: @escaping (_ data: MessageEnvelope?, _ error: Error?) -> Void)
```

Redefinir senha via token do e-mail (A2)

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import CityBoxAPI

let resetPasswordRequest = resetPassword_request(token: "token_example", password: "password_example", confirmPassword: "confirmPassword_example") // ResetPasswordRequest | 

// Redefinir senha via token do e-mail (A2)
AuthSessoAPI.resetPassword(resetPasswordRequest: resetPasswordRequest) { (response, error) in
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
 **resetPasswordRequest** | [**ResetPasswordRequest**](ResetPasswordRequest.md) |  | 

### Return type

[**MessageEnvelope**](MessageEnvelope.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

