import { PageHeader } from "@citybox/ui/organisms";

type PlaceholderPageProps = {
  title: string;
  description?: string;
};

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={title}
        description={description ?? "Esta tela ainda está em construção."}
      />
      <p className="text-sm text-muted-foreground">
        Placeholder do ERP Comércio — o conteúdo desta página será implementado
        nas próximas etapas.
      </p>
    </div>
  );
}
