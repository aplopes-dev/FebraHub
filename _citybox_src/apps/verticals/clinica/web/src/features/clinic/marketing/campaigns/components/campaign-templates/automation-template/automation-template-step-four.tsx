"use client";

type AutomationTemplateStepFourProps = {
  selectedType?: { segmentId: string; typeId: string };
};

export function AutomationTemplateStepFour({ selectedType }: AutomationTemplateStepFourProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-2">Revisão</h2>
        <p className="text-muted-foreground">
          Revise todas as informações antes de criar a campanha.
        </p>
      </div>
      <div className="mt-8">
        <div className="border-2 border-dashed border-muted rounded-lg p-12 text-center">
          <p className="text-muted-foreground">
            Template AUTOMATION - Step 4 será implementado aqui
          </p>
        </div>
      </div>
    </div>
  );
}
