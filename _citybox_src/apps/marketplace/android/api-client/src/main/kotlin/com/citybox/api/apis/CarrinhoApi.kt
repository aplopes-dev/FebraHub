package com.citybox.api.apis

import com.citybox.api.infrastructure.CollectionFormats.*
import retrofit2.http.*
import retrofit2.Call
import okhttp3.RequestBody
import com.google.gson.annotations.SerializedName

import com.citybox.api.models.AddCartItemRequest
import com.citybox.api.models.ApplyCartCoupon200Response
import com.citybox.api.models.ApplyCartCouponRequest
import com.citybox.api.models.ErrorEnvelope
import com.citybox.api.models.GetCart200Response
import com.citybox.api.models.UpdateCartItemRequest

interface CarrinhoApi {
    /**
     * POST me/cart/items
     * Adicionar item ao carrinho
     * 
     * Responses:
     *  - 200: Carrinho atualizado
     *  - 401: Token inválido ou expirado
     *
     * @param addCartItemRequest 
     * @return [Call]<[GetCart200Response]>
     */
    @POST("me/cart/items")
    fun addCartItem(@Body addCartItemRequest: AddCartItemRequest): Call<GetCart200Response>

    /**
     * POST me/cart/coupon
     * Aplicar cupom via carrinho (alias)
     * 
     * Responses:
     *  - 200: Cupom aplicado
     *  - 404: Cupom não encontrado
     *  - 422: Cupom expirado ou não aplicável
     *
     * @param applyCartCouponRequest 
     * @return [Call]<[ApplyCartCoupon200Response]>
     */
    @POST("me/cart/coupon")
    fun applyCartCoupon(@Body applyCartCouponRequest: ApplyCartCouponRequest): Call<ApplyCartCoupon200Response>

    /**
     * DELETE me/cart
     * Limpar carrinho
     * 
     * Responses:
     *  - 204: Carrinho limpo
     *  - 401: Token inválido ou expirado
     *
     * @return [Call]<[Unit]>
     */
    @DELETE("me/cart")
    fun clearCart(): Call<Unit>

    /**
     * GET me/cart
     * Obter carrinho (+ badge)
     * 
     * Responses:
     *  - 200: Carrinho
     *  - 401: Token inválido ou expirado
     *
     * @return [Call]<[GetCart200Response]>
     */
    @GET("me/cart")
    fun getCart(): Call<GetCart200Response>

    /**
     * DELETE me/cart/items/{productId}
     * Remover item
     * 
     * Responses:
     *  - 200: Carrinho atualizado
     *  - 401: Token inválido ou expirado
     *  - 404: Recurso não encontrado
     *
     * @param productId 
     * @return [Call]<[GetCart200Response]>
     */
    @DELETE("me/cart/items/{productId}")
    fun removeCartItem(@Path("productId") productId: kotlin.String): Call<GetCart200Response>

    /**
     * PATCH me/cart/items/{productId}
     * Atualizar quantidade (0 remove)
     * 
     * Responses:
     *  - 200: Carrinho atualizado
     *  - 401: Token inválido ou expirado
     *  - 404: Recurso não encontrado
     *
     * @param productId 
     * @param updateCartItemRequest 
     * @return [Call]<[GetCart200Response]>
     */
    @PATCH("me/cart/items/{productId}")
    fun updateCartItem(@Path("productId") productId: kotlin.String, @Body updateCartItemRequest: UpdateCartItemRequest): Call<GetCart200Response>

}
