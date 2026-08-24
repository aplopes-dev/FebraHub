import { KdsProductsPage } from "@/features/kds";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <KdsProductsPage kdsId={id} />;
}
