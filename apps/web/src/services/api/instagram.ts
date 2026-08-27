/* Instagram por login direto (sidecar aiograpi-rest) — /api/social/instagram.

   Complementa o Zernio: aqui é a conta oficial conectada por login direto, com
   acesso à API privada (DMs, mídia, stories, insights). A senha/sessão ficam na
   API, cifradas; a tela só recebe usuário + estado. */

import { api } from "./client";
import type { InstagramConexao, RespostaConexao } from "@/types/instagram";

/* Login/desafio consultam o Instagram ao vivo pelo sidecar; o padrão de 30s do
   cliente estoura quando ele está resolvendo checkpoint. */
const LENTO = { timeout: 60_000 } as const;

export const statusInstagram = (): Promise<InstagramConexao> => api.get("/social/instagram");

/** Com `sessionid`, importa uma sessão pronta. Senão, login por usuário/senha
 *  (opcionalmente com `codigo` de 2FA). */
export const conectarInstagram = (dados: {
  usuario?: string;
  senha?: string;
  sessionid?: string;
  codigo?: string;
}): Promise<RespostaConexao> => api.post("/social/instagram", dados, LENTO);

/** `codigo` vazio = re-login (desafio "aprovar no aparelho"); com código = 2FA/SMS. */
export const resolverDesafioInstagram = (codigo?: string): Promise<RespostaConexao> =>
  api.post("/social/instagram/desafio", codigo ? { codigo } : {}, LENTO);

export const desconectarInstagram = (): Promise<{ ok: true }> => api.delete("/social/instagram");
