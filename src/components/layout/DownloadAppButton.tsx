"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

export function DownloadAppButton({ className = "" }: { className?: string }) {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function installApp() {
    if (promptEvent) {
      await promptEvent.prompt();
      const result = await promptEvent.userChoice;
      if (result.outcome === "accepted") setInstalled(true);
      setPromptEvent(null);
      return;
    }

    alert("To install ZED Gift Shop, open your browser menu and choose “Add to Home screen” or “Install app”.");
  }

  if (installed) return null;

  return (
    <button
      type="button"
      onClick={installApp}
      className={className}
      aria-label="Download ZED Gift Shop app"
    >
      <Download className="size-4" />
      <span>Download App</span>
    </button>
  );
}
