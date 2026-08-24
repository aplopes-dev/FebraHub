"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@citybox/ui/atoms";
import { cn } from "@citybox/ui";
import type { CampaignSegmentConfig } from "../../types";

type CampaignSegmentCardProps = {
  segment: CampaignSegmentConfig;
  isSelected: boolean;
  onClick: () => void;
};

export function CampaignSegmentCard({
  segment,
  isSelected,
  onClick,
}: CampaignSegmentCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:border-2 hover:border-primary relative",
        isSelected && "border-primary border-2 "
      )}
      onClick={onClick}
    >
      {/* Radio button indicator */}
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

      <CardHeader>
        <CardTitle className="text-lg pr-8">{segment.label}</CardTitle>
        <CardDescription>{segment.description}</CardDescription>
      </CardHeader>
    </Card>
  );
}
