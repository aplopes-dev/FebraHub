import { StoreCreatePage } from "@/features/branches/pages/store-pages";

type PageProps = {
  params: Promise<{ matrixId: string }>;
};

export default async function Page({ params }: PageProps) {
  const { matrixId } = await params;
  return <StoreCreatePage matrixId={matrixId} />;
}
