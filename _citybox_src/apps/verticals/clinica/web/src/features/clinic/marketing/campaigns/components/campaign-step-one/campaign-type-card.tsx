"use client";

import * as LucideIcons from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@citybox/ui/atoms";
import { Badge } from "@citybox/ui/atoms";
import { cn } from "@citybox/ui";
import type { CampaignType } from "../../types";

type CampaignTypeCardProps = {
  type: CampaignType;
  isSelected: boolean;
  isDisabled: boolean;
  onClick?: () => void;
};

export function CampaignTypeCard({
  type,
  isSelected,
  isDisabled,
  onClick,
}: CampaignTypeCardProps) {
  // Obter o componente de ícone dinamicamente
  const IconComponent =
    (LucideIcons[type.icon as keyof typeof LucideIcons] as React.ComponentType<{
      className?: string;
    }>) || LucideIcons.FileText;

  const handleClick = () => {
    if (!isDisabled && onClick) {
      onClick();
    }
  };

  return (
    <Card
      className={cn(
        "transition-all relative",
        !isDisabled && "cursor-pointer hover:border-primary/50",
        isDisabled && "opacity-50 cursor-not-allowed grayscale",
        isSelected && !isDisabled && "border-primary border-2 "
      )}
      onClick={handleClick}
    >
      {/* Radio button indicator */}
      {!isDisabled && (
        <div className="absolute top-4 right-4">
          <div
            className={cn(
              "flex items-center justify-center w-5 h-5 rounded-full border-2 transition-all",
              isSelected
                ? "border-primary bg-primary"
                : "border-muted-foreground/40 bg-background"
            )}
          >
            {isSelected && (
              <div className="w-2 h-2 rounded-full bg-primary-foreground" />
            )}
          </div>
        </div>
      )}

      <CardHeader>
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "flex items-center justify-center w-12 h-12 rounded-lg shrink-0",
              isSelected && !isDisabled
                ? "bg-primary/10 text-primary"
                : isDisabled
                  ? "bg-muted/50 text-muted-foreground"
                  : "bg-muted text-muted-foreground"
            )}
          >
            <IconComponent className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 pr-6">
              <CardTitle className="text-base">{type.title}</CardTitle>
              {isDisabled && (
                <Badge variant="secondary" className="text-xs shrink-0">
                  Em breve
                </Badge>
              )}
            </div>
            <CardDescription className="mt-1">{type.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
