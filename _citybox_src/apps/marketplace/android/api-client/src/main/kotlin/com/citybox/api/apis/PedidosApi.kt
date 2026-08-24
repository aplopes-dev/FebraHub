package com.citybox.api.apis

import com.citybox.api.infrastructure.CollectionFormats.*
import retrofit2.http.*
import retrofit2.Call
import okhttp3.RequestBody
import com.google.gson.annotations.SerializedName

import com.citybox.api.models.BuyAgain200Response
import com.citybox.api.models.CancelOrderRequest
import com.citybox.api.models.CreateReturn201Response
import com.citybox.api.models.CreateReturnRequest
import com.citybox.api.models.ErrorEnvelope
import com.citybox.api.models.GetInvoice200Response
import com.citybox.api.models.GetOrder200Response
import com.citybox.api.models.GetReturn200Response
import com.citybox.api.models.GetTracking200Response
import com.citybox.api.models.ListOrders200Response
import com.citybox.api.models.OrderStatus

interface PedidosApi {
    /**
     * POST me/orders/{orderId}/buy-again
     * Comprar novamente (D1)
     * Adiciona os itens do pedido ao carrinho (merge de quantidades).
     * Responses:
     *  - 200: Carrinho atualizado
     *  - 401: Token inválido ou expirado
     *  - 404: Recurso não encontrado
     *
     * @param orderId 
     * @return [Call]<[BuyAgain200Response]>
     */
    @POST("me/orders/{orderId}/buy-again")
    fun buyAgain(@Path("orderId") orderId: kotlin.String): Call<BuyAgain200Response>

    /**
     * POST me/orders/{orderId}/cancel
     * Cancelar pedido (D1/D4)
     * 
     * Responses:
     *  - 200: Pedido cancelado
     *  - 422: Pedido não pode ser cancelado
     *
     * @param orderId 
     * @param cancelOrderRequest 
     * @return [Call]<[GetOrder200Response]>
     */
    @POST("me/orders/{orderId}/cancel")
    fun cancelOrder(@Path("orderId") orderId: kotlin.String, @Body cancelOrderRequest: CancelOrderRequest): Call<GetOrder200Response>

    /**
     * POST me/orders/{orderId}/returns
     * Solicitar devolução (D4)
     * 
     * Responses:
     *  - 201: Devolução solicitada
     *  - 401: Token inválido ou expirado
     *  - 404: Recurso não encontrado
     *
     * @param orderId 
     * @param createReturnRequest 
     * @return [Call]<[CreateReturn201Response]>
     */
    @POST("me/orders/{orderId}/returns")
    fun createReturn(@Path("orderId") orderId: kotlin.String, @Body createReturnRequest: CreateReturnRequest): Call<CreateReturn201Response>

    /**
     * GET me/orders/{orderId}/invoice
     * Nota fiscal (D1)
     * 
     * Responses:
     *  - 200: URL da NF
     *  - 401: Token inválido ou expirado
     *  - 404: Recurso não encontrado
     *
     * @param orderId 
     * @return [Call]<[GetInvoice200Response]>
     */
    @GET("me/orders/{orderId}/invoice")
    fun getInvoice(@Path("orderId") orderId: kotlin.String): Call<GetInvoice200Response>

    /**
     * GET me/orders/{orderId}
     * Detalhe do pedido (D1)
     * Suporta cache condicional (ETag/If-None-Match) para polling de status.
     * Responses:
     *  - 200: Pedido
     *  - 304: Status inalterado (sem corpo)
     *  - 401: Token inválido ou expirado
     *  - 404: Recurso não encontrado
     *
     * @param orderId 
     * @param ifNoneMatch  (optional)
     * @return [Call]<[GetOrder200Response]>
     */
    @GET("me/orders/{orderId}")
    fun getOrder(@Path("orderId") orderId: kotlin.String, @Header("If-None-Match") ifNoneMatch: kotlin.String? = null): Call<GetOrder200Response>

    /**
     * GET me/orders/{orderId}/returns/{returnId}
     * Consultar devolução (D4)
     * 
     * Responses:
     *  - 200: Detalhe da devolução
     *  - 401: Token inválido ou expirado
     *  - 404: Recurso não encontrado
     *
     * @param orderId 
     * @param returnId 
     * @return [Call]<[GetReturn200Response]>
     */
    @GET("me/orders/{orderId}/returns/{returnId}")
    fun getReturn(@Path("orderId") orderId: kotlin.String, @Path("returnId") returnId: kotlin.String): Call<GetReturn200Response>

    /**
     * GET me/orders/{orderId}/tracking
     * Rastreamento (D2)
     * 
     * Responses:
     *  - 200: Timeline de rastreio
     *  - 401: Token inválido ou expirado
     *  - 404: Recurso não encontrado
     *
     * @param orderId 
     * @return [Call]<[GetTracking200Response]>
     */
    @GET("me/orders/{orderId}/tracking")
    fun getTracking(@Path("orderId") orderId: kotlin.String): Call<GetTracking200Response>

    /**
     * GET me/orders
     * Listar pedidos
     * 
     * Responses:
     *  - 200: Lista de pedidos
     *  - 401: Token inválido ou expirado
     *
     * @param page  (optional, default to 1)
     * @param pageSize  (optional, default to 20)
     * @param status  (optional)
     * @return [Call]<[ListOrders200Response]>
     */
    @GET("me/orders")
    fun listOrders(@Query("page") page: kotlin.Int? = 1, @Query("pageSize") pageSize: kotlin.Int? = 20, @Query("status") status: OrderStatus? = null): Call<ListOrders200Response>

}
