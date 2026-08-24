"use client";

import { cn } from "@citybox/ui";
import { Card } from "@citybox/ui/atoms";
import { RadioGroupItem } from "@citybox/ui/atoms";

type RadioCardProps = {
    value: string;
    label: string;
    description?: string;
    isSelected: boolean;
    onSelect: (value: string) => void;
    icon?: React.ReactNode;
    checked?: boolean;
};

export function RadioCard({
    value,
    label,
    description,
    isSelected,
    onSelect,
    icon,
    checked,
}: RadioCardProps) {
    const isChecked = checked !== undefined ? checked : isSelected;
    return (
        <label className="block cursor-pointer">
            <Card
                className={cn(
                    "relative transition-all hover:border-primary/50",
                    isChecked && "border-primary border-2"
                )}
            >
                {/* Radio button indicator */}
                <div className="absolute top-1/2 -translate-y-1/2 right-4">
                    <div
                        className={cn(
                            "flex items-center justify-center w-5 h-5 rounded-full border-2 transition-all",
                            isChecked
                                ? "border-primary bg-primary"
                                : "border-muted-foreground/40 bg-background"
                        )}
                    >
                        {isChecked && (
                            <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                        )}
                    </div>
                </div>

                <div className="px-6 py-4">
                    <div className="flex items-start gap-3">
                        {icon && <div className="mt-0.5 shrink-0 text-muted-foreground">{icon}</div>}
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium">{label}</div>
                            {description && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    {description}
                                </p>
                            )}
                        </div>
                        <RadioGroupItem
                            hidden
                            value={value}
                            id={`radio-${value}`}
                            checked={isChecked}
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect(value);
                            }}
                        />
                    </div>
                </div>
            </Card>
        </label>
    );
}
