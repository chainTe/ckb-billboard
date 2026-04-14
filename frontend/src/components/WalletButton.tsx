"use client";

import { useWallet } from "@/lib/hooks";

export function WalletButton() {
  const { address, openAction, disconnect } = useWallet();

  if (address) {
    return (
      <button
        onClick={disconnect}
        className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-medium transition-colors"
      >
        {address.slice(0, 8)}...{address.slice(-6)}
      </button>
    );
  }

  return (
    <button
      onClick={openAction}
      className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
    >
      Connect Wallet
    </button>
  );
}
