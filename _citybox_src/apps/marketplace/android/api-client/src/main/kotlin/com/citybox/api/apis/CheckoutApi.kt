package com.citybox.api.apis

import com.citybox.api.infrastructure.CollectionFormats.*
import retrofit2.http.*
import retrofit2.Call
import okhttp3.RequestBody
import com.google.gson.annotations.SerializedName

import com.citybox.api.models.CheckoutPreview200Response
import com.citybox.api.models.CheckoutPreviewRequest
import com.citybox.api.models.CheckoutSessionEnvelope
import com.citybox.api.models.CreateOrder201Response
import com.citybox.api.models.CreateOrderRequest
import com.citybox.api.models.ErrorEnvelope
import com.citybox.api.models.GetShippingOptions200Response
import com.citybox.api.models.GetShippingOptionsRequest
import com.citybox.api.models.ListCoupons200Response
import com.citybox.api.models.RemoveCoupon200Response
import com.citybox.api.models.UpdateCheckoutSessionRequest
import com.citybox.api.models.ValidateCoupon200Response
import com.citybox.api.models.ValidateCouponRequest

interface CheckoutApi {
    /**
     * POST checkout/preview
     * Resumo do checkout sem persistir
     * 
     * Responses:
     *  - 200: Preview detalhado
     *  - 401: Token inválido ou expirado
     *
     * @param checkoutPreviewRequest 
     * @return [Call]<[CheckoutPreview200Response]>
     */
    @POST("checkout/preview")
    fun checkoutPreview(@Body checkoutPreviewRequest: CheckoutPreviewRequest): Call<CheckoutPreview200Response>

    /**
     * POST checkout/orders
     * Confirmar pedido (C4/C5)
     * Aceita body completo ou sessão já preenchida. &#x60;buyNow: true&#x60; substitui o carrinho pelos itens informados. 
     * Responses:
     *  - 201: Pedido criado
     *  - 402: Pagamento recusado
     *  - 422: Checkout inválido (faltam dados)
     *
     * @param idempotencyKey UUID v4 para evitar pedido duplicado em retry
     * @param createOrderRequest 
     * @return [Call]<[CreateOrder201Response]>
     */
    @POST("checkout/orders")
    fun createOrder(@Header("Idempotency-Key") idempotencyKey: java.util.UUID, @Body createOrderRequest: CreateOrderRequest): Call<CreateOrder201Response>

    /**
     * GET checkout/session
     * Obter sessão de checkout
     * 
     * Responses:
     *  - 200: Carrinho + sessão + preview
     *  - 401: Token inválido ou expirado
     *
     * @return [Call]<[CheckoutSessionEnvelope]>
     */
    @GET("checkout/session")
    fun getCheckoutSession(): Call<CheckoutSessionEnvelope>

    /**
     * POST checkout/shipping-options
     * Cotar opções de envio (C2)
     * 
     * Responses:
     *  - 200: Opções + mensagem de frete
     *  - 401: Token inválido ou expirado
     *
     * @param getShippingOptionsRequest 
     * @return [Call]<[GetShippingOptions200Response]>
     */
    @POST("checkout/shipping-options")
    fun getShippingOptions(@Body getShippingOptionsRequest: GetShippingOptionsRequest): Call<GetShippingOptions200Response>

    /**
     * GET me/coupons
     * Cupons disponíveis (C3)
     * 
     * Responses:
     *  - 200: Lista de cupons
     *  - 401: Token inválido ou expirado
     *
     * @return [Call]<[ListCoupons200Response]>
     */
    @GET("me/coupons")
    fun listCoupons(): Call<ListCoupons200Response>

    /**
     * DELETE checkout/coupons
     * Remover cupom aplicado (C3)
     * 
     * Responses:
     *  - 200: Cupom removido (preview recalculado)
     *  - 401: Token inválido ou expirado
     *
     * @return [Call]<[RemoveCoupon200Response]>
     */
    @DELETE("checkout/coupons")
    fun removeCoupon(): Call<RemoveCoupon200Response>

    /**
     * PATCH checkout/session
     * Atualizar sessão (endereço/envio/pagamento)
     * 
     * Responses:
     *  - 200: Sessão atualizada (preview recalculado)
     *  - 401: Token inválido ou expirado
     *
     * @param updateCheckoutSessionRequest 
     * @return [Call]<[CheckoutSessionEnvelope]>
     */
    @PATCH("checkout/session")
    fun updateCheckoutSession(@Body updateCheckoutSessionRequest: UpdateCheckoutSessionRequest): Call<CheckoutSessionEnvelope>

    /**
     * POST checkout/coupons/validate
     * Validar/aplicar cupom (C3)
     * 
     * Responses:
     *  - 200: Cupom válido
     *  - 404: Cupom não encontrado
     *  - 422: Cupom expirado ou não aplicável
     *
     * @param validateCouponRequest 
     * @return [Call]<[ValidateCoupon200Response]>
     */
    @POST("checkout/coupons/validate")
    fun validateCoupon(@Body validateCouponRequest: ValidateCouponRequest): Call<ValidateCoupon200Response>

}
