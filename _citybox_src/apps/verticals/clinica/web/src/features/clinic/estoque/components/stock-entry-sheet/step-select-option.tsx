"use client";

import { PackageCheck, PackagePlus } from "lucide-react";
import { cn } from "@citybox/ui";

import type { StockEntryOption } from "./types";

interface OptionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}

function OptionCard({ icon, title, description, selected, onClick }: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-4 rounded-lg border-2 p-6 text-center transition-all hover:border-primary/50 hover:bg-muted/50",
        selected && "border-primary bg-primary/5",
      )}
    >
      <div
        className={cn(
          "flex size-16 items-center justify-center rounded-full bg-muted",
          selected && "bg-primary/10",
        )}
      >
        {icon}
      </div>
      <div className="space-y-1">
        <h4 className="font-semibold">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}

interface StepSelectOptionProps {
  selectedOption: StockEntryOption | null;
  onSelectOption: (option: StockEntryOption) => void;
}

export function StepSelectOption({
  selectedOption,
  onSelectOption,
}: StepSelectOptionProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Escolha uma opção</h3>
        <p className="text-sm text-muted-foreground">
          Selecione o tipo de entrada que deseja fazer no estoque
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <OptionCard
          icon={<PackagePlus className="size-8 text-primary" />}
          title="É um produto que eu não tenho cadastrado"
          description="Eu ainda não tenho esse produto cadastrado no meu estoque"
          selected={selectedOption === "new-product"}
          onClick={() => onSelectOption("new-product")}
        />
        <OptionCard
          icon={<PackageCheck className="size-8 text-primary" />}
          title="É um produto que eu já tenho cadastrado"
          description="Eu preciso aumentar a quantidade desse produto no meu estoque"
          selected={selectedOption === "existing-product"}
          onClick={() => onSelectOption("existing-product")}
        />
      </div>
    </div>
  );
}
