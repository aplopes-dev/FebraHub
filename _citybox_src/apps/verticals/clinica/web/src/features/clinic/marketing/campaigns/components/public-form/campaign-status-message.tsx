"use client";

import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@citybox/ui/atoms";

export function CampaignStatusMessage() {
  return (
    <div className="w-full max-w-2xl mx-auto py-12">
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-4">
          <div className="rounded-full bg-muted p-4">
            <AlertCircle className="h-10 w-10 text-muted-foreground" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">
              Campanha Indisponível
            </h2>
            <p className="text-muted-foreground">
              Esta campanha não está mais ativa no momento.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
