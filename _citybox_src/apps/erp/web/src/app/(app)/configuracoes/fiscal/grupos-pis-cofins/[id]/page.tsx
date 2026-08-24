import { PisCofinsGroupEditPage } from "@/features/fiscal-pis-cofins-group";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <PisCofinsGroupEditPage groupId={id} />;
}
