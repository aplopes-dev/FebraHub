import { redirect } from "next/navigation";

export default function Page() {
  redirect("/estoque/producao?novo=1");
}
