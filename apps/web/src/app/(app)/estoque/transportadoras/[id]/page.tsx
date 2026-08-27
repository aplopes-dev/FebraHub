import { CarrierEditPage } from "@/features/carriers";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <CarrierEditPage carrierId={id} />;
}
