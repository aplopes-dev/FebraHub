"use client";

import { useState, useMemo } from "react";
import { CampaignSegmentCard } from "./campaign-segment-card";
import { CampaignTypeCard } from "./campaign-type-card";
import { CAMPAIGN_SEGMENTS } from "../../constants";
import type { SelectedCampaignType } from "../../types";

type CampaignStepOneProps = {
  selectedType?: SelectedCampaignType;
  onSelectType: (type: SelectedCampaignType) => void;
};

export function CampaignStepOne({
  selectedType,
  onSelectType,
}: CampaignStepOneProps) {
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(
    selectedType?.segmentId || null
  );

  // Sincronizar com prop selectedType quando mudar externamente
  const currentSegmentId = selectedType?.segmentId || selectedSegmentId;

  const selectedSegment = useMemo(() => {
    if (!currentSegmentId) return null;
    return CAMPAIGN_SEGMENTS.find((seg) => seg.id === currentSegmentId) || null;
  }, [currentSegmentId]);

  const handleSegmentSelect = (segmentId: string) => {
    setSelectedSegmentId(segmentId);
    // Limpar seleção de tipo ao mudar de segmento
    if (currentSegmentId !== segmentId) {
      onSelectType({ segmentId, typeId: "" });
    }
  };

  const handleTypeSelect = (typeId: string) => {
    if (!currentSegmentId) return;
    onSelectType({
      segmentId: currentSegmentId,
      typeId,
    });
  };

  return (
    <div className="space-y-8">
      {/* Cards de Segmentos */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CAMPAIGN_SEGMENTS.map((segment) => (
            <CampaignSegmentCard
              key={segment.id}
              segment={segment}
              isSelected={currentSegmentId === segment.id}
              onClick={() => handleSegmentSelect(segment.id)}
            />
          ))}
        </div>
      </div>

      {/* Grid de Tipos de Campanha */}
      {selectedSegment && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="text-lg font-semibold mb-2">
            Tipos de Campanha - {selectedSegment.label}
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Selecione o tipo de campanha que deseja criar.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedSegment.types.map((type) => {
              const isDisabled =
                type.strategy !== 'PAGE' && type.id !== 'aniversario';
              const isSelected =
                selectedType?.segmentId === currentSegmentId &&
                selectedType?.typeId === type.id;

              return (
                <CampaignTypeCard
                  key={type.id}
                  type={type}
                  isSelected={isSelected}
                  isDisabled={isDisabled}
                  onClick={() => handleTypeSelect(type.id)}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
