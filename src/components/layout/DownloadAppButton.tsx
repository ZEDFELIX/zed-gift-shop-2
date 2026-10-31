"use client";

import { useCallback, useEffect, useState } from "react";
import { Download } from "lucide-react";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const INSTALLED_KEY = "zed:app-installed";
const DISMISSED_KEY = "appPopupDismissed";

function isIOS(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  return (window.navigator as unknown as { standalone?: boolean }).standalone === true;
}

export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true);
      return;
    }
    try {
      if (window.localStorage.getItem(INSTALLED_KEY) === "true") {
        setInstalled(true);
        return;
      }
    } catch {
      // Storage unavailable - fall through to prompt listening.
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
      try {
        window.localStorage.setItem(INSTALLED_KEY, "true");
      } catch {
        // Ignore storage failures.
      }
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async (): Promise<"installed" | "dismissed" | "unavailable"> => {
    if (!deferred) return "unavailable";
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      setDeferred(null);
      if (choice.outcome === "accepted") {
        setInstalled(true);
        try {
          window.localStorage.setItem(INSTALLED_KEY, "true");
        } catch {
          // Ignore storage failures.
        }
        return "installed";
      }
      return "dismissed";
    } catch {
      setDeferred(null);
      return "unavailable";
    }
  }, [deferred]);

  return { deferred, installed, install, ios: isIOS() };
}

export function DownloadAppButton({ className = "" }: { className?: string }) {
  const { installed, install } = useInstallPrompt();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (busy) return;
    setBusy(true);
    try {
      const outcome = await install();
      if (outcome === "unavailable") {
        window.dispatchEvent(new CustomEvent("zed:show-install-help"));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy || installed}
      className={`${className} ${installed ? "cursor-default opacity-90" : ""}`}
      aria-label="Download ZED Gift Shop app"
    >
      <Download className="size-4" />
      <span>{installed ? "App Installed" : busy ? "Installing..." : "Download App"}</span>
    </button>
  );
}

export function DownloadAppPopup() {
  const { deferred, installed, install, ios } = useInstallPrompt();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleClose = useCallback(() => {
    setOpen(false);
    try {
      window.sessionStorage.setItem(DISMISSED_KEY, "true");
    } catch {
      // Ignore storage failures.
    }
  }, []);

  // Shown on the first visit of each session until installed. Closing it hides
  // it for this session only - the bottom-nav "Install" entry re-opens it.
  useEffect(() => {
    let hide = false;
    try {
      hide =
        window.localStorage.getItem(INSTALLED_KEY) === "true" ||
        window.sessionStorage.getItem(DISMISSED_KEY) === "true";
    } catch {
      hide = false;
    }
    setOpen(!hide);
  }, [installed]);

  useEffect(() => {
    const onHelp = () => setOpen(true);
    window.addEventListener("zed:show-install-help", onHelp);
    return () => window.removeEventListener("zed:show-install-help", onHelp);
  }, []);

  // Escape to close, and lock background scroll while the sheet is open.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, handleClose]);

  async function handleInstall() {
    if (busy) return;
    setBusy(true);
    try {
      const outcome = await install();
      // Accepted installs hide forever via the installed flag; a plain dismissal
      // just closes this reminder until the next session.
      if (outcome !== "dismissed") setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  if (!open || installed) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-app-title"
      className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] z-[100] mx-auto w-auto max-w-sm rounded-2xl border border-black/10 bg-white/95 p-4 shadow-2xl backdrop-blur-xl sm:inset-x-auto sm:bottom-6 sm:left-6 sm:w-[22rem] sm:p-6"
    >
      <button
        type="button"
        onClick={handleClose}
        aria-label="Close"
        className="absolute right-2.5 top-2.5 grid size-9 place-items-center rounded-full text-charcoal/50 transition-colors hover:bg-black/5 hover:text-charcoal"
      >
        ×
      </button>
      <div className="flex items-start gap-3">
        <div className="size-8 rounded-full bg-zed-950 text-white flex items-center justify-center shrink-0">
          <Download className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 id="install-app-title" className="text-xl font-bold text-zed-950 mb-1">Install ZED Gift Shop</h2>
          <p className="text-charcoal/70 text-sm mb-3">
            Install the app to your home screen for quick access and push notifications.
          </p>
          {!deferred && (
            <ul className="mb-3 space-y-1.5 text-xs text-charcoal/70">
              {ios ? (
                <>
                  <li>1. Tap the Share button in Safari</li>
                  <li>2. Tap &ldquo;Add to Home Screen&rdquo;</li>
                </>
              ) : (
                <>
                  <li>1. Open your browser menu (&#8942;)</li>
                  <li>2. Tap &ldquo;Install app&rdquo; or &ldquo;Add to Home screen&rdquo;</li>
                </>
              )}
            </ul>
          )}
          <button
            onClick={handleInstall}
            disabled={busy}
            className="mt-2 rounded-zed bg-zed-950 px-4 py-2 text-sm font-bold text-white hover:bg-zed-900 transition-colors w-full disabled:opacity-60"
          >
            {busy ? "Installing..." : deferred ? "Install" : "Got it"}
          </button>
        </div>
      </div>
    </div>
  );
}
