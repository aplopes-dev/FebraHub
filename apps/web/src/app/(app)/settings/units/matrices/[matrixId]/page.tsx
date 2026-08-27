import { MatrixEditPage } from "@/features/branches/pages/store-pages";

type PageProps = {
  params: Promise<{ matrixId: string }>;
};

export default async function Page({ params }: PageProps) {
  const { matrixId } = await params;
  return <MatrixEditPage matrixId={matrixId} />;
}
