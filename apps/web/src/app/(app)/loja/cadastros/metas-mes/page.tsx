import { redirect } from "next/navigation";

// Consolidado na tela "Planejamento e metas" (aba Metas mensais).
// Rota mantida só para não quebrar bookmarks/deep-links.
export default function RedirectMetasMes() {
  redirect("/loja/planejamento?aba=metas-mes");
}
