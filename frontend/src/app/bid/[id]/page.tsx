"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { useWallet } from "@/lib/hooks";
import { API_BASE_URL } from "@/lib/config";

interface RenderData {
  status: string;
  validUntilBlock?: number;
  content?: {
    imageUrl: string;
    alt: string;
    targetUrl: string;
    markdown: string;
  };
  config?: {
    minPricePerBlock: number;
  };
}

export default function BidPage() {
  const params = useParams();
  const id = params.id as string;
  const { address } = useWallet();
  const [data, setData] = useState<RenderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    imageUrl: "",
    alt: "",
    targetUrl: "",
    pricePerBlock: "",
    days: "1",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/render/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!address) {
      alert("Please connect your wallet");
      return;
    }
    setSubmitting(true);
    try {
      // In a full implementation, this would build and sign a CKB transaction
      // For the MVP, we show the intended transaction data
      const blocks = parseInt(form.days) * 144;
      const price = parseInt(form.pricePerBlock);
      const total = blocks * price;
      alert(
        `Bid prepared:\n- Billboard: ${id}\n- Price/block: ${price} shannons\n- Blocks: ${blocks}\n- Total: ${total} shannons\n\n(Full transaction signing would happen here in production)`
      );
    } catch (err: any) {
      alert("Error: " + (err?.message || String(err)));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 px-4 py-8">
          <div className="mx-auto max-w-4xl text-slate-400">Loading...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-2xl font-bold text-white">Bid on Billboard</h1>
          <p className="mt-1 text-slate-400">ID: {id}</p>

          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="text-sm font-medium text-slate-300">Current Status</div>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  data?.status === "leased"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-indigo-500/20 text-indigo-300"
                }`}
              >
                {data?.status === "leased" ? "Leased" : "Available"}
              </span>
              {data?.config && (
                <span className="text-xs text-slate-500">
                  Min price: {data.config.minPricePerBlock.toLocaleString()} shannons/block
                </span>
              )}
            </div>

            {data?.content && (
              <div className="mt-4">
                <img
                  src={data.content.imageUrl}
                  alt={data.content.alt}
                  className="max-h-32 rounded-lg border border-slate-800"
                />
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div>
              <label className="block text-sm font-medium text-slate-300">Image URL (https)</label>
              <input
                type="url"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white outline-none focus:border-indigo-500"
                placeholder="https://example.com/ad.jpg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">Alt Text</label>
              <input
                type="text"
                value={form.alt}
                onChange={(e) => setForm({ ...form, alt: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">Target URL (https)</label>
              <input
                type="url"
                value={form.targetUrl}
                onChange={(e) => setForm({ ...form, targetUrl: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white outline-none focus:border-indigo-500"
                placeholder="https://example.com/landing"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300">Price per Block</label>
                <input
                  type="number"
                  min={data?.config?.minPricePerBlock || 1}
                  value={form.pricePerBlock}
                  onChange={(e) => setForm({ ...form, pricePerBlock: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">Duration (days)</label>
                <input
                  type="number"
                  min={1}
                  value={form.days}
                  onChange={(e) => setForm({ ...form, days: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !address}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
            >
              {submitting ? "Preparing..." : "Submit Bid"}
            </button>
          </form>

          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs text-slate-500">
            <div className="font-medium text-slate-400">Embed Code</div>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-900 p-3">
{`[![Ad](${API_BASE_URL.replace('/v1', '')}/v1/img/${id})](${API_BASE_URL.replace('/v1', '')}/v1/click/${id})`}
            </pre>
          </div>
        </div>
      </main>
    </div>
  );
}
