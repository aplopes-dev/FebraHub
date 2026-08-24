import React, { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { kcContext } from "./login/getContext";

const KcPage = lazy(() => import("./login/KcPage"));

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Suspense fallback={null}>
      <KcPage kcContext={kcContext} />
    </Suspense>
  </React.StrictMode>
);
