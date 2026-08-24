package com.citybox.api.apis

import com.citybox.api.infrastructure.CollectionFormats.*
import retrofit2.http.*
import retrofit2.Call
import okhttp3.RequestBody
import com.google.gson.annotations.SerializedName

import com.citybox.api.models.AuthEnvelope
import com.citybox.api.models.ErrorEnvelope
import com.citybox.api.models.ForgotPassword200Response
import com.citybox.api.models.ForgotPasswordRequest
import com.citybox.api.models.LoginGoogleRequest
import com.citybox.api.models.LoginRequest
import com.citybox.api.models.LogoutRequest
import com.citybox.api.models.MessageEnvelope
import com.citybox.api.models.OnboardingEnvelope
import com.citybox.api.models.OnboardingPostLoginRequest
import com.citybox.api.models.OnboardingPreLoginRequest
import com.citybox.api.models.RefreshToken200Response
import com.citybox.api.models.RegisterRequest
import com.citybox.api.models.ResetPasswordRequest
import com.citybox.api.models.SessionEnvelope

interface AuthApi {
    /**
     * POST auth/forgot-password
     * Solicitar redefinição de senha (A2)
     * 
     * Responses:
     *  - 200: Resposta genérica (segurança)
     *  - 400: Requisição inválida (parâmetros malformados)
     *
     * @param forgotPasswordRequest 
     * @return [Call]<[ForgotPassword200Response]>
     */
    @POST("auth/forgot-password")
    fun forgotPassword(@Body forgotPasswordRequest: ForgotPasswordRequest): Call<ForgotPassword200Response>

    /**
     * GET auth/session
     * Restaurar sessão (Splash → auto-login)
     * 
     * Responses:
     *  - 200: Sessão válida
     *  - 401: Token inválido ou expirado
     *
     * @return [Call]<[SessionEnvelope]>
     */
    @GET("auth/session")
    fun getSession(): Call<SessionEnvelope>

    /**
     * POST auth/login
     * Login com e-mail/telefone e senha
     * 
     * Responses:
     *  - 200: Autenticado
     *  - 401: Credenciais inválidas
     *  - 422: Erro de validação
     *
     * @param loginRequest 
     * @return [Call]<[AuthEnvelope]>
     */
    @POST("auth/login")
    fun login(@Body loginRequest: LoginRequest): Call<AuthEnvelope>

    /**
     * POST auth/google
     * Login com Google (A1)
     * 
     * Responses:
     *  - 200: Autenticado
     *  - 400: Requisição inválida (parâmetros malformados)
     *
     * @param loginGoogleRequest 
     * @return [Call]<[AuthEnvelope]>
     */
    @POST("auth/google")
    fun loginGoogle(@Body loginGoogleRequest: LoginGoogleRequest): Call<AuthEnvelope>

    /**
     * POST auth/logout
     * Logout
     * 
     * Responses:
     *  - 204: Sessão encerrada
     *  - 401: Token inválido ou expirado
     *
     * @param logoutRequest 
     * @return [Call]<[Unit]>
     */
    @POST("auth/logout")
    fun logout(@Body logoutRequest: LogoutRequest): Call<Unit>

    /**
     * PATCH me/onboarding
     * Sincronizar onboarding (pós-login, A3)
     * 
     * Responses:
     *  - 200: OK
     *  - 401: Token inválido ou expirado
     *
     * @param onboardingPostLoginRequest 
     * @return [Call]<[OnboardingEnvelope]>
     */
    @PATCH("me/onboarding")
    fun onboardingPostLogin(@Body onboardingPostLoginRequest: OnboardingPostLoginRequest): Call<OnboardingEnvelope>

    /**
     * POST auth/onboarding
     * Marcar onboarding visto (pré-login, A3)
     * 
     * Responses:
     *  - 200: OK
     *  - 400: Requisição inválida (parâmetros malformados)
     *
     * @param onboardingPreLoginRequest 
     * @return [Call]<[OnboardingEnvelope]>
     */
    @POST("auth/onboarding")
    fun onboardingPreLogin(@Body onboardingPreLoginRequest: OnboardingPreLoginRequest): Call<OnboardingEnvelope>

    /**
     * POST auth/refresh
     * Renovar access token
     * 
     * Responses:
     *  - 200: Novo access token
     *  - 401: Token inválido ou expirado
     *
     * @param logoutRequest 
     * @return [Call]<[RefreshToken200Response]>
     */
    @POST("auth/refresh")
    fun refreshToken(@Body logoutRequest: LogoutRequest): Call<RefreshToken200Response>

    /**
     * POST auth/register
     * Criar conta (A1)
     * 
     * Responses:
     *  - 201: Conta criada e autenticada
     *  - 409: E-mail já cadastrado
     *  - 422: Erro de validação
     *
     * @param registerRequest 
     * @return [Call]<[AuthEnvelope]>
     */
    @POST("auth/register")
    fun register(@Body registerRequest: RegisterRequest): Call<AuthEnvelope>

    /**
     * POST auth/reset-password
     * Redefinir senha via token do e-mail (A2)
     * 
     * Responses:
     *  - 200: Senha alterada
     *  - 422: Erro de validação
     *
     * @param resetPasswordRequest 
     * @return [Call]<[MessageEnvelope]>
     */
    @POST("auth/reset-password")
    fun resetPassword(@Body resetPasswordRequest: ResetPasswordRequest): Call<MessageEnvelope>

}
