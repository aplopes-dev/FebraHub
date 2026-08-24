"use client";

type AutomationTemplateStepTwoProps = {
  selectedType?: { segmentId: string; typeId: string };
};

export function AutomationTemplateStepTwo({ selectedType }: AutomationTemplateStepTwoProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-2">Objetivo & Público</h2>
        <p className="text-muted-foreground">
          Defina os objetivos da campanha e selecione o público-alvo.
        </p>
      </div>
      <div className="mt-8">
        <div className="border-2 border-dashed border-muted rounded-lg p-12 text-center">
          <p className="text-muted-foreground">
            Template AUTOMATION - Step 2 será implementado aqui
          </p>
        </div>
      </div>
    </div>
  );
}
