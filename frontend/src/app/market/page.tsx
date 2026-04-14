"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { API_BASE_URL } from "@/lib/config";

interface Billboard {
  id: string;
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
    };
  };
}

export default function MarketPage() {
  const [billboards, setBillboards] = useState<Billboard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/market/list?limit=50`)
      .then((r) => r.json())
      .then((data) => {
        setBillboards(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-2xl font-bold text-white">Billboard Market</h1>
          <p className="mt-1 text-slate-400">Browse available ad spaces and active leases.</p>

          {loading ? (
            <div className="mt-8 text-slate-400">Loading...</div>
          ) : billboards.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
              No billboards found. Be the first to
              <Link href="/create" className="text-indigo-400 hover:underline"> create one</Link>!
            </div>
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {billboards.map((bb) => (
                <Link
                  key={bb.id}
                  href={`/bid/${bb.id}`}
                  className="group rounded-2xl border border-slate-800 bg-slate-900 p-4 hover:border-indigo-500/50 transition-colors"
                >
                  <div className="relative aspect-[728/90] overflow-hidden rounded-xl bg-slate-800">
                    {bb.status === 1 && bb.lease ? (
                      <img
                        src={bb.lease.content.imageUrl}
                        alt={bb.lease.content.alt}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-500">
                        Available for Rent
                      </div>
                    )}
                    <div
                      className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                        bb.status === 1
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-indigo-500/20 text-indigo-300"
                      }`}
                    >
                      {bb.status === 1 ? "Leased" : "Available"}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-slate-300">
                      Min price: {bb.minPricePerBlock.toLocaleString()} shannons/block
                    </div>
                    <div className="text-xs text-slate-500">
                      Earned: {(bb.totalEarned / 1e8).toFixed(2)} CKB
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
