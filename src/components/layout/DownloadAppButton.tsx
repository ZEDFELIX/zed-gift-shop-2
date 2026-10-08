"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

export function DownloadAppButton({ className = "" }: { className?: string }) {
  const [promptEvent, setPromptEvent] = useState<any>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall as EventListener);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall as EventListener);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function installApp() {
    if (promptEvent) {
      promptEvent.prompt();
      const result = await promptEvent.userChoice;
      if (result?.outcome === "accepted") setInstalled(true);
      setPromptEvent(null);
      return;
    }
    alert("To install ZED Gift Shop, open your browser menu and choose “Add to Home screen” or “Install app”.");
  }

  if (installed) return null;

  return (
    <button type="button" onClick={installApp} className={className} aria-label="Download ZED Gift Shop app">
      <Download className="size-4" />
      <span>Download App</span>
    </button>
  );
}
