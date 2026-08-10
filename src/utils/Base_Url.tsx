export const BASE_URL =
  import.meta.env.VITE_ISPROD === "true"
    ? import.meta.env.VITE_API_PROD_URL
    : import.meta.env.VITE_API_LOCAL_URL;