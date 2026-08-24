'use client';

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@citybox/ui/atoms";
import { useCan } from "@/features/clinic/permissions";

export function ButtonNewCampaign() {
  const canCreate = useCan("create", "Marketing");
  if (!canCreate) return null;

  return (
    <Button asChild className="w-full shrink-0 sm:w-auto">
      <Link href="/marketing/campaigns/new">
        <Plus className="h-4 w-4" />
        Nova campanha
      </Link>
    </Button>
  );
}
