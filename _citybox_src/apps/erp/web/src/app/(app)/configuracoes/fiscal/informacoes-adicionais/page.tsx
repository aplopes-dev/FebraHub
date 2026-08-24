import { Suspense } from "react";
import { FiscalAdditionalInfoListPage } from "@/features/fiscal-additional-info";

export default function Page() {
  // Suspense: a página usa `useSearchParams` (Next 16 exige boundary).
  return (
    <Suspense>
      <FiscalAdditionalInfoListPage />
    </Suspense>
  );
}
