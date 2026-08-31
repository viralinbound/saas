import { Suspense } from "react";
import JoinClient from "./JoinClient";

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Loading invite…</div>}>
      <JoinClient />
    </Suspense>
  );
}
