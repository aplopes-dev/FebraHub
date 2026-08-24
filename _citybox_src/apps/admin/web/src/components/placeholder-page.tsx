import { SimplePage } from '@/components/simple-page';

type PlaceholderPageProps = {
  title: string;
  description: string;
};

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <SimplePage title={title} description={description}>
      <p className="text-muted-foreground">Módulo em construção.</p>
    </SimplePage>
  );
}
