"use client";

type PageTemplateStepThreeProps = {
  selectedType?: { segmentId: string; typeId: string };
};

export function PageTemplateStepThree({ selectedType }: PageTemplateStepThreeProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-2">Conteúdo</h2>
        <p className="text-muted-foreground">
          Crie o conteúdo da sua campanha.
        </p>
      </div>
      <div className="mt-8">
        <div className="border-2 border-dashed border-muted rounded-lg p-12 text-center">
          <p className="text-muted-foreground">
            Template PAGE - Step 3 será implementado aqui
          </p>
        </div>
      </div>
    </div>
  );
}
