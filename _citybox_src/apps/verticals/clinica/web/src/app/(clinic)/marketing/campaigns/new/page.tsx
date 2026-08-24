"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ScrollArea } from "@citybox/ui/atoms";
import { NewCampaignStepperHeader } from "@/features/clinic/marketing/campaigns/components/new-campaign-stepper-header";
import { NewCampaignStepperFooter } from "@/features/clinic/marketing/campaigns/components/new-campaign-stepper-footer";
import { NewCampaignFormSteps } from "@/features/clinic/marketing/campaigns/components/new-campaign-form-steps";
import { useCreateCampaign } from "@/features/clinic/marketing/campaigns/hooks/use-create-campaign";
import { mapAniversarioFormDataToCreateCampaign, mapFormDataToCreateCampaign } from "@/features/clinic/marketing/campaigns/utils/campaign-form-mapper";
import type { SelectedCampaignType, CampaignStrategy } from "@/features/clinic/marketing/campaigns/types";
import { CAMPAIGN_SEGMENTS } from "@/features/clinic/marketing/campaigns/constants";
import { toast } from "sonner";
import { useUploadFile } from "@/features/clinic/marketing/campaigns/_ui/use-upload";
import type { PageStrategyFormData } from "@/features/clinic/marketing/campaigns/components/campaign-templates/page-template/step-two/page-template-step-two.schema";
import type { PageStrategyStepThreeFormData } from "@/features/clinic/marketing/campaigns/components/campaign-templates/page-template/step-three/page-template-step-three.schema";
import type { PageStrategyStepFourFormData } from "@/features/clinic/marketing/campaigns/components/campaign-templates/page-template/step-four/page-template-step-four.schema";
import type {
  AniversarioStepFourFormData,
  AniversarioStepTwoFormData,
} from "@/features/clinic/marketing/campaigns/components/campaign-templates/broadcast-template/aniversario/aniversario-form.schema";
import {
  EMPTY_ANIVERSARIO_STEP_FOUR,
  EMPTY_ANIVERSARIO_STEP_TWO,
} from "@/features/clinic/marketing/campaigns/components/campaign-templates/broadcast-template/aniversario/aniversario-form.schema";
import { parseLocalDateString } from "@/features/clinic/agenda/lib/local-date";

const TOTAL_STEPS = 4;

