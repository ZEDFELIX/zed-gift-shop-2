"use client";

import { useState } from "react";
import { Sparkles, Eye, EyeOff } from "lucide-react";

export function SurpriseToggle() {
 const [isSurprise, setIsSurprise] = useState(false);

 return (
 <div className="rounded-zed border border-zed-900/30 bg-warm-white/50 p-4 backdrop-blur-sm">
 <button
 type="button"
 onClick={() => setIsSurprise((v) => !v)}
 className="flex w-full items-center justify-between"
 >
 <div className="flex items-center gap-2">
 <Sparkles className="size-5 text-soft-sage" />
 <div className="text-left">
 <p className="text-sm font-bold text-[#171717]">This is a surprise</p>
 <p className="text-xs text-[#171717]">Hide price & invoice from delivery</p>
 </div>
 </div>
 <div className="relative h-7 w-12 rounded-full bg-zed-950 transition-colors">
 <span
 className={`absolute top-1 bottom-1 rounded-full bg-zed-950 transition-transform ${
 isSurprise ? "translate-x-6" : "translate-x-0.5"
 }`}
 />
 {isSurprise ? (
 <Eye className="absolute right-2 top-1/2 size-4 -translate-y-1/2 text-[#171717]" />
 ) : (
 <EyeOff className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-white/50" />
 )}
 </div>
 </button>
 {isSurprise && (
 <div className="mt-3 space-y-2 text-xs text-[#171717]">
 <p>- Price is hidden from the delivery slip</p>
 <p>- Your details are protected</p>
 <p>- Neutral communication is sent</p>
 <p>- A handwritten-style note is included</p>
 </div>
 )}
 </div>
 );
}
