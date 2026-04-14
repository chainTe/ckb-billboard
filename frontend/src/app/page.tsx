import Link from "next/link";
import { Navbar } from "@/components/Navbar";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="relative overflow-hidden px-4 pt-20 pb-24">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
              Decentralized Billboard
              <span className="block bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                On CKB
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
              Create on-chain ad spaces, earn CKB from advertisers, and embed
              billboards anywhere with pure Markdown or our JS SDK.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/market"
                className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-500 transition-colors"
              >
                Explore Market
              </Link>
              <Link
                href="/create"
                className="rounded-xl bg-slate-800 px-6 py-3 font-semibold text-white hover:bg-slate-700 border border-slate-700 transition-colors"
              >
                Create Billboard
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-slate-800 bg-slate-900/50 px-4 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-8 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <div className="mb-4 h-10 w-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xl">🖼️</div>
                <h3 className="text-lg font-semibold text-white">Pure Markdown</h3>
                <p className="mt-2 text-sm text-slate-400">
                  Embed with a simple image link. Zero dependencies, works in any blog or forum.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <div className="mb-4 h-10 w-10 rounded-lg bg-violet-500/20 text-violet-400 flex items-center justify-center text-xl">⛓️</div>
                <h3 className="text-lg font-semibold text-white">100% On-Chain</h3>
                <p className="mt-2 text-sm text-slate-400">
                  Ownership, leases, and content hashes all live on CKB. No centralized backend.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <div className="mb-4 h-10 w-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl">💰</div>
                <h3 className="text-lg font-semibold text-white">Instant Revenue</h3>
                <p className="mt-2 text-sm text-slate-400">
                  Receive rent directly in CKB. Snatch leases with 120% premium and no platform fees.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 px-4 py-8 text-center text-sm text-slate-500">
        CKB Billboard — Decentralized Ad Space on Nervos CKB
      </footer>
    </div>
  );
}
