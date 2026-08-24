import { PermissionProfileEditPage } from "@/features/users-permissions";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <PermissionProfileEditPage profileId={id} />;
}
