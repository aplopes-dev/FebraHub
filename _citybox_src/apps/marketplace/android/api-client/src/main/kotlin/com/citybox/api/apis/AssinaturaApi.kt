package com.citybox.api.apis

import com.citybox.api.infrastructure.CollectionFormats.*
import retrofit2.http.*
import retrofit2.Call
import okhttp3.RequestBody
import com.google.gson.annotations.SerializedName

import com.citybox.api.models.CancelSubscription200Response
import com.citybox.api.models.CancelSubscriptionRequest
import com.citybox.api.models.ErrorEnvelope
import com.citybox.api.models.GetSubscription200Response

interface AssinaturaApi {
    /**
     * POST me/subscription/cancel
     * Cancelar assinatura (B8)
     * 
     * Responses:
     *  - 200: Assinatura cancelada
     *  - 401: Token inválido ou expirado
     *
     * @param cancelSubscriptionRequest  (optional)
     * @return [Call]<[CancelSubscription200Response]>
     */
    @POST("me/subscription/cancel")
    fun cancelSubscription(@Body cancelSubscriptionRequest: CancelSubscriptionRequest? = null): Call<CancelSubscription200Response>

    /**
     * GET me/subscription
     * Assinatura CityBox+ (B8)
     * 
     * Responses:
     *  - 200: Estado da assinatura
     *  - 401: Token inválido ou expirado
     *
     * @return [Call]<[GetSubscription200Response]>
     */
    @GET("me/subscription")
    fun getSubscription(): Call<GetSubscription200Response>

}
