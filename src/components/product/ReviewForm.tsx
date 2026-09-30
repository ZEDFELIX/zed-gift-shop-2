"use client";

import { useState } from "react";
import { Check, Star } from "lucide-react";

export function ReviewForm({ productId }: { productId: string }) {
 const [rating, setRating] = useState(0);
 const [hover, setHover] = useState(0);
 const [title, setTitle] = useState("");
 const [comment, setComment] = useState("");
 const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
 const [error, setError] = useState("");

 async function submit(e: React.FormEvent) {
 e.preventDefault();
 if (rating < 1) {
 setError("Pick a star rating.");
 return;
 }
 setState("busy");
 setError("");
 try {
 const res = await fetch("/api/reviews", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ productId, rating, title, comment }),
 });
 const data = (await res.json()) as { ok?: boolean; error?: string };
 if (!res.ok || !data.ok) {
 setState("error");
 setError(data.error ?? "Could not submit review.");
 return;
 }
 setState("done");
 } catch {
 setState("error");
 setError("Could not submit review.");
 }
 }

 if (state === "done") {
 return (
 <div className="flex items-center gap-2 rounded-zed glass-panel px-4 py-3 text-sm font-semibold text-[#171717]">
 <Check className="size-4 text-soft-sage" /> Thanks! Your review is in the queue for approval.
 </div>
 );
 }

 return (
 <form onSubmit={submit} className="space-y-4">
 <div>
 <p className="label">Your rating</p>
 <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
 {[1, 2, 3, 4, 5].map((star) => (
 <button
 key={star}
 type="button"
 onMouseEnter={() => setHover(star)}
 onClick={() => setRating(star)}
 aria-label={`${star} star${star === 1 ? "" : "s"}`}
 className="p-0.5"
 >
 <Star className={`size-7 ${star <= (hover || rating) ? "fill-zed-950 text-white" : "text-[#6B6B6B]"}`} />
 </button>
 ))}
 </div>
 </div>
 <div>
 <label className="label" htmlFor="review-title">Review title</label>
 <input id="review-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} className="field" placeholder="Says it, beautifully" />
 </div>
 <div>
 <label className="label" htmlFor="review-comment">Your review</label>
 <textarea id="review-comment" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={2000} rows={4} className="field" placeholder="How did it feel, how did they react, how did it arrive?" />
 </div>
 {error && <p className="text-sm text-red-600">{error}</p>}
 <button type="submit" disabled={state === "busy"} className="rounded-zed bg-zed-950 px-6 py-3 text-sm font-bold text-white disabled:opacity-60">
 {state === "busy" ? "Submitting..." : "Submit review"}
 </button>
 </form>
 );
}