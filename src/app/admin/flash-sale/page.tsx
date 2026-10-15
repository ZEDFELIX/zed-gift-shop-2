"use client";

import { useEffect, useMemo, useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { FlashSaleCountdown } from "@/components/shop/FlashSaleCountdown";

type Product = { id: string; name: string; quantity: number; status: string; tags: string[] };

function saleStatus(startsAt: string, endsAt: string, active: boolean) {
  if (!active) return { label: "Disabled", className: "bg-slate-100 text-slate-600" };
  const now = Date.now();
  const start = startsAt ? new Date(startsAt).getTime() : null;
  const end = endsAt ? new Date(endsAt).getTime() : null;
  if (start !== null && now < start) return { label: "Upcoming", className: "bg-amber-100 text-amber-700" };
  if (end !== null && now >= end) return { label: "Ended", className: "bg-slate-100 text-slate-600" };
  return { label: "Live now", className: "bg-emerald-100 text-emerald-700" };
}

export default function FlashSaleAdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [title, setTitle] = useState("Customer Service Week Sale");
  const [subtitle, setSubtitle] = useState("Limited-time offers on selected gifts.");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [active, setActive] = useState(true);
  const [boxColor, setBoxColor] = useState("#FBE9EE");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/flash-sale").then((r) => r.json()),
      fetch("/api/admin/products?limit=100").then((r) => r.json()),
    ]).then(([sale, data]) => {
      setTitle(sale.title ?? "Customer Service Week Sale");
      setSubtitle(sale.subtitle ?? "Limited-time offers on selected gifts.");
      setStartsAt(sale.startsAt ?? "");
      setEndsAt(sale.endsAt ?? "");
      setActive(Boolean(sale.active));
      setBoxColor(typeof sale.boxColor === "string" && /^#[0-9a-fA-F]{6}$/.test(sale.boxColor) ? sale.boxColor : "#FBE9EE");
      setProducts(data.products ?? []);
      setSelected(data.products?.filter((p: Product) => p.tags?.includes("flash-sale")).map((p: Product) => p.id) ?? []);
    });
  }, []);

  const status = useMemo(() => saleStatus(startsAt, endsAt, active), [startsAt, endsAt, active]);

  function toggle(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/flash-sale", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, subtitle, startsAt, endsAt, active, boxColor, productIds: selected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't save flash sale.");
      setMessage("Flash sale saved.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Couldn't save flash sale.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <section className="rounded-zed border border-edge bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold text-[#07111F]">Flash Sale Manager</h2>
            <p className="mt-1 text-sm text-[#334155]">Control the sale name, message, schedule and products shown in the flash-sale section.</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${status.className}`}>{status.label}</span>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div><label className="label">Sale title</label><input className="field" value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Customer Service Week Sale" /></div>
          <div><label className="label">Sale message</label><input className="field" value={subtitle} onChange={(e)=>setSubtitle(e.target.value)} /></div>
          <div><label className="label">Start time</label><input className="field" type="datetime-local" value={startsAt} onChange={(e)=>setStartsAt(e.target.value)} /></div>
          <div><label className="label">End time</label><input className="field" type="datetime-local" value={endsAt} onChange={(e)=>setEndsAt(e.target.value)} /></div>
          <div>
            <label className="label">Sale box color</label>
            <div className="flex gap-2">
              <input type="color" value={boxColor} onChange={(e)=>setBoxColor(e.target.value)} className="h-11 w-14 shrink-0 rounded-md border border-edge bg-white p-1" aria-label="Sale box color" />
              <input className="field" value={boxColor} onChange={(e)=>setBoxColor(e.target.value)} pattern="^#[0-9A-Fa-f]{6}$" />
            </div>
          </div>
        </div>
        <label className="mt-5 flex items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={active} onChange={(e)=>setActive(e.target.checked)} className="size-4" /> Flash sale enabled</label>
      </section>

      <section className="rounded-zed border border-edge bg-white p-6">
        <h3 className="font-display text-lg font-bold">Countdown preview</h3>
        <p className="text-sm text-[#334155]">This is the timer customers see above the Flash Sale section, on your chosen box color.</p>
        <div className="mt-4 rounded-zed px-4 py-6" style={{ backgroundColor: /^#[0-9a-fA-F]{6}$/.test(boxColor) ? boxColor : "#FBE9EE" }}>
          <FlashSaleCountdown startsAt={startsAt} endsAt={endsAt} active={active} />
        </div>
      </section>

      <section className="rounded-zed border border-edge bg-white p-6">
        <div className="flex items-center justify-between gap-3"><div><h3 className="font-display text-lg font-bold">Sale products</h3><p className="text-sm text-[#334155]">Select the products that appear in the flash sale.</p></div><span className="text-sm font-bold">{selected.length} selected</span></div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <label key={p.id} className={`flex cursor-pointer items-center gap-3 rounded-zed border p-3 ${selected.includes(p.id) ? "border-soft-sage bg-panel" : "border-edge"}`}>
              <input type="checkbox" checked={selected.includes(p.id)} onChange={()=>toggle(p.id)} className="size-4" />
              <span className="min-w-0"><span className="block truncate text-sm font-semibold">{p.name}</span><span className="text-xs text-[#334155]">{p.quantity} in stock</span></span>
            </label>
          ))}
        </div>
      </section>

      {message && <p className="rounded-zed bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{message}</p>}
      <button disabled={busy} className="flex items-center gap-2 rounded-zed bg-zed-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save flash sale</button>
    </form>
  );
}
