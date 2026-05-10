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


/**
 * Convertit une URL de ressource en URL d'embed si possible.
 * Retourne { embedUrl, canPreview }.
 */
export function getEmbedUrlForResource(rawUrl: string | null | undefined): { embedUrl: string | null; canPreview: boolean } {
  if (!rawUrl) return { embedUrl: null, canPreview: false };
  const url = rawUrl.trim();

  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '').toLowerCase();

    // Google Drive file links
    // e.g. https://drive.google.com/file/d/FILE_ID/view -> /preview
    const driveFileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)\//);
    if (host === 'drive.google.com' && driveFileMatch) {
      const id = driveFileMatch[1];
      return { embedUrl: `https://drive.google.com/file/d/${id}/preview`, canPreview: true };
    }

    // drive open?id=ID
    if (host === 'drive.google.com' && u.searchParams.get('id')) {
      const id = u.searchParams.get('id');
      return { embedUrl: `https://drive.google.com/file/d/${id}/preview`, canPreview: true };
    }

    // Google Docs / Sheets / Slides preview: replace /edit or /view with /preview
    if (host.endsWith('google.com')) {
      if (/docs\.google\.com\/document\/d\//.test(url) || /spreadsheets\.google\.com\/spreadsheets\/d\//.test(url) || /presentation\.google\.com\/presentation\/d\//.test(url)) {
        const preview = url.replace(/\/(edit|view)(|#.*|\?.*)$/, '/preview');
        return { embedUrl: preview, canPreview: true };
      }
    }

    // Drive folder - no embeddable preview (show link only)
    if (host === 'drive.google.com' && /drive\/folders\//.test(url)) {
      return { embedUrl: null, canPreview: false };
    }

    // Dropbox: convert dl=0 to raw=1 (direct file) or ?raw=1
    if (host.endsWith('dropbox.com')) {
      // examples: https://www.dropbox.com/s/<id>/file.pdf?dl=0
      const newUrl = url.replace(/\?dl=0$/, '?raw=1').replace(/\?dl=1$/, '?raw=1');
      return { embedUrl: newUrl, canPreview: true };
    }

    // Googleusercontent direct links, allow preview
    if (host.endsWith('googleusercontent.com')) {
      return { embedUrl: url, canPreview: true };
    }

    // Other hosts: do not attempt to embed by default
    return { embedUrl: null, canPreview: false };
  } catch (e) {
    return { embedUrl: null, canPreview: false };
  }
}
