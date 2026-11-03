"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function PageThemeScope() {
  const pathname = usePathname();
  useEffect(() => {
    const first = pathname.split("/").filter(Boolean)[0] || "home";
    document.body.dataset.zedPage = first;
    return () => { delete document.body.dataset.zedPage; };
  }, [pathname]);
  return null;
}
