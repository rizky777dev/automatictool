"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[app/global-error.tsx]", error);
  }, [error]);

  return (
    <html lang="id">
      <body
        style={{
          background: "#0a0c0f",
          color: "#e7e9ea",
          fontFamily: "ui-monospace, monospace",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
        }}
      >
        <div style={{ maxWidth: "32rem", width: "100%" }}>
          <h1 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            Aplikasi gagal dimuat
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#8b9296", marginBottom: "1rem" }}>
            Pesan error asli (screenshot ini kalau perlu ditelusuri lebih lanjut):
          </p>
          <pre
            style={{
              background: "rgba(0,0,0,0.4)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "0.75rem",
              padding: "0.75rem",
              fontSize: "0.75rem",
              color: "#fca5a5",
              overflow: "auto",
              maxHeight: "12rem",
              marginBottom: "1rem",
              whiteSpace: "pre-wrap",
            }}
          >
            {error.message || "Tidak ada pesan error spesifik."}
            {error.digest ? `\n\ndigest: ${error.digest}` : ""}
          </pre>
          <button
            onClick={() => reset()}
            style={{
              background: "#22c08c",
              color: "#0a0c0f",
              border: "none",
              borderRadius: "0.75rem",
              padding: "0.625rem 1.25rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Coba lagi
          </button>
        </div>
      </body>
    </html>
  );
}
