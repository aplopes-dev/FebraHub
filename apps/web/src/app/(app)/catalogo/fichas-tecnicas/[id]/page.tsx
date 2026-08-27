import { TechnicalSheetDetailPage } from "@/features/technical-sheets";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <TechnicalSheetDetailPage productId={id} />;
}
