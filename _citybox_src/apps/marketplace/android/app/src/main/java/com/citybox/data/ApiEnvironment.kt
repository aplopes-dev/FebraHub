package com.citybox.data

import com.citybox.BuildConfig

/**
 * Configuração de ambiente da API.
 *
 * Como alternar:
 * - [USE_MOCK] = true  → app volta a rodar 100% offline com MockData/AppState in-memory.
 * - [USE_MOCK] = false → app fala com o BFF real:
 *     - debug   → [DEBUG_BASE_URL] (BFF local; 10.0.2.2 = host da máquina no emulador Android)
 *     - release → [RELEASE_BASE_URL] (produção)
 *
 * Para apontar o debug para outro servidor (device físico, staging etc.), altere
 * apenas [DEBUG_BASE_URL].
 */
object ApiEnvironment {
    /** true = mock in-memory (comportamento antigo); false = BFF real. */
    const val USE_MOCK: Boolean = false

    /** BFF local rodando na máquina host (`pnpm --filter @citybox/marketplace-bff dev`, porta 3102). */
    const val DEBUG_BASE_URL: String = "http://10.0.2.2:3102/api"

    /** BFF de produção. */
    const val RELEASE_BASE_URL: String = "https://citybox.com.br/api"

    val BASE_URL: String
        get() = if (BuildConfig.DEBUG) DEBUG_BASE_URL else RELEASE_BASE_URL

    val isLive: Boolean
        get() = !USE_MOCK
}
