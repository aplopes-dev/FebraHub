/** Chave de localStorage que marca a abertura cinematográfica como "já
 *  vista". Vive fora de IntroTerritorial.tsx porque services/api/auth.ts
 *  também precisa dela (limpa a marca a cada login — ver entrar()). */
export const INTRO_VISTA_CHAVE = "febrahub:intro-territorial-vista";
