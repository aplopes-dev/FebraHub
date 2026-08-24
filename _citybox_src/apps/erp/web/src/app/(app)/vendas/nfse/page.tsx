import { Suspense } from "react";
import { NfseIssuancePage } from "@/features/nfse-issuance";

export default function Page() {
  return (
    <Suspense>
      <NfseIssuancePage />
    </Suspense>
  );
}
