import { redirect } from "next/navigation";

// A tela de Represados foi consolidada como uma ABA dentro de Customer Success
// (/pedagogico/cs?aba=represados). Esta rota permanece só para não quebrar
// bookmarks/deep-links antigos — redireciona para o novo lugar.
export default function RepresadosRedirect() {
  redirect("/pedagogico/cs?aba=represados");
}
