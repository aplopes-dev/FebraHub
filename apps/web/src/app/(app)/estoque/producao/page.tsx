import { ProductionPage } from "@/features/production";

type PageProps = {
  searchParams: Promise<{ novo?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const { novo } = await searchParams;
  return <ProductionPage initialCreateOpen={novo === "1"} />;
}
