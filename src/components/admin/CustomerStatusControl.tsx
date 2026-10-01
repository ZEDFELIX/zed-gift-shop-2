"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const OPTIONS = ["ACTIVE", "SUSPENDED", "DISABLED"] as const;

export function CustomerStatusControl({ customerId, initialStatus }: { customerId: string; initialStatus: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function save(next: string) {
    setError(null);
    const res = await fetch(`/api/admin/customers/${customerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not update the status.");
      setStatus(initialStatus);
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <div>
      <select
        value={status}
        disabled={pending}
        onChange={(e) => {
          setStatus(e.target.value);
          void save(e.target.value);
        }}
        className="field w-full"
      >
        {OPTIONS.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
    </div>
  );
}
