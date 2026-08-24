package com.citybox.api.apis

import com.citybox.api.infrastructure.CollectionFormats.*
import retrofit2.http.*
import retrofit2.Call
import okhttp3.RequestBody
import com.google.gson.annotations.SerializedName

import com.citybox.api.models.AddReviewPhoto201Response
import com.citybox.api.models.AddSearchHistoryRequest
import com.citybox.api.models.CreateReview201Response
import com.citybox.api.models.CreateReviewRequest
import com.citybox.api.models.CreateReviewRequest1
import com.citybox.api.models.ErrorEnvelope
import com.citybox.api.models.GetCategoryProducts200Response
import com.citybox.api.models.GetFiltersMetadata200Response
import com.citybox.api.models.GetHome200Response
import com.citybox.api.models.GetProduct200Response
import com.citybox.api.models.GetReviews200Response
import com.citybox.api.models.ListCategories200Response
import com.citybox.api.models.SearchHistoryEnvelope
import com.citybox.api.models.SearchProducts200Response
import com.citybox.api.models.SearchSuggestions200Response
import com.citybox.api.models.SortOption

import okhttp3.MultipartBody

interface CatalogoApi {
    /**
     * POST catalog/products/{productId}/reviews/{reviewId}/photos
     * Anexar foto a avaliação (D3)
     * 
     * Responses:
     *  - 201: Foto anexada
     *  - 401: Token inválido ou expirado
     *  - 404: Recurso não encontrado
     *
     * @param productId 
     * @param reviewId 
     * @param file  (optional)
     * @return [Call]<[AddReviewPhoto201Response]>
     */
    @Multipart
    @POST("catalog/products/{productId}/reviews/{reviewId}/photos")
    fun addReviewPhoto(@Path("productId") productId: kotlin.String, @Path("reviewId") reviewId: kotlin.String, @Part file: MultipartBody.Part? = null): Call<AddReviewPhoto201Response>

    /**
     * POST me/search-history
     * Registrar busca (E4)
     * 
     * Responses:
     *  - 201: Histórico atualizado (máx. 10, dedup)
     *  - 401: Token inválido ou expirado
     *
     * @param addSearchHistoryRequest 
     * @return [Call]<[SearchHistoryEnvelope]>
     */
    @POST("me/search-history")
    fun addSearchHistory(@Body addSearchHistoryRequest: AddSearchHistoryRequest): Call<SearchHistoryEnvelope>

    /**
     * DELETE me/search-history
     * Limpar histórico (E4)
     * 
     * Responses:
     *  - 204: Histórico limpo
     *  - 401: Token inválido ou expirado
     *
     * @return [Call]<[Unit]>
     */
    @DELETE("me/search-history")
    fun clearSearchHistory(): Call<Unit>

    /**
     * POST catalog/products/{productId}/reviews
     * Escrever avaliação (D3)
     * Aceita JSON ou multipart (com fotos). &#x60;orderId&#x60; representa compra verificada — opcional quando criada via tela de Avaliações. 
     * Responses:
     *  - 201: Avaliação criada
     *  - 401: Token inválido ou expirado
     *  - 404: Recurso não encontrado
     *
     * @param productId 
     * @param createReviewRequest 
     * @return [Call]<[CreateReview201Response]>
     */
    @POST("catalog/products/{productId}/reviews")
    fun createReview(@Path("productId") productId: kotlin.String, @Body createReviewRequest: CreateReviewRequest): Call<CreateReview201Response>

    /**
     * GET catalog/categories/{categoryId}/products
     * Produtos por categoria (E1)
     * 
     * Responses:
     *  - 200: Categoria + produtos
     *  - 404: Recurso não encontrado
     *
     * @param categoryId 
     * @param page  (optional, default to 1)
     * @param pageSize  (optional, default to 20)
     * @return [Call]<[GetCategoryProducts200Response]>
     */
    @GET("catalog/categories/{categoryId}/products")
    fun getCategoryProducts(@Path("categoryId") categoryId: kotlin.String, @Query("page") page: kotlin.Int? = 1, @Query("pageSize") pageSize: kotlin.Int? = 20): Call<GetCategoryProducts200Response>

