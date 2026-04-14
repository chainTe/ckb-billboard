"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { useWallet } from "@/lib/hooks";
import { API_BASE_URL } from "@/lib/config";

interface Billboard {
  outpoint: string;
  capacity: string;
  status: number;
  minPricePerBlock: number;
  autoApprove: number;
  totalEarned: number;
  lease?: {
    endBlock: number;
    content: {
      imageUrl: string;
      alt: string;
      targetUrl: string;
    };
  };
}

export default function DashboardPage() {
  const { address } = useWallet();
  const [billboards, setBillboards] = useState<Billboard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) {
      setLoading(false);
      return;
    }
    fetch(`${API_BASE_URL}/creator/billboards?owner=${address}`)
      .then((r) => r.json())
      .then((data) => {
        setBillboards(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [address]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-2xl font-bold text-white">Creator Dashboard</h1>
          <p className="mt-1 text-slate-400">Manage your billboards and review bids.</p>

          {!address ? (
            <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
              Please connect your wallet to view your billboards.
            </div>
          ) : loading ? (
            <div className="mt-8 text-slate-400">Loading...</div>
          ) : billboards.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
              No billboards found.
              <Link href="/create" className="text-indigo-400 hover:underline">Create your first billboard</Link>.
            </div>
          ) : (
            <div className="mt-8 grid gap-6">
              {billboards.map((bb, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-medium text-white">
                        Outpoint: {bb.outpoint}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Capacity: {(parseInt(bb.capacity) / 1e8).toFixed(2)} CKB
                      </div>
                    </div>
                    <div
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                        bb.status === 1
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-indigo-500/20 text-indigo-300"
                      }`}
                    >
                      {bb.status === 1 ? "Leased" : "Available"}
                    </div>
                  </div>

                  {bb.status === 1 && bb.lease && (
                    <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4">
                      <div className="text-sm font-medium text-slate-300">Active Ad</div>
                      <img
                        src={bb.lease.content.imageUrl}
                        alt={bb.lease.content.alt}
                        className="mt-2 max-h-24 rounded-lg object-contain"
                      />
                      <div className="mt-2 text-xs text-slate-500">
                        Target: {bb.lease.content.targetUrl}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex items-center gap-4">
                    <div className="text-sm text-slate-400">
                      Total earned: {(bb.totalEarned / 1e8).toFixed(4)} CKB
                    </div>
                    <div className="text-sm text-slate-400">
                      Min price: {bb.minPricePerBlock.toLocaleString()} shannons/block
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
