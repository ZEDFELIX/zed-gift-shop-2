"use client";

import { useState } from "react";

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
  if (showPopup === undefined) return null;

  if (showPopup) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xl bg-black/60"
      >
        <div
          className="bg-white rounded-xl p-8 max-w-sm w-full shadow-2xl transform scale-95"
        >
          <h3 className="text-xl font-bold text-zed-950 mb-4">Install ZED Gift Shop</h3>
          <p className="text-charcoal/70 mb-6">
            Install the app to your home screen for quick access and push notifications.
          </p>
          <ul className="space-y-3 text-sm text-charcoal/60">
            <li>
              • iOS: Tap "Share" → "Add to Home Screen"
            </li>
            <li>
              • Android: Tap menu → "Install app" → "Install"
            </li>
          </ul>
          <button
            onClick={handleClose}
            className="mt-6 w-full rounded-zed bg-zed-950 px-4 py-2 text-sm font-bold text-white hover:bg-zed-900 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    );
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
