import { Suspense } from "react";
import OnboardingPage from "./OnboardingClient";

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Loading setup...</div>}>
      <OnboardingPage />
    </Suspense>
  );
}
