import { ProductEditPage } from "@/features/products";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <ProductEditPage productId={id} />;
}
