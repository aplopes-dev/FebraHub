import { StoreEditPage } from "@/features/branches/pages/store-pages";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <StoreEditPage storeId={id} />;
}
