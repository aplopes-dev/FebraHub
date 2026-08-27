import { BankAccountDetailPage } from "@/features/bank-accounts";

type PageProps = {
  searchParams: Promise<{ view?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const { view } = await searchParams;
  return (
    <BankAccountDetailPage
      initialView={view === "historico" ? "historico" : "transacoes"}
    />
  );
}
