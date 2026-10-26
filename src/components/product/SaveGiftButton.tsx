"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Loader2 } from "lucide-react";

let savedIdsRequest: Promise<Set<string>> | null = null;

function loadSavedIds(): Promise<Set<string>> {
  if (!savedIdsRequest) {
    savedIdsRequest = fetch("/api/wishlist")
      .then(async (res) => {
        if (!res.ok) return new Set<string>();
        const data = await res.json() as { items?: { productId: string }[] };
        return new Set((data.items ?? []).map((item) => item.productId));
      })
      .catch(() => new Set<string>());
  }
  return savedIdsRequest;
}

export function SaveGiftButton({ productId, productName }: { productId: string; productName: string }) {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    void loadSavedIds().then((ids) => { if (active) setSaved(ids.has(productId)); });
    return () => { active = false; };
  }, [productId]);

  async function toggleSaved() {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch(saved ? `/api/wishlist?productId=${encodeURIComponent(productId)}` : "/api/wishlist", {
        method: saved ? "DELETE" : "POST",
        headers: saved ? undefined : { "Content-Type": "application/json" },
        body: saved ? undefined : JSON.stringify({ productId }),
      });
      if (response.status === 401) {
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      const data = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Couldn't update saved gifts.");
      const nextSaved = !saved;
      setSaved(nextSaved);
      savedIdsRequest = null;
      if (nextSaved) {
        savedIdsRequest = Promise.resolve(new Set([...(await loadSavedIds()), productId]));
      } else {
        savedIdsRequest = Promise.resolve(new Set([...(await loadSavedIds())].filter((id) => id !== productId)));
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Couldn't update saved gifts. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggleSaved}
      disabled={busy}
      aria-label={saved ? `Remove ${productName} from saved gifts` : `Save ${productName}`}
      title={saved ? "Remove from saved gifts" : "Save gift"}
      className="absolute right-2 top-2 z-20 grid size-9 place-items-center rounded-full border border-black/10 bg-white/95 text-[#542447] shadow-sm transition hover:scale-105 hover:bg-white disabled:opacity-60"
    >
      {busy ? <Loader2 className="size-4 animate-spin" /> : <Heart className={`size-4 ${saved ? "fill-current" : ""}`} />}
    </button>
  );
}