    /**
     * GET catalog/filters/metadata
     * Metadados de filtros (E2)
     * 
     * Responses:
     *  - 200: Marcas, faixas, ordenações, flags
     *  - 400: Requisição inválida (parâmetros malformados)
     *
     * @return [Call]<[GetFiltersMetadata200Response]>
     */
    @GET("catalog/filters/metadata")
    fun getFiltersMetadata(): Call<GetFiltersMetadata200Response>

    /**
     * GET catalog/home
     * Feed da Home (seções pré-montadas)
     * 
     * Responses:
     *  - 200: Seções + produtos
     *  - 400: Requisição inválida (parâmetros malformados)
     *
     * @return [Call]<[GetHome200Response]>
     */
    @GET("catalog/home")
    fun getHome(): Call<GetHome200Response>

    /**
     * GET catalog/products/{productId}
     * Detalhe do produto (PDP)
     * 
     * Responses:
     *  - 200: Produto + parcelamento
     *  - 404: Recurso não encontrado
     *
     * @param productId 
     * @return [Call]<[GetProduct200Response]>
     */
    @GET("catalog/products/{productId}")
    fun getProduct(@Path("productId") productId: kotlin.String): Call<GetProduct200Response>

    /**
     * GET catalog/products/{productId}/reviews
     * Avaliações do produto (E3)
     * 
     * Responses:
     *  - 200: Média, distribuição e lista
     *  - 404: Recurso não encontrado
     *
     * @param productId 
     * @param page  (optional, default to 1)
     * @param pageSize  (optional, default to 20)
     * @return [Call]<[GetReviews200Response]>
     */
    @GET("catalog/products/{productId}/reviews")
    fun getReviews(@Path("productId") productId: kotlin.String, @Query("page") page: kotlin.Int? = 1, @Query("pageSize") pageSize: kotlin.Int? = 20): Call<GetReviews200Response>

    /**
     * GET me/search-history
     * Histórico de busca (E4)
     * 
     * Responses:
     *  - 200: Buscas recentes
     *  - 401: Token inválido ou expirado
     *
     * @return [Call]<[SearchHistoryEnvelope]>
     */
    @GET("me/search-history")
    fun getSearchHistory(): Call<SearchHistoryEnvelope>

    /**
     * GET catalog/categories
     * Listar categorias (E1)
     * 
     * Responses:
     *  - 200: Categorias
     *  - 400: Requisição inválida (parâmetros malformados)
     *
     * @return [Call]<[ListCategories200Response]>
     */
    @GET("catalog/categories")
    fun listCategories(): Call<ListCategories200Response>

    /**
     * GET catalog/search
     * Busca de produtos (E2/E4)
     * 
     * Responses:
     *  - 200: Resultados
     *  - 400: Requisição inválida (parâmetros malformados)
     *
     * @param q  (optional)
     * @param minPrice  (optional)
     * @param maxPrice  (optional)
     * @param minRating  (optional)
     * @param freeShipping  (optional)
     * @param express  (optional)
     * @param brand  (optional)
     * @param sortBy  (optional)
     * @param page  (optional, default to 1)
     * @param pageSize  (optional, default to 20)
     * @return [Call]<[SearchProducts200Response]>
     */
    @GET("catalog/search")
    fun searchProducts(@Query("q") q: kotlin.String? = null, @Query("minPrice") minPrice: java.math.BigDecimal? = null, @Query("maxPrice") maxPrice: java.math.BigDecimal? = null, @Query("minRating") minRating: java.math.BigDecimal? = null, @Query("freeShipping") freeShipping: kotlin.Boolean? = null, @Query("express") express: kotlin.Boolean? = null, @Query("brand") brand: kotlin.String? = null, @Query("sortBy") sortBy: SortOption? = null, @Query("page") page: kotlin.Int? = 1, @Query("pageSize") pageSize: kotlin.Int? = 20): Call<SearchProducts200Response>

    /**
     * GET catalog/search/suggestions
     * Sugestões de busca (E4)
     * 
     * Responses:
     *  - 200: Sugestões + marcas
     *  - 400: Requisição inválida (parâmetros malformados)
     *
     * @param q  (optional)
     * @return [Call]<[SearchSuggestions200Response]>
     */
    @GET("catalog/search/suggestions")
    fun searchSuggestions(@Query("q") q: kotlin.String? = null): Call<SearchSuggestions200Response>

}
