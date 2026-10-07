"use client";

import { useEffect, useState } from "react";

export function WhatsAppFloat() {
  const [number, setNumber] = useState(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "254711436169");

 useEffect(() => {
  fetch("/api/storefront/settings", { cache: "no-store" }).then((r) => r.ok ? r.json() : null).then((data) => {
   if (typeof data?.whatsappNumber === "string" && data.whatsappNumber.trim()) setNumber(data.whatsappNumber.trim());
  }).catch(() => undefined);
 }, []);
  const message = encodeURIComponent("Hello ZED Gift Shop, I would like to make an enquiry.");
  const href = `https://wa.me/${number}?text=${message}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with ZED Gift Shop on WhatsApp"
      className="fixed bottom-20 right-4 z-[90] sm:bottom-5 sm:right-5 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform duration-200 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#25D366]/30"
    >
      <svg viewBox="0 0 24 24" className="size-7" fill="currentColor" aria-hidden="true">
        <path d="M20.52 3.48A11.86 11.86 0 0 0 12.08 0C5.53 0 .2 5.33.2 11.88c0 2.09.55 4.13 1.6 5.93L.1 24l6.34-1.66a11.85 11.85 0 0 0 5.64 1.43h.01c6.55 0 11.88-5.33 11.88-11.88 0-3.18-1.24-6.17-3.45-8.41Zm-8.44 18.26h-.01a9.83 9.83 0 0 1-5.01-1.37l-.36-.21-3.76.98 1-3.66-.23-.38a9.82 9.82 0 1 1 8.37 4.64Zm5.39-7.36c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.05 1.03-1.05 2.5s1.08 2.9 1.23 3.1c.15.2 2.12 3.24 5.14 4.54.72.31 1.28.49 1.72.63.72.23 1.38.2 1.9.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z" />
      </svg>
    </a>
  );
}
