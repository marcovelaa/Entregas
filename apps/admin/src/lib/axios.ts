import axios from "axios";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Builds a public asset URL from the configured API origin. API endpoints live
 * below `/api`, while uploaded catalogue assets are served from the origin.
 */
export function getApiAssetUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;

  const assetOrigin = apiBaseUrl.replace(/\/api\/?$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${assetOrigin}${normalizedPath}`;
}
