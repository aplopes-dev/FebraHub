package com.citybox.api.apis

import com.citybox.api.infrastructure.CollectionFormats.*
import retrofit2.http.*
import retrofit2.Call
import okhttp3.RequestBody
import com.google.gson.annotations.SerializedName

import com.citybox.api.models.ErrorEnvelope
import com.citybox.api.models.GetBanners200Response
import com.citybox.api.models.GetStaticPage200Response
import com.citybox.api.models.HealthResponse
import com.citybox.api.models.MockRootResponse

interface ConteudoApi {
    /**
     * GET content/banners
     * Banners promocionais (Home)
     * 
     * Responses:
     *  - 200: Banners
     *  - 400: Requisição inválida (parâmetros malformados)
     *
     * @return [Call]<[GetBanners200Response]>
     */
    @GET("content/banners")
    fun getBanners(): Call<GetBanners200Response>

    /**
     * GET health
     * Health check
     * 
     * Responses:
     *  - 200: Serviço disponível
     *  - 400: Requisição inválida (parâmetros malformados)
     *
     * @return [Call]<[HealthResponse]>
     */
    @GET("health")
    fun getHealth(): Call<HealthResponse>

    /**
     * GET 
     * Raiz do mock local (smoke test)
     * Resposta amigável ao abrir http://127.0.0.1:4010/ no navegador.
     * Responses:
     *  - 200: Mock ativo
     *  - 400: Requisição inválida (parâmetros malformados)
     *
     * @return [Call]<[MockRootResponse]>
     */
    @GET("")
    fun getRoot(): Call<MockRootResponse>


    /**
    * enum for parameter slug
    */
    enum class SlugGetStaticPage(val value: kotlin.String) {
        @SerializedName(value = "about") about("about"),
        @SerializedName(value = "terms") terms("terms"),
        @SerializedName(value = "privacy") privacy("privacy")
    }

    /**
     * GET content/pages/{slug}
     * Página estática (B7)
     * 
     * Responses:
     *  - 200: Página
     *  - 404: Recurso não encontrado
     *
     * @param slug 
     * @return [Call]<[GetStaticPage200Response]>
     */
    @GET("content/pages/{slug}")
    fun getStaticPage(@Path("slug") slug: kotlin.String): Call<GetStaticPage200Response>

}
