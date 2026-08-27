import { redirect } from "next/navigation";

// Consolidado na tela "Planejamento e metas" (aba Fechamento).
// Rota mantida só para não quebrar bookmarks/deep-links.
export default function RedirectFechamento() {
  redirect("/loja/planejamento?aba=fechamento");
}
