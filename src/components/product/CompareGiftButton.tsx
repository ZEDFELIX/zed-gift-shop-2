"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Check } from "lucide-react";

export type CompareGift = {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  inStock: boolean;
  personalizable: boolean;
  image: string | null;
};

const KEY = "zed-gift-compare-v1";
const EVENT = "zed:compare-updated";

function readItems(): CompareGift[] {
  try {
    const value = JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as unknown;
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is CompareGift =>
      Boolean(item) && typeof item === "object" &&
      typeof (item as CompareGift).id === "string" &&
      typeof (item as CompareGift).slug === "string" &&
      typeof (item as CompareGift).name === "string"
    ).slice(0, 4);
  } catch { return []; }
}

export function CompareGiftButton({ gift }: { gift: CompareGift }) {
  const [selected, setSelected] = useState(false);
  const [count, setCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const refresh = () => {
      const items = readItems();
      setSelected(items.some((item) => item.id === gift.id));
      setCount(items.length);
    };
    refresh();
    window.addEventListener(EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [gift.id]);

  function click() {
    if (selected) {
      router.push("/compare");
      return;
    }
    const items = readItems();
    if (items.length >= 4) {
      window.alert("You can compare up to 4 gifts at a time. Remove one from the comparison page first.");
      return;
    }
    const next = [...items, gift];
    window.localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(EVENT));
    setSelected(true);
    setCount(next.length);
  }

  return (
    <button type="button" onClick={click} title={selected ? "Open gift comparison" : "Add to compare"} aria-label={selected ? `View comparison of ${count} gifts` : `Compare ${gift.name}`} className="absolute bottom-2 right-2 z-20 inline-flex min-h-8 items-center gap-1 rounded-full border border-black/10 bg-white/95 px-2.5 py-1 text-[10px] font-bold text-[#542447] shadow-sm transition hover:bg-white sm:text-[11px]">
      {selected ? <Check className="size-3.5" /> : <ArrowLeftRight className="size-3.5" />}
      {selected ? `Compare ${count}` : "Compare"}
    </button>
  );
}
