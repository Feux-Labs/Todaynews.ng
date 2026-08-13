"use client";

import React, { useState, useEffect, useRef } from "react";
import Script from "next/script";
import { X } from "lucide-react";

export default function InterstitialAdModal() {
  const [show, setShow] = useState(false);
  const [lastShowTime, setLastShowTime] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const injectedRef = useRef(false);

  // Show interstitial ad 3 seconds after page load, and every 45 seconds of engagement
  useEffect(() => {
    const showTimer = setTimeout(() => {
      // Check if user hasn't seen ad in last 45 seconds
      if (Date.now() - lastShowTime > 45000) {
        setShow(true);
        setLastShowTime(Date.now());
      }
    }, 3000);

    // Re-trigger every 60 seconds if user is still on page
    const intervalTimer = setInterval(() => {
      if (Date.now() - lastShowTime > 45000) {
        setShow(true);
        setLastShowTime(Date.now());
      }
    }, 60000);

    return () => {
      clearTimeout(showTimer);
      clearInterval(intervalTimer);
    };
  }, [lastShowTime]);

  // Inject Adsterra interstitial script when modal is shown
  useEffect(() => {
    if (show && containerRef.current && !injectedRef.current) {
      injectedRef.current = true;
      containerRef.current.innerHTML = "";

      // Set config for Adsterra interstitial
      (window as any).atOptions = {
        key: "9ae93b69d11e842af1c5c33415214763",
        format: "fullpage",
        height: 600,
        width: 800,
        params: {},
      };

      // Config script
      const configScript = document.createElement("script");
      configScript.type = "text/javascript";
      configScript.text = `
        window.atOptions = {
          'key' : '9ae93b69d11e842af1c5c33415214763',
          'format' : 'fullpage',
          'height' : 600,
          'width' : 800,
          'params' : {}
        };
      `;
      containerRef.current.appendChild(configScript);

      // Invoke script
      const invokeScript = document.createElement("script");
      invokeScript.type = "text/javascript";
      invokeScript.src = "https://wailsilence.com/9ae93b69d11e842af1c5c33415214763/invoke.js";
      invokeScript.async = true;
      containerRef.current.appendChild(invokeScript);
    }
  }, [show]);

  if (!show) return null;

  const handleClose = () => {
    setShow(false);
    injectedRef.current = false;
  };

  return (
    <>
      {/* Full-screen overlay backdrop */}
      <div
        className="fixed inset-0 bg-black/80 z-[999] transition-opacity duration-300"
        onClick={handleClose}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Escape" && handleClose()}
      />

      {/* Centered Modal Container */}
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
          {/* Close Button - Top Right Corner */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-50 p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 group"
            aria-label="Close advertisement"
            title="Close (ESC)"
          >
            <X className="h-6 w-6 text-gray-700 group-hover:text-red-600 transition-colors" />
          </button>

          {/* Ad Container */}
          <div
            ref={containerRef}
            className="w-full flex items-center justify-center bg-gray-50 min-h-[600px]"
            id="interstitial-ad-container"
          >
            {/* Loading placeholder */}
            <div className="text-center text-gray-500">
              <div className="animate-pulse">Loading ad...</div>
            </div>
          </div>

          {/* Skip Ad Text (appears after 5 seconds) */}
          <div className="absolute bottom-4 right-4 text-xs text-gray-400">
            <button
              onClick={handleClose}
              className="text-blue-600 hover:underline font-semibold transition-colors"
            >
              Skip ✕
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
