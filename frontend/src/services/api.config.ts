/**
 * Configuration de l'API Backend Django
 * =====================================
 * Centralise la configuration pour tous les services frontend
 */

// URL de base de l'API Django
// En développement, utiliser le proxy Vite (même origine = pas de problème de cookies)
// En production, utiliser l'URL complète du backend
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Clés de stockage local (uniquement pour données non-sensibles)
export const STORAGE_KEYS = {
  LIKED_ACTIVITIES: 'ceeam_liked_activities',
} as const;

// Cache en mémoire pour les données utilisateur (pas localStorage pour la sécurité)
let cachedUser: any = null;
let isAuthenticated = false;

/**
 * Récupère l'utilisateur en cache mémoire
 */
export function getCachedUser(): any {
  return cachedUser;
}

/**
 * Met en cache l'utilisateur en mémoire
 */
export function setCachedUser(user: any): void {
  cachedUser = user;
  isAuthenticated = !!user;
}

/**
 * Efface le cache utilisateur (déconnexion)
 */
export function clearUserCache(): void {
  cachedUser = null;
  isAuthenticated = false;
}

/**
 * Vérifie si l'utilisateur est authentifié (basé sur le cache)
 */
export function isUserAuthenticated(): boolean {
  return isAuthenticated;
}

/**
 * En développement avec proxy Vite: les cookies HttpOnly ne marchent pas correctement
 * On stocke le token en mémoire et on l'envoie via Authorization header
 */
export function getAuthToken(): string | null {
  return null;
}

export function setAuthToken(token: string): void {
  void token;
}

/** @deprecated Utiliser clearUserCache() */
export function removeAuthToken(): void {
  clearUserCache();
}

/**
 * Headers par défaut pour les requêtes API
 */
function getCsrfToken(): string {
  const name = 'csrftoken';
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const trimmed = cookie.trim();
    if (trimmed.startsWith(name + '=')) {
      return decodeURIComponent(trimmed.substring(name.length + 1));
    }
  }
  return '';
}

export function getDefaultHeaders(includeAuth: boolean = false): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Inclure le CSRF token Django pour les requêtes authentifiées
  const csrfToken = getCsrfToken();
  if (csrfToken) {
    headers['X-CSRFToken'] = csrfToken;
  }

  return headers;
}

async function parseResponseBody<T>(response: Response): Promise<T | null> {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();

  if (!text.trim()) {
    return null;
  }

  if (contentType.includes('application/json')) {
    return JSON.parse(text) as T;
  }

  throw new ApiError(response.status, text);
}

/**
 * Effectue une requête GET vers l'API avec refresh automatique du token
 */
export async function apiGet<T>(endpoint: string, requireAuth: boolean = false): Promise<T> {
  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'GET',
    headers: getDefaultHeaders(requireAuth),
    credentials: 'include', // Pour envoyer/recevoir les cookies JWT
  });

  // Si 401 et auth requise, tenter un refresh du token
  if (response.status === 401 && requireAuth) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      // Rejouer la requête originale
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: getDefaultHeaders(requireAuth),
        credentials: 'include',
      });
    }
  }

  if (!response.ok) {
    const error = (await parseResponseBody<{ detail?: string }>(response).catch(() => null)) || { detail: 'Erreur réseau' };
    throw new ApiError(response.status, error.detail || 'Erreur lors de la requête');
  }

  return (await parseResponseBody<T>(response)) as T;
}

/**
 * Tente de rafraîchir l'access token via le refresh token
 */
async function refreshAccessToken(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Effectue une requête POST vers l'API avec refresh automatique du token
 */
export async function apiPost<T>(
  endpoint: string,
  data: unknown,
  requireAuth: boolean = false
): Promise<T> {
  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: getDefaultHeaders(requireAuth),
    credentials: 'include', // Pour envoyer/recevoir les cookies JWT
    body: JSON.stringify(data),
  });

  // Si 401 et auth requise, tenter un refresh du token (sauf pour le refresh lui-même)
  if (response.status === 401 && requireAuth && !endpoint.includes('/auth/refresh')) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: getDefaultHeaders(requireAuth),
        credentials: 'include',
        body: JSON.stringify(data),
      });
    }
  }

  if (!response.ok) {
    const error = (await parseResponseBody<Record<string, any>>(response).catch(() => null)) || { detail: 'Erreur réseau' };
    throw new ApiError(response.status, error.detail || 'Erreur lors de la requête', error);
  }

  return (await parseResponseBody<T>(response)) as T;
}

