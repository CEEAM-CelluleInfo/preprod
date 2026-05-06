import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { API_BASE_URL } from "@/services/api.config";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Convertit une URL relative de média en URL absolue si nécessaire.
 * Utile pour les photos de profil et autres médias stockés sur le backend.
 */
export function getAbsoluteMediaUrl(url: string | undefined | null): string {
  if (!url) return '';
  // Si c'est déjà une URL absolue, la retourner telle quelle
  if (url.startsWith('http')) return url;
  // Sinon, construire l'URL absolue en utilisant le backend
  const backendBaseUrl = API_BASE_URL.replace('/api', '');
  return `${backendBaseUrl}${url}`;
}
