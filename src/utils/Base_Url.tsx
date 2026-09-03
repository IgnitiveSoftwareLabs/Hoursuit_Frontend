export const BASE_URL =
  import.meta.env.VITE_ISPROD === "true" ||
  (typeof window !== "undefined" && !["localhost", "127.0.0.1"].includes(window.location.hostname))
    ? (import.meta.env.VITE_API_PROD_URL || "https://sb-api-hoursuite.ignitivelabs.in")
    : (import.meta.env.VITE_API_LOCAL_URL || "http://localhost:8004");