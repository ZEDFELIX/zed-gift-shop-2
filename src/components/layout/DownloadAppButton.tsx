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

function useInstallPrompt() {
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

  if (installed) return null;

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
      disabled={busy}
      className={className}
      aria-label="Download ZED Gift Shop app"
    >
      <Download className="size-4" />
      <span>{busy ? "Installing..." : "Download App"}</span>
    </button>
  );
}

export function DownloadAppPopup({ className = "" }: { className?: string }) {
  void className;
  const { deferred, installed, install, ios } = useInstallPrompt();
  const [showNow, setShowNow] = useState(false);
  const [busy, setBusy] = useState(false);

  // Show popup after 30 seconds on page load, but only until installed/dismissed.
  useEffect(() => {
    if (installed) {
      setShowNow(false);
      return;
    }
    let dismissed = false;
    try {
      dismissed = window.localStorage.getItem(DISMISSED_KEY) === "true";
    } catch {
      dismissed = false;
    }
    if (dismissed) {
      setShowNow(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setShowNow(true);
    }, 30000);

    const onHelp = () => setShowNow(true);
    window.addEventListener("zed:show-install-help", onHelp);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("zed:show-install-help", onHelp);
    };
  }, [installed]);

  function dismiss() {
    setShowNow(false);
    try {
      window.localStorage.setItem(DISMISSED_KEY, "true");
    } catch {
      // Ignore storage failures.
    }
  }

  async function handleInstall() {
    if (busy) return;
    setBusy(true);
    try {
      const outcome = await install();
      // Accepted installs hide forever via the installed flag; anything else
      // just closes this reminder.
      dismiss();
      void outcome;
    } finally {
      setBusy(false);
    }
  }

  if (!showNow || installed) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 w-[calc(100vw-3rem)] max-w-sm bg-white/90 backdrop-blur-xl rounded-2xl p-6 shadow-2xl">
      <div className="flex items-start gap-3">
        <div className="size-8 rounded-full bg-zed-950 text-white flex items-center justify-center shrink-0">
          <Download className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-bold text-zed-950 mb-1">Install ZED Gift Shop</h3>
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
