"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { useWallet } from "@/lib/hooks";
import { ccc } from "@ckb-ccc/ccc";
import {
  BILLBOARD_TYPE_CODE_HASH,
  BILLBOARD_TYPE_HASH_TYPE,
  BILLBOARD_LOCK_CODE_HASH,
  BILLBOARD_LOCK_HASH_TYPE,
} from "@/lib/config";

export default function CreatePage() {
  const router = useRouter();
  const { signer, address } = useWallet();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    minPrice: "1000",
    autoApprove: false,
    minLeaseDays: "1",
    coolDownDays: "1",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!signer || !address) {
      alert("Please connect your wallet first");
      return;
    }
    if (!BILLBOARD_TYPE_CODE_HASH || !BILLBOARD_LOCK_CODE_HASH) {
      alert("Contracts not deployed yet. Please deploy contracts first.");
      return;
    }
    setSubmitting(true);
    try {
      const client = new ccc.ClientPublicTestnet();
      const tx = ccc.Transaction.from({});
      const lockScript = await ccc.Script.fromKnownScript(
        client,
        ccc.KnownScript.Secp256k1Blake160,
        (await signer.getRecommendedAddressObj()).script.args
      );
      const billboardId = ccc.hexFrom(
        crypto.getRandomValues(new Uint8Array(16))
      );
      const typeScript = new ccc.Script(
        BILLBOARD_TYPE_CODE_HASH as `0x${string}`,
        BILLBOARD_TYPE_HASH_TYPE as ccc.HashType,
        "0x00"
      );
      const billboardLockScript = new ccc.Script(
        BILLBOARD_LOCK_CODE_HASH as `0x${string}`,
        BILLBOARD_LOCK_HASH_TYPE as ccc.HashType,
        (lockScript.args + billboardId.slice(2)) as `0x${string}`
      );
      const minPrice = BigInt(form.minPrice);
      const minLeaseBlocks = Math.max(
        1,
        parseInt(form.minLeaseDays || "1")
      ) * 144;
      const coolDownBlocks = Math.max(
        1,
        parseInt(form.coolDownDays || "1")
      ) * 8640;
      const header = await client.getTipHeader();
      const createdAt = Number(header.timestamp);
      const data = buildBillboardData(
        minPrice,
        form.autoApprove ? 1 : 0,
        minLeaseBlocks,
        coolDownBlocks,
        createdAt
      );
      const capacity = ccc.numToHex(ccc.fixedPointFrom("142"));
      tx.addOutput(
        {
          lock: billboardLockScript,
          type: typeScript,
          capacity,
        },
        data
      );
      await tx.completeInputsByCapacity(signer);
      await tx.addCellDepsOfKnownScripts(client, ccc.KnownScript.Secp256k1Blake160);
      await signer.signTransaction(tx);
      const txHash = await client.sendTransaction(tx);
      alert(`Billboard created! TX: ${txHash}`);
      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      alert("Error: " + (err?.message || String(err)));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 px-4 py-8">
        <div className="mx-auto max-w-xl">
          <h1 className="text-2xl font-bold text-white">Create Billboard</h1>
          <p className="mt-1 text-slate-400">Configure your on-chain ad space.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div>
              <label className="block text-sm font-medium text-slate-300">Min Price per Block (shannons)</label>
              <input
                type="number"
                min={1}
                value={form.minPrice}
                onChange={(e) => setForm({ ...form, minPrice: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                id="autoApprove"
                type="checkbox"
                checked={form.autoApprove}
                onChange={(e) => setForm({ ...form, autoApprove: e.target.checked })}
                className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-indigo-600"
              />
              <label htmlFor="autoApprove" className="text-sm text-slate-300">Auto-approve bids ≥150%</label>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">Min Lease (days)</label>
              <input
                type="number"
                min={1}
                value={form.minLeaseDays}
                onChange={(e) => setForm({ ...form, minLeaseDays: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">Snatch Cooldown (days)</label>
              <input
                type="number"
                min={1}
                value={form.coolDownDays}
                onChange={(e) => setForm({ ...form, coolDownDays: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white outline-none focus:border-indigo-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !address}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
            >
              {submitting ? "Creating..." : "Create Billboard (~142 CKB)"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

function buildBillboardData(
  minPrice: bigint,
  autoApprove: number,
  minLeaseBlocks: number,
  coolDownBlocks: number,
  createdAt: number
): ccc.Hex {
  const buf = new ArrayBuffer(34);
  const view = new DataView(buf);
  let offset = 0;
  const le64 = (v: bigint) => {
    view.setBigUint64(offset, v, true);
    offset += 8;
  };
  const le32 = (v: number) => {
    view.setUint32(offset, v, true);
    offset += 4;
  };
  le64(minPrice);
  view.setUint8(offset++, autoApprove);
  le32(minLeaseBlocks);
  le32(coolDownBlocks);
  le64(BigInt(createdAt));
  view.setUint8(offset++, 0); // status available
  le64(BigInt(0)); // total earned
  return ccc.hexFrom(new Uint8Array(buf));
}
