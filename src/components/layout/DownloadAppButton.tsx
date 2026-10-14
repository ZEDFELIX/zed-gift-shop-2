"use client";

import { useState, useEffect } from "react";
import { Download } from "lucide-react";

export function DownloadAppButton({ className = "" }: { className?: string }) {
  const [showPopup, setShowPopup] = useState(false);

  function handleClick() {
    setShowPopup(true);
  }

  function handleClose() {
    setShowPopup(false);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className}
      aria-label="Download ZED Gift Shop app"
    >
      <span>Download App</span>
    </button>
  );
}

export function DownloadAppPopup({ className = "" }: { className?: string }) {
  const [showNow, setShowNow] = useState(false);

  // Show popup after 30 seconds on page load, but only once per session
  useEffect(() => {
    // Check if already dismissed in localStorage
    const dismissed = localStorage.getItem("appPopupDismissed");
    if (dismissed === "true") {
      setShowNow(false);
      return;
    }

    // Show after 30 seconds
    const timer = setTimeout(() => {
      setShowNow(true);
    }, 30000);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // When user clicks "Install", mark as dismissed
  function handleClose() {
    setShowNow(false);
    localStorage.setItem("appPopupDismissed", "true");
  }

  if (!showNow) return null;

  return (
    <div
      className="fixed bottom-6 left-6 z-50 w-[calc(100vw-3rem)] max-w-sm bg-white/90 backdrop-blur-xl rounded-2xl p-6 shadow-2xl"
    >
      <div className="flex items-start gap-3">
        <div className="size-8 rounded-full bg-zed-950 text-white flex items-center justify-center shrink-0">
          <Download className="size-4" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-zed-950 mb-1">Install ZED Gift Shop</h3>
          <p className="text-charcoal/70 text-sm mb-3">
            Install the app to your home screen for quick access and push notifications.
          </p>
          <button
            onClick={handleClose}
            className="mt-2 rounded-zed bg-zed-950 px-4 py-2 text-sm font-bold text-white hover:bg-zed-900 transition-colors w-full"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
}