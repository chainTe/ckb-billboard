"use client";

import dynamic from "next/dynamic";
import { ReactNode } from "react";

const CccProvider = dynamic(
  () => import("@ckb-ccc/connector-react").then((m) => m.Provider),
  { ssr: false }
);

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <CccProvider
      name="CKB Billboard"
      connectorProps={{
        style: { display: "none" },
      }}
    >
      {children}
    </CccProvider>
  );
}
