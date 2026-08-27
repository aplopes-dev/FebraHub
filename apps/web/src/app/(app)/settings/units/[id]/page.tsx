import { LegacyUnitRedirectPage } from "@/features/branches/pages/legacy-unit-redirect-page";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <LegacyUnitRedirectPage unitId={id} />;
}
