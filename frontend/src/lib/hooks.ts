"use client";

import { useCcc, useSigner } from "@ckb-ccc/connector-react";
import { useState, useEffect } from "react";

export function useWallet() {
  const { wallet, open, disconnect } = useCcc();
  const signer = useSigner();
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);

  useEffect(() => {
    if (!signer) {
      setAddress(null);
      setBalance(null);
      return;
    }
    signer.getRecommendedAddress().then(setAddress).catch(console.error);
    signer.getBalance().then((b) => setBalance(b.toString())).catch(console.error);
  }, [signer]);

  return { wallet, signer, address, balance, openAction: open, disconnect };
}
