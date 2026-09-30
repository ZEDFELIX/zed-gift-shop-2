"use client";

import { useEffect } from "react";

export function ServiceWorkerReg() {
 useEffect(() => {
 if (typeof window !== "undefined" && "serviceWorker" in navigator) {
 navigator.serviceWorker.register("/service-worker.js").catch(() => {
 // Registration failed silently
 });
 }
 }, []);

 return null;
}
