"use client";

import { useEffect, useState } from "react";

/**
 * Resolves which optional assets exist on the server (HEAD requests, no body
 * transfer). Lets the showroom pick the production GLB + LODs when present and
 * fall back gracefully otherwise – without throwing inside Suspense.
 */
export function useAssetAvailability(urls: string[]) {
  const key = urls.join("|");
  const [result, setResult] = useState<Record<string, boolean> | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      key.split("|").map(async (url) => {
        try {
          const res = await fetch(url, { method: "HEAD", cache: "no-store" });
          const type = res.headers.get("content-type") ?? "";
          return [url, res.ok && !type.includes("text/html")] as const;
        } catch {
          return [url, false] as const;
        }
      }),
    ).then((entries) => {
      if (!cancelled) setResult(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return result;
}
