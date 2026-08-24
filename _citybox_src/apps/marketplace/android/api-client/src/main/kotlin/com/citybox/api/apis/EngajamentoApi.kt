package com.citybox.api.apis

import com.citybox.api.infrastructure.CollectionFormats.*
import retrofit2.http.*
import retrofit2.Call
import okhttp3.RequestBody
import com.google.gson.annotations.SerializedName

import com.citybox.api.models.CreateTicket201Response
import com.citybox.api.models.CreateTicketRequest
import com.citybox.api.models.ErrorEnvelope
import com.citybox.api.models.GetChatMessages200Response
import com.citybox.api.models.GetFaq200Response
import com.citybox.api.models.ListNotifications200Response
import com.citybox.api.models.MarkAllNotificationsRead200Response
import com.citybox.api.models.MarkNotificationRead200Response
import com.citybox.api.models.SendChatMessage201Response
import com.citybox.api.models.SendChatMessageRequest

interface EngajamentoApi {
    /**
     * POST me/support/tickets
     * Abrir ticket de suporte (F3 alt)
     * 
     * Responses:
     *  - 201: Ticket criado
     *  - 401: Token inválido ou expirado
     *
     * @param createTicketRequest 
     * @return [Call]<[CreateTicket201Response]>
     */
    @POST("me/support/tickets")
    fun createTicket(@Body createTicketRequest: CreateTicketRequest): Call<CreateTicket201Response>

    /**
     * GET me/support/chat/messages
     * Histórico do chat (F3)
     * 
     * Responses:
     *  - 200: Mensagens
     *  - 401: Token inválido ou expirado
     *
     * @param before  (optional)
     * @param limit  (optional)
     * @return [Call]<[GetChatMessages200Response]>
     */
    @GET("me/support/chat/messages")
    fun getChatMessages(@Query("before") before: kotlin.String? = null, @Query("limit") limit: kotlin.Int? = null): Call<GetChatMessages200Response>

    /**
     * GET support/faq
     * FAQ / Ajuda (F2)
     * 
     * Responses:
     *  - 200: Tópicos de FAQ
     *  - 400: Requisição inválida (parâmetros malformados)
     *
     * @return [Call]<[GetFaq200Response]>
     */
    @GET("support/faq")
    fun getFaq(): Call<GetFaq200Response>

    /**
     * GET me/notifications
     * Listar notificações (F1)
     * 
     * Responses:
     *  - 200: Notificações + contagem
     *  - 401: Token inválido ou expirado
     *
     * @param page  (optional, default to 1)
     * @param pageSize  (optional, default to 20)
     * @param unreadOnly  (optional)
     * @return [Call]<[ListNotifications200Response]>
     */
    @GET("me/notifications")
    fun listNotifications(@Query("page") page: kotlin.Int? = 1, @Query("pageSize") pageSize: kotlin.Int? = 20, @Query("unreadOnly") unreadOnly: kotlin.Boolean? = null): Call<ListNotifications200Response>

    /**
     * POST me/notifications/read-all
     * Marcar todas como lidas (F1)
     * 
     * Responses:
     *  - 200: Todas lidas
     *  - 401: Token inválido ou expirado
     *
     * @return [Call]<[MarkAllNotificationsRead200Response]>
     */
    @POST("me/notifications/read-all")
    fun markAllNotificationsRead(): Call<MarkAllNotificationsRead200Response>

    /**
     * PATCH me/notifications/{notificationId}/read
     * Marcar notificação como lida (F1)
     * 
     * Responses:
     *  - 200: Notificação lida
     *  - 401: Token inválido ou expirado
     *  - 404: Recurso não encontrado
     *
     * @param notificationId 
     * @return [Call]<[MarkNotificationRead200Response]>
     */
    @PATCH("me/notifications/{notificationId}/read")
    fun markNotificationRead(@Path("notificationId") notificationId: kotlin.String): Call<MarkNotificationRead200Response>

    /**
     * POST me/support/chat/messages
     * Enviar mensagem ao chat (F3)
     * 
     * Responses:
     *  - 201: Mensagem enviada + resposta do agente
     *  - 401: Token inválido ou expirado
     *
     * @param sendChatMessageRequest 
     * @return [Call]<[SendChatMessage201Response]>
     */
    @POST("me/support/chat/messages")
    fun sendChatMessage(@Body sendChatMessageRequest: SendChatMessageRequest): Call<SendChatMessage201Response>

}
