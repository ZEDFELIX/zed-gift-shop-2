"use client";

import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function InstallAppButton() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
      setShowHelp(false);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    if (window.matchMedia("(display-mode: standalone)").matches) setInstalled(true);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function installApp() {
    if (!installPrompt) {
      setShowHelp(true);
      return;
    }
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setInstallPrompt(null);
  }

  if (installed) return null;

  return (
    <>
      <button
        type="button"
        onClick={installApp}
        aria-label="Install Zed Gift Shop app"
        className="fixed bottom-5 left-4 z-[70] rounded-full border border-white/70 bg-zed-950 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-zed-900 focus:ring-offset-2"
      >
        ↓ Install App
      </button>
      {showHelp && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 p-4 sm:items-center" onClick={() => setShowHelp(false)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="install-app-title"
            className="w-full max-w-sm rounded-2xl bg-white p-5 text-[#07111F] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-4">
              <h2 id="install-app-title" className="text-lg font-bold">Install Zed Gift Shop</h2>
              <button type="button" onClick={() => setShowHelp(false)} aria-label="Close" className="rounded-lg px-2 py-1 text-xl">×</button>
            </div>
            <p className="mb-3 text-sm text-slate-600">Add the shop to your phone for an app-like experience. You do not need to download it from an app store.</p>
            <p className="mb-2 text-sm font-semibold">On Android (Chrome)</p>
            <p className="mb-3 text-sm text-slate-600">Tap the browser menu (⋮), then choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</p>
            <p className="mb-2 text-sm font-semibold">On iPhone (Safari)</p>
            <p className="mb-4 text-sm text-slate-600">Tap Share, then choose <strong>Add to Home Screen</strong>.</p>
            <button type="button" onClick={() => setShowHelp(false)} className="w-full rounded-xl bg-zed-950 px-4 py-3 text-sm font-semibold text-white">Got it</button>
          </section>
        </div>
      )}
    </>
  );
}
