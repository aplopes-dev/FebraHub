package com.citybox.api.apis

import com.citybox.api.infrastructure.CollectionFormats.*
import retrofit2.http.*
import retrofit2.Call
import okhttp3.RequestBody
import com.google.gson.annotations.SerializedName

import com.citybox.api.models.ErrorEnvelope
import com.citybox.api.models.ListFavorites200Response
import com.citybox.api.models.ToggleFavorite200Response
import com.citybox.api.models.ToggleFavoriteRequest

interface FavoritosApi {
    /**
     * GET me/favorites
     * Listar favoritos
     * 
     * Responses:
     *  - 200: IDs + produtos favoritos
     *  - 401: Token inválido ou expirado
     *
     * @return [Call]<[ListFavorites200Response]>
     */
    @GET("me/favorites")
    fun listFavorites(): Call<ListFavorites200Response>

    /**
     * PUT me/favorites/{productId}
     * Toggle favorito
     * 
     * Responses:
     *  - 200: Estado atualizado
     *  - 401: Token inválido ou expirado
     *  - 404: Recurso não encontrado
     *
     * @param productId 
     * @param toggleFavoriteRequest 
     * @return [Call]<[ToggleFavorite200Response]>
     */
    @PUT("me/favorites/{productId}")
    fun toggleFavorite(@Path("productId") productId: kotlin.String, @Body toggleFavoriteRequest: ToggleFavoriteRequest): Call<ToggleFavorite200Response>

}
