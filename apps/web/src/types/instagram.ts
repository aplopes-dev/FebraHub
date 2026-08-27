/* Formas trocadas com /api/social/instagram. A senha/sessão NUNCA vêm — só o
   estado da conexão e o usuário conectado. */

export interface InstagramConexao {
  /** false = ALOOK_AIOGRAPI_URL não configurada neste host. */
  disponivel: boolean;
  /** já houve tentativa de conexão (há usuário gravado). */
  configurado: boolean;
  conectado: boolean;
  /** caiu em 2FA/checkpoint e aguarda resolução. */
  precisaDesafio: boolean;
  usuario: string | null;
}

export interface RespostaConexao {
  status: "connected" | "needs_challenge" | "error";
  ok: boolean;
  error: string | null;
}
