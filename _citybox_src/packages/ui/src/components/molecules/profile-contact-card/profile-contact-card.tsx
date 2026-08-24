import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../../atoms/avatar";
import { Card, CardContent } from "../../atoms/card";
import { cn } from "../../../lib/utils";

export interface ProfileContactCardProps {
  name: string;
  avatar?: React.ReactNode;
  avatarSrc?: string;
  avatarFallback?: string;
  subtitle?: string;
  description?: string;
  className?: string;
}

export function ProfileContactCard({
  name,
  avatar,
  avatarSrc,
  avatarFallback,
  subtitle,
  description,
  className,
}: ProfileContactCardProps) {
  const initials = avatarFallback ?? name.slice(0, 2).toUpperCase();

  return (
    <Card className={cn('min-w-[220px]', className)}>
      <CardContent className="flex items-center gap-3 pt-4">
        {avatar ?? (
          <Avatar className="h-11 w-11 shrink-0 rounded-lg">
            {avatarSrc && <AvatarImage src={avatarSrc} alt={name} />}
            <AvatarFallback className="bg-muted text-xs font-semibold text-muted-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        )}
        <div className="min-w-0 space-y-0.5">
          {subtitle && (
            <p className="text-xs font-medium text-muted-foreground">{subtitle}</p>
          )}
          <p className="truncate text-sm font-semibold">{name}</p>
          {description && (
            <p className="truncate text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
