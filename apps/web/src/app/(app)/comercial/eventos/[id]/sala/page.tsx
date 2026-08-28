import { RoomPage } from "@/features/event-editions";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <RoomPage editionId={id} />;
}
