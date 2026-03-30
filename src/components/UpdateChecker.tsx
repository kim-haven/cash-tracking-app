import React, { useEffect, useState } from "react";
import "../assets/ccss/updatechecker.css";

const CURRENT_VERSION = import.meta.env.VITE_APP_VERSION;

const UpdateChecker: React.FC = () => {
  const [hasUpdate, setHasUpdate] = useState(false);

  const checkVersion = async () => {
    try {
      const res = await fetch(`/version.json?t=${Date.now()}`);
      if (!res.ok) return;

      const text = await res.text();
      const start = text.trimStart();
      // Vite SPA fallback (and many 404s) return HTML starting with <!doctype
      if (start.startsWith("<") || start === "") {
        return;
      }

      const data = JSON.parse(text) as { version?: unknown };
      if (typeof data.version !== "string") return;

      if (data.version !== CURRENT_VERSION) {
        setHasUpdate(true);
      }
    } catch {
      /* Invalid JSON or network — skip quietly */
    }
  };

  useEffect(() => {
    checkVersion();
    const interval = setInterval(checkVersion, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* 🔥 UPDATE TOOLTIP */}
      {hasUpdate && (
        <div className="fixed right-4 top-1/2 -translate-y-1/2 bg-blue-600 text-white px-4 py-3 rounded-xl shadow-lg z-50 animate-slide-in-right">
          <p className="text-sm font-semibold">New version available 🚀</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 bg-white text-blue-600 px-3 py-1 rounded-lg text-sm hover:bg-gray-100 cursor-pointer"
          >
            Update Now
          </button>
        </div>
      )}

      {/* 🔥 DEV TEST BUTTON */}
      {import.meta.env.DEV && (
        <button
          onClick={() => setHasUpdate(true)}
          className="fixed bottom-4 left-4 bg-red-500 text-white px-4 py-2 rounded-lg z-50 shadow-lg hover:bg-red-600 hidden"
        >
          Trigger Update UI
        </button>
      )}
    </>
  );
};

export default UpdateChecker;