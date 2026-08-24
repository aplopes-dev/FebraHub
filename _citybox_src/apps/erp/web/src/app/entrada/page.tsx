import { Suspense } from "react";
import { EntradaClient } from "./entrada-client";

export const dynamic = "force-dynamic";

export default function EntradaPage() {
  return (
    <Suspense fallback={null}>
      <EntradaClient />
    </Suspense>
  );
}
