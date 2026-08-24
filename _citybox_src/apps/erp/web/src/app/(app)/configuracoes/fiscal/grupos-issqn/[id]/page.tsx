import { IssqnGroupEditPage } from "@/features/fiscal-issqn-group";

type PageProps = { params: Promise<{ id: string }> };

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <IssqnGroupEditPage groupId={id} />;
}
