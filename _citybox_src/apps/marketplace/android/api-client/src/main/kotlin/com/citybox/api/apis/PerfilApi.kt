package com.citybox.api.apis

import com.citybox.api.infrastructure.CollectionFormats.*
import retrofit2.http.*
import retrofit2.Call
import okhttp3.RequestBody
import com.google.gson.annotations.SerializedName

import com.citybox.api.models.DeleteAccountRequest
import com.citybox.api.models.ErrorEnvelope
import com.citybox.api.models.GetMe200Response
import com.citybox.api.models.GetSettings200Response
import com.citybox.api.models.Settings
import com.citybox.api.models.UpdateMeRequest
import com.citybox.api.models.UploadAvatar200Response

import okhttp3.MultipartBody

interface PerfilApi {
    /**
     * DELETE me
     * Excluir conta (B6)
     * 
     * Responses:
     *  - 204: Conta excluída
     *  - 401: Token inválido ou expirado
     *
     * @param deleteAccountRequest 
     * @return [Call]<[Unit]>
     */
    @DELETE("me")
    fun deleteAccount(@Body deleteAccountRequest: DeleteAccountRequest): Call<Unit>

    /**
     * GET me
     * Obter perfil (B1)
     * 
     * Responses:
     *  - 200: Perfil
     *  - 401: Token inválido ou expirado
     *
     * @return [Call]<[GetMe200Response]>
     */
    @GET("me")
    fun getMe(): Call<GetMe200Response>

    /**
     * GET me/settings
     * Obter configurações (B6)
     * 
     * Responses:
     *  - 200: Configurações
     *  - 401: Token inválido ou expirado
     *
     * @return [Call]<[GetSettings200Response]>
     */
    @GET("me/settings")
    fun getSettings(): Call<GetSettings200Response>

    /**
     * PATCH me
     * Editar perfil (B1)
     * 
     * Responses:
     *  - 200: Perfil atualizado
     *  - 401: Token inválido ou expirado
     *
     * @param updateMeRequest 
     * @return [Call]<[GetMe200Response]>
     */
    @PATCH("me")
    fun updateMe(@Body updateMeRequest: UpdateMeRequest): Call<GetMe200Response>

    /**
     * PATCH me/settings
     * Atualizar configurações (B6)
     * 
     * Responses:
     *  - 200: Configurações atualizadas
     *  - 401: Token inválido ou expirado
     *
     * @param settings 
     * @return [Call]<[GetSettings200Response]>
     */
    @PATCH("me/settings")
    fun updateSettings(@Body settings: Settings): Call<GetSettings200Response>

    /**
     * POST me/avatar
     * Upload de avatar (B1)
     * 
     * Responses:
     *  - 200: Avatar atualizado
     *  - 401: Token inválido ou expirado
     *
     * @param file  (optional)
     * @return [Call]<[UploadAvatar200Response]>
     */
    @Multipart
    @POST("me/avatar")
    fun uploadAvatar(@Part file: MultipartBody.Part? = null): Call<UploadAvatar200Response>

}
