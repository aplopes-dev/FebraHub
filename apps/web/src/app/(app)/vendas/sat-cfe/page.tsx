import { PlaceholderPage } from "@/components/placeholder-page";
import { resolvePageMeta } from "@/lib/navigation";

const PATH = "/vendas/sat-cfe";

export default function Page() {
  const meta = resolvePageMeta(PATH);
  return <PlaceholderPage title={meta.title} description={meta.description} />;
}
