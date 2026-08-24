import { OperationNatureEditPage } from "@/features/fiscal-operation-natures";

type PageProps = { params: Promise<{ id: string }> };

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <OperationNatureEditPage natureId={id} />;
}
