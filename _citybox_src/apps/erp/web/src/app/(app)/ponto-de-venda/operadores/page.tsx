import { redirect } from "next/navigation";

/** Operadores de caixa migraram para Usuários & Permissões (credenciais PDV no membro). */
export default function PosOperatorsRedirectPage() {
  redirect("/configuracoes/usuarios-permissoes");
}
