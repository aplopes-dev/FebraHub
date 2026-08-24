import { Suspense } from "react";
import { FiscalTabs } from "./fiscal-tabs";

export default function Page() {
  // Suspense: `FiscalTabs` usa `useSearchParams` (Next 16 exige boundary).
  return (
    <Suspense>
      <FiscalTabs />
    </Suspense>
  );
}
