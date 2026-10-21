"use client";

import { useRef, useState } from "react";
import { Check, ImagePlus, Star, X } from "lucide-react";

type Photo = { file: File; preview: string };

export function ReviewForm({ productId }: { productId: string }) {
 const [rating, setRating] = useState(0);
 const [hover, setHover] = useState(0);
 const [title, setTitle] = useState("");
 const [comment, setComment] = useState("");
 const [photos, setPhotos] = useState<Photo[]>([]);
 const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
 const [error, setError] = useState("");
 const inputRef = useRef<HTMLInputElement>(null);

 function addFiles(fileList: FileList | null) {
 if (!fileList) return;
 const next: Photo[] = [];
 for (const file of Array.from(fileList)) {
 if (!file.type.startsWith("image/") || file.type === "image/svg+xml") continue;
 if (file.size > 8 * 1024 * 1024) continue;
 next.push({ file, preview: URL.createObjectURL(file) });
 }
 setPhotos((prev) => [...prev, ...next].slice(0, 4));
 if (inputRef.current) inputRef.current.value = "";
 }

 function removePhoto(index: number) {
 setPhotos((prev) => {
 const copy = [...prev];
 const removed = copy.splice(index, 1)[0];
 if (removed) URL.revokeObjectURL(removed.preview);
 return copy;
 });
 }

 async function uploadPhotos(): Promise<string[]> {
 const urls: string[] = [];
 for (const photo of photos) {
 const form = new FormData();
 form.append("file", photo.file);
 const res = await fetch("/api/reviews/images", { method: "POST", body: form });
 const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
 if (!res.ok || !data.url) throw new Error(data.error ?? "Could not upload your photo.");
 urls.push(data.url);
 }
 return urls;
 }

 async function submit(e: React.FormEvent) {
 e.preventDefault();
 if (rating < 1) {
 setError("Pick a star rating.");
 return;
 }
  setState("busy");
  setError("");
  try {
  let images: string[] = [];
  if (photos.length > 0) {
  images = await uploadPhotos();
  }
  // Honeypot value comes straight from the invisible input so bots that
  // auto-fill it are dropped server-side without any feedback.
  const form = e.currentTarget as HTMLFormElement;
  const websiteInput = form.elements.namedItem("website");
  const website = websiteInput instanceof HTMLInputElement ? websiteInput.value : "";
  const res = await fetch("/api/reviews", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ productId, rating, title, comment, images: images.length ? images : undefined, website }),
  });
 const data = (await res.json()) as { ok?: boolean; error?: string };
 if (!res.ok || !data.ok) {
 setState("error");
 setError(data.error ?? "Could not submit review.");
 return;
 }
 setState("done");
 } catch (err) {
 setState("error");
 setError(err instanceof Error ? err.message : "Could not submit review.");
 }
 }

 if (state === "done") {
 return (
 <div className="flex items-center gap-2 rounded-zed glass-panel px-4 py-3 text-sm font-semibold text-[#07111F]">
 <Check className="size-4 text-soft-sage" /> Thanks! Your review is in the queue for approval.
 </div>
 );
 }

 return (
  <form onSubmit={submit} className="space-y-4">
  {/* Honeypot: hidden from shoppers; stopped by the API server-side when filled. */}
  <input
  type="text"
  name="website"
  aria-hidden="true"
  tabIndex={-1}
  autoComplete="off"
  className="hidden"
  />
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
 className="p-2 sm:p-1"
 >
 <Star className={`size-7 ${star <= (hover || rating) ? "fill-zed-950 text-white" : "text-[#334155]"}`} />
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
 <div>
 <p className="label">Add photos <span className="font-normal text-[rgba(48,37,34,0.62)]">(up to 4)</span></p>
 <div className="flex flex-wrap items-center gap-2">
 {photos.map((photo, i) => (
 <span key={photo.preview} className="relative">
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img src={photo.preview} alt={`Your photo ${i + 1}`} className="size-16 rounded-lg object-cover ring-1 ring-black/10" />
 <button
 type="button"
 onClick={() => removePhoto(i)}
 aria-label="Remove photo"
 className="absolute -right-1.5 -top-1.5 grid size-6 place-items-center rounded-full bg-zed-950 text-white"
 >
 <X className="size-3.5" />
 </button>
 </span>
 ))}
 {photos.length < 4 && (
 <button
 type="button"
 onClick={() => inputRef.current?.click()}
 className="grid size-16 place-items-center rounded-lg border border-dashed border-[rgba(48,37,34,0.3)] text-[rgba(48,37,34,0.62)] hover:border-soft-sage hover:text-soft-sage"
 >
 <ImagePlus className="size-5" />
 </button>
 )}
 <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" multiple className="sr-only" onChange={(e) => addFiles(e.target.files)} />
 </div>
 </div>
 {error && <p className="text-sm text-red-600">{error}</p>}
 <button type="submit" disabled={state === "busy"} className="rounded-zed bg-zed-950 px-6 py-3 text-sm font-bold text-white disabled:opacity-60">
 {state === "busy" ? (photos.length ? "Uploading & submitting..." : "Submitting...") : "Submit review"}
 </button>
 </form>
 );
}