/**
 * Effectue une requete POST multipart/form-data vers l'API
 */
export async function apiPostFormData<T>(
  endpoint: string,
  formData: FormData,
  requireAuth: boolean = false
): Promise<T> {
  const headers: HeadersInit = {
    Accept: 'application/json',
  };

  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: formData,
  });

  if (response.status === 401 && requireAuth && !endpoint.includes('/auth/refresh')) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: formData,
      });
    }
  }

  if (!response.ok) {
    const error = (await parseResponseBody<Record<string, any>>(response).catch(() => null)) || { detail: 'Erreur reseau' };
    throw new ApiError(response.status, error.detail || 'Erreur lors de la requete', error);
  }

  return (await parseResponseBody<T>(response)) as T;
}

/**
 * Effectue une requête PUT vers l'API avec refresh automatique du token
 */
export async function apiPut<T>(
  endpoint: string,
  data: unknown,
  requireAuth: boolean = true
): Promise<T> {
  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'PUT',
    headers: getDefaultHeaders(requireAuth),
    credentials: 'include', // Pour envoyer/recevoir les cookies JWT
    body: JSON.stringify(data),
  });

  // Si 401 et auth requise, tenter un refresh du token
  if (response.status === 401 && requireAuth) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: getDefaultHeaders(requireAuth),
        credentials: 'include',
        body: JSON.stringify(data),
      });
    }
  }

  if (!response.ok) {
    const error = (await parseResponseBody<Record<string, any>>(response).catch(() => null)) || { detail: 'Erreur réseau' };
    const apiError = new ApiError(
      response.status, 
      error.detail || error.message || 'Erreur lors de la requête',
      error
    );
    // Attacher la réponse complète pour accéder aux erreurs de validation par champ
    (apiError as any).response = { data: error };
    throw apiError;
  }

  return (await parseResponseBody<T>(response)) as T;
}

/**
 * Effectue une requête PATCH vers l'API
 */
export async function apiPatch<T>(
  endpoint: string,
  data: unknown,
  requireAuth: boolean = true
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'PATCH',
    headers: getDefaultHeaders(requireAuth),
    credentials: 'include', // Pour envoyer/recevoir les cookies JWT
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = (await parseResponseBody<Record<string, any>>(response).catch(() => null)) || { detail: 'Erreur réseau' };
    throw new ApiError(response.status, error.detail || error.error || 'Erreur lors de la requête', error);
  }

  return (await parseResponseBody<T>(response)) as T;
}

/**
 * Effectue une requête DELETE vers l'API
 */
export async function apiDelete(endpoint: string, requireAuth: boolean = true): Promise<void> {
  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'DELETE',
    headers: getDefaultHeaders(requireAuth),
    credentials: 'include', // Pour envoyer/recevoir les cookies JWT
  });

  if (response.status === 401 && requireAuth) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: getDefaultHeaders(requireAuth),
        credentials: 'include',
      });
    }
  }

  if (!response.ok && response.status !== 204) {
    const error = (await parseResponseBody<{ detail?: string }>(response).catch(() => null)) || { detail: 'Erreur réseau' };
    throw new ApiError(response.status, error.detail || 'Erreur lors de la requête');
  }
}

/**
 * Classe d'erreur personnalisée pour les erreurs API
 */
export class ApiError extends Error {
  public status: number;
  public detail: string;
  public data: Record<string, any>;

  constructor(status: number, detail: string, data: Record<string, any> = {}) {
    super(detail);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
    this.data = data;
  }

  /**
   * Vérifie si l'erreur est une erreur d'authentification
   */
  isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
  }

  /**
   * Vérifie si l'erreur est une erreur de validation
   */
  isValidationError(): boolean {
    return this.status === 400;
  }

  /**
   * Vérifie si l'erreur est une erreur serveur
   */
  isServerError(): boolean {
    return this.status >= 500;
  }
}

/**
 * Interface pour les réponses paginées de DRF
 */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
