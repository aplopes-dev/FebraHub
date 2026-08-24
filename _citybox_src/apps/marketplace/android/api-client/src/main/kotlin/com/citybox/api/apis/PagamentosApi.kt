package com.citybox.api.apis

import com.citybox.api.infrastructure.CollectionFormats.*
import retrofit2.http.*
import retrofit2.Call
import okhttp3.RequestBody
import com.google.gson.annotations.SerializedName

import com.citybox.api.models.CreatePaymentMethod201Response
import com.citybox.api.models.CreatePaymentMethodRequest
import com.citybox.api.models.ErrorEnvelope
import com.citybox.api.models.ListPaymentMethods200Response
import com.citybox.api.models.SetDefaultPaymentMethod200Response

interface PagamentosApi {
    /**
     * POST me/payment-methods
     * Adicionar cartão (B5)
     * Backend tokeniza via gateway. Nunca persistir PAN/CVV em claro.
     * Responses:
     *  - 201: Cartão adicionado
     *  - 401: Token inválido ou expirado
     *
     * @param createPaymentMethodRequest 
     * @return [Call]<[CreatePaymentMethod201Response]>
     */
    @POST("me/payment-methods")
    fun createPaymentMethod(@Body createPaymentMethodRequest: CreatePaymentMethodRequest): Call<CreatePaymentMethod201Response>

    /**
     * DELETE me/payment-methods/{paymentMethodId}
     * Excluir cartão (B4)
     * 
     * Responses:
     *  - 204: Cartão excluído
     *  - 401: Token inválido ou expirado
     *  - 404: Recurso não encontrado
     *
     * @param paymentMethodId 
     * @return [Call]<[Unit]>
     */
    @DELETE("me/payment-methods/{paymentMethodId}")
    fun deletePaymentMethod(@Path("paymentMethodId") paymentMethodId: kotlin.String): Call<Unit>

    /**
     * GET me/payment-methods
     * Listar cartões (B4)
     * 
     * Responses:
     *  - 200: Lista de cartões
     *  - 401: Token inválido ou expirado
     *
     * @return [Call]<[ListPaymentMethods200Response]>
     */
    @GET("me/payment-methods")
    fun listPaymentMethods(): Call<ListPaymentMethods200Response>

    /**
     * PATCH me/payment-methods/{paymentMethodId}/default
     * Definir cartão padrão (B4/C5)
     * 
     * Responses:
     *  - 200: Cartão padrão definido
     *  - 401: Token inválido ou expirado
     *  - 404: Recurso não encontrado
     *
     * @param paymentMethodId 
     * @return [Call]<[SetDefaultPaymentMethod200Response]>
     */
    @PATCH("me/payment-methods/{paymentMethodId}/default")
    fun setDefaultPaymentMethod(@Path("paymentMethodId") paymentMethodId: kotlin.String): Call<SetDefaultPaymentMethod200Response>

}
