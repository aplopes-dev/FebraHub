package com.citybox.api.apis

import com.citybox.api.infrastructure.CollectionFormats.*
import retrofit2.http.*
import retrofit2.Call
import okhttp3.RequestBody
import com.google.gson.annotations.SerializedName

import com.citybox.api.models.AddressEnvelope
import com.citybox.api.models.AddressInput
import com.citybox.api.models.ErrorEnvelope
import com.citybox.api.models.ListAddresses200Response
import com.citybox.api.models.LookupZip200Response

interface EnderecosApi {
    /**
     * POST me/addresses
     * Criar endereço (B3)
     * 
     * Responses:
     *  - 201: Endereço criado
     *  - 401: Token inválido ou expirado
     *
     * @param addressInput 
     * @return [Call]<[AddressEnvelope]>
     */
    @POST("me/addresses")
    fun createAddress(@Body addressInput: AddressInput): Call<AddressEnvelope>

    /**
     * DELETE me/addresses/{addressId}
     * Excluir endereço (B2)
     * 
     * Responses:
     *  - 204: Endereço excluído
     *  - 401: Token inválido ou expirado
     *  - 404: Recurso não encontrado
     *
     * @param addressId 
     * @return [Call]<[Unit]>
     */
    @DELETE("me/addresses/{addressId}")
    fun deleteAddress(@Path("addressId") addressId: kotlin.String): Call<Unit>

    /**
     * GET me/addresses
     * Listar endereços (B2)
     * 
     * Responses:
     *  - 200: Lista de endereços
     *  - 401: Token inválido ou expirado
     *
     * @return [Call]<[ListAddresses200Response]>
     */
    @GET("me/addresses")
    fun listAddresses(): Call<ListAddresses200Response>

    /**
     * GET addresses/zip/{zipCode}
     * Busca por CEP (B3)
     * 
     * Responses:
     *  - 200: Endereço do CEP
     *  - 404: Recurso não encontrado
     *
     * @param zipCode 
     * @return [Call]<[LookupZip200Response]>
     */
    @GET("addresses/zip/{zipCode}")
    fun lookupZip(@Path("zipCode") zipCode: kotlin.String): Call<LookupZip200Response>

    /**
     * PATCH me/addresses/{addressId}/default
     * Definir endereço padrão (B2/C1)
     * 
     * Responses:
     *  - 200: Endereço padrão definido
     *  - 401: Token inválido ou expirado
     *  - 404: Recurso não encontrado
     *
     * @param addressId 
     * @return [Call]<[AddressEnvelope]>
     */
    @PATCH("me/addresses/{addressId}/default")
    fun setDefaultAddress(@Path("addressId") addressId: kotlin.String): Call<AddressEnvelope>

    /**
     * PUT me/addresses/{addressId}
     * Editar endereço (B3)
     * 
     * Responses:
     *  - 200: Endereço atualizado
     *  - 401: Token inválido ou expirado
     *  - 404: Recurso não encontrado
     *
     * @param addressId 
     * @param addressInput 
     * @return [Call]<[AddressEnvelope]>
     */
    @PUT("me/addresses/{addressId}")
    fun updateAddress(@Path("addressId") addressId: kotlin.String, @Body addressInput: AddressInput): Call<AddressEnvelope>

}
