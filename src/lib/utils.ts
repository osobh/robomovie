import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get the backend API URL from environment variables
 * @returns The base URL for backend API requests
 */
export function getBackendUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
  return apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl;
}