export default function NewCampaignPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCampaignType, setSelectedCampaignType] = useState<SelectedCampaignType | undefined>(
    undefined
  );
  const [pageStrategyData, setPageStrategyData] = useState<Partial<PageStrategyFormData> | undefined>(
    undefined
  );
  const [isStepTwoValid, setIsStepTwoValid] = useState(false);
  const [pageStrategyStepThreeData, setPageStrategyStepThreeData] = useState<Partial<PageStrategyStepThreeFormData> | undefined>(
    undefined
  );
  const [isStepThreeValid, setIsStepThreeValid] = useState(false);
  const [pageStrategyStepFourData, setPageStrategyStepFourData] = useState<Partial<PageStrategyStepFourFormData> | undefined>(
    undefined
  );
  const [isStepFourValid, setIsStepFourValid] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [aniversarioStepTwoData, setAniversarioStepTwoData] = useState<
    AniversarioStepTwoFormData
  >(EMPTY_ANIVERSARIO_STEP_TWO);
  const [aniversarioStepFourData, setAniversarioStepFourData] = useState<
    AniversarioStepFourFormData
  >(EMPTY_ANIVERSARIO_STEP_FOUR);

  // Hook para criar campanha
  const createCampaignMutation = useCreateCampaign();
  // Hook para fazer upload de arquivo (sem toast automático, vamos tratar manualmente)
  const uploadFileMutation = useUploadFile({
    onSuccess: undefined, // Não mostrar toast automático
    onError: undefined, // Não mostrar toast automático
  });

  // Derivar a estratégia do tipo de campanha selecionado
  const campaignStrategy = useMemo<CampaignStrategy | null>(() => {
    if (!selectedCampaignType) return null;

    const segment = CAMPAIGN_SEGMENTS.find(
      (seg) => seg.id === selectedCampaignType.segmentId
    );
    if (!segment) return null;

    const type = segment.types.find((t) => t.id === selectedCampaignType.typeId);
    if (!type) return null;

    return type.strategy;
  }, [selectedCampaignType]);

  const handleSelectType = (type: SelectedCampaignType) => {
    setSelectedCampaignType(type);
  };

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepChange = (step: number) => {
    // Permitir apenas voltar para steps anteriores (não avançar clicando)
    if (step <= currentStep) {
      setCurrentStep(step);
    }
  };

  const handleNext = () => {
    if (currentStep === TOTAL_STEPS) {
      handleSubmit();
    } else {
      // Validação específica por step
      if (currentStep === 2 && campaignStrategy === "PAGE") {
        // A validação do formulário será feita pelo componente
        // Aqui apenas avançamos se os dados estiverem presentes
        if (!pageStrategyData || !pageStrategyData.name) {
          return; // Não avança se dados obrigatórios não estiverem preenchidos
        }
      }
      nextStep();
    }
  };

  const handleSubmit = async () => {
    if (!selectedCampaignType || !campaignStrategy) {
      toast.error("Por favor, selecione um tipo de campanha");
      console.error("Dados incompletos para criar campanha:", {
        selectedCampaignType,
        campaignStrategy,
      });
      return;
    }

    // Validar que todos os dados necessários estão presentes e válidos
    if (campaignStrategy === "BROADCAST" && selectedCampaignType.typeId === "aniversario") {
      if (!aniversarioStepTwoData.messageBody.trim()) {
        toast.error("Por favor, preencha o texto da mensagem");
        return;
      }
      if (!aniversarioStepFourData.name.trim() || aniversarioStepFourData.name.trim().length < 3) {
        toast.error("Por favor, informe o nome da campanha");
        return;
      }

      try {
        const campaignData = mapAniversarioFormDataToCreateCampaign(
          selectedCampaignType,
          aniversarioStepTwoData,
          aniversarioStepFourData,
        );
        await createCampaignMutation.mutateAsync(campaignData);
        router.push("/marketing/campaigns");
      } catch (error) {
        console.error("❌ Erro ao criar campanha:", error);
      }
      return;
    }

    if (campaignStrategy === "PAGE") {
      // Verificar se os dados existem
      if (
        !pageStrategyData ||
        !pageStrategyStepThreeData ||
        !pageStrategyStepFourData
      ) {
        toast.error("Por favor, preencha todos os passos do formulário");
        console.error("Dados do formulário incompletos:", {
          pageStrategyData: !!pageStrategyData,
          pageStrategyStepThreeData: !!pageStrategyStepThreeData,
          pageStrategyStepFourData: !!pageStrategyStepFourData,
        });
        return;
      }

      // Verificar campos obrigatórios do step 2
      if (!pageStrategyData.name) {
        toast.error("Por favor, preencha o nome da campanha");
        console.error("Step 2: Campos obrigatórios faltando", {
          name: !!pageStrategyData.name,
        });
        return;
      }

      // Verificar campos obrigatórios do step 3
      if (
        !pageStrategyStepThreeData.questions ||
        pageStrategyStepThreeData.questions.length < 2
      ) {
        toast.error(
          "Por favor, adicione pelo menos 2 perguntas ao formulário",
        );
        console.error("Step 3: Campos obrigatórios faltando", {
          questions: pageStrategyStepThreeData.questions?.length || 0,
        });
        return;
      }

      // Verificar campos obrigatórios do step 4 baseado no statusType
      // Garantir que statusType existe (deve ter valor padrão "always_active")
      const statusType = pageStrategyStepFourData.statusType || "always_active";
      
      if (statusType === "period") {
        if (!pageStrategyStepFourData.endDate) {
          toast.error(
            "Por favor, preencha a data final da campanha",
          );
          console.error(
            "Step 4: Data final obrigatória faltando para statusType 'period'",
            {
              statusType,
              endDate: pageStrategyStepFourData.endDate,
            },
          );
          return;
        }
        
        // Validar que endDate é um dia civil futuro (não hoje — 00:00 do dia fim já finaliza)
        const end = parseLocalDateString(pageStrategyStepFourData.endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (end <= today) {
          toast.error(
            "A data final deve ser uma data futura",
          );
          console.error(
            "Step 4: Data final deve ser futura para statusType 'period'",
            {
              statusType,
              endDate: pageStrategyStepFourData.endDate,
            },
          );
          return;
        }
      } else if (statusType === "limit") {
        if (
          !pageStrategyStepFourData.leadLimit ||
          pageStrategyStepFourData.leadLimit <= 0
        ) {
          toast.error("Por favor, informe um limite de leads válido");
          console.error(
            "Step 4: leadLimit obrigatório faltando para statusType 'limit'",
            {
              statusType,
              leadLimit: pageStrategyStepFourData.leadLimit,
            },
          );
          return;
        }
      }

      // Verificar flags de validação como fallback
      // Para statusType "always_active", o step 4 sempre é válido
      const isStepFourValidForStatus =
        statusType === "always_active" || isStepFourValid;

      if (!isStepTwoValid || !isStepThreeValid || !isStepFourValidForStatus) {
        toast.error(
          "Por favor, verifique se todos os campos obrigatórios estão preenchidos corretamente",
        );
        console.error("Dados do formulário inválidos (flags):", {
          isStepTwoValid,
          isStepThreeValid,
          isStepFourValid,
          isStepFourValidForStatus,
          statusType,
        });
        // Não retornar aqui, pois já validamos os campos diretamente acima
        // Os flags podem estar desatualizados
      }
    }

    try {
      let logoUrl = pageStrategyStepThreeData?.logoUrl;

      // Se há arquivo de logo, fazer upload primeiro
      if (logoFile) {
        try {
          const fileExtension = logoFile.name.split('.').pop() || 'png';
          const uploadResult = await uploadFileMutation.mutateAsync({
            file: logoFile,
            uploadOptions: {
              filename: `campaigns/logos/campaign-logo-${Date.now()}.${fileExtension}`,
            },
          });
          logoUrl = uploadResult.url;
        } catch (error) {
          toast.error('Erro ao fazer upload do logo. Por favor, tente novamente.');
          console.error('❌ Erro ao fazer upload do logo:', error);
          return;
        }
      }

      // Atualizar stepThreeData com logoUrl (se houver)
      const finalStepThreeData = logoUrl
        ? {
            ...pageStrategyStepThreeData,
            logoUrl,
          }
        : pageStrategyStepThreeData;

      // Mapear dados do formulário para formato do backend
      const campaignData = mapFormDataToCreateCampaign(
        selectedCampaignType,
        campaignStrategy,
        pageStrategyData,
        finalStepThreeData,
        pageStrategyStepFourData,
      );

      // Criar campanha
      await createCampaignMutation.mutateAsync(campaignData);

      // Limpar arquivo após sucesso
      setLogoFile(null);

      // Após sucesso, redirecionar para lista
      router.push("/marketing/campaigns");
    } catch (error) {
      // Erro já é tratado pelo hook (toast)
      console.error("❌ Erro ao criar campanha:", error);
    }
  };;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Header fixo com stepper */}
      <NewCampaignStepperHeader
        currentStep={currentStep}
        onStepChange={handleStepChange}
      />
      {/* Conteúdo scrollável (meio flexível, header/footer fixos) */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <NewCampaignFormSteps
            currentStep={currentStep}
            selectedType={selectedCampaignType}
            campaignStrategy={campaignStrategy}
            onSelectType={handleSelectType}
            pageStrategyData={pageStrategyData}
            onPageStrategyDataChange={setPageStrategyData}
            onStepTwoValidationChange={setIsStepTwoValid}
            pageStrategyStepThreeData={pageStrategyStepThreeData}
            onPageStrategyStepThreeDataChange={setPageStrategyStepThreeData}
            onStepThreeValidationChange={setIsStepThreeValid}
            pageStrategyStepFourData={pageStrategyStepFourData}
            onPageStrategyStepFourDataChange={setPageStrategyStepFourData}
            onStepFourValidationChange={setIsStepFourValid}
            onLogoFileChange={setLogoFile}
            aniversarioStepTwoData={aniversarioStepTwoData}
            onAniversarioStepTwoDataChange={setAniversarioStepTwoData}
            aniversarioStepFourData={aniversarioStepFourData}
            onAniversarioStepFourDataChange={setAniversarioStepFourData}
          />
        </ScrollArea>
      </div>
      {/* Footer fixo com botões - colado na parte inferior */}
      <NewCampaignStepperFooter
        currentStep={currentStep}
        totalSteps={TOTAL_STEPS}
        onNext={handleNext}
        onPrev={prevStep}
        isSubmitting={createCampaignMutation.isPending || uploadFileMutation.isPending}
        canContinue={
          currentStep === 1
            ? !!selectedCampaignType?.typeId
            : currentStep === 2 && campaignStrategy === "PAGE"
              ? isStepTwoValid
              : currentStep === 2 && campaignStrategy === "BROADCAST"
                ? isStepTwoValid
                : currentStep === 3 && campaignStrategy === "PAGE"
                  ? isStepThreeValid
                  : currentStep === 3 && campaignStrategy === "BROADCAST"
                    ? true
                    : currentStep === 4 && campaignStrategy === "PAGE"
                      ? isStepFourValid
                      : currentStep === 4 && campaignStrategy === "BROADCAST"
                        ? isStepFourValid
                        : true
        }
      />
    </div>
  );
}
