"use client";

import Link from "next/link";
import { WalletButton } from "./WalletButton";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600" />
          <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            CKB Billboard
          </span>
        </Link>
        <div className="flex items-center gap-6">
          <div className="hidden items-center gap-4 text-sm font-medium text-slate-300 md:flex">
            <Link href="/market" className="hover:text-white transition-colors">Market</Link>
            <Link href="/create" className="hover:text-white transition-colors">Create</Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
          </div>
          <WalletButton />
        </div>
      </div>
    </nav>
  );
}
