export type TipoNotificacao = "info" | "sucesso" | "alerta" | "erro";

export interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: TipoNotificacao;
  categoria: string | null;
  /** Rota interna que o item abre. A API só aceita caminho começando com "/". */
  href: string | null;
  lidaEm: string | null;
  criadaEm: string;
}

export interface CaixaNotificacoes {
  itens: Notificacao[];
  /** Total real de não-lidas, mesmo quando a lista veio cortada. */
  naoLidas: number;
}

export type DestinoNotificacao = "todos" | "perfil" | "setor" | "usuario";

export interface EnviarNotificacaoInput {
  titulo: string;
  mensagem: string;
  tipo?: TipoNotificacao;
  href?: string;
  destino: DestinoNotificacao;
  /** Slug do perfil, chave do setor ou uuid da pessoa. Vazio em "todos". */
  valor?: string;
}

/** O mínimo para montar os seletores de destino — sem e-mail nem papel. */
export interface DestinosNotificacao {
  perfis: { slug: string; nome: string }[];
  usuarios: { id: string; nome: string }[];
}

export interface ComunicadoEnviado {
  titulo: string;
  mensagem: string;
  tipo: TipoNotificacao;
  destinatarios: number;
  enviadaEm: string | null;
  autor: string | null;
}
