/**
 * Service de gestion des profils utilisateurs - Connexion au backend Django
 * ==========================================================================
 */

import { apiGet, apiPut, apiPost, apiDelete, apiPostFormData, API_BASE_URL } from './api.config';
import { 
  UserProfile, 
  LaureatProfile, 
  LaureatViewProfile, 
  ProfileApiResponse,
  HistoriqueEntry,
  HistoriqueEntryType,
  CompetenceGroup,
  UserCompetence,
  CompetenceCategory,
  CompetenceLevel,
} from '@/types/laureats-connected';

async function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Impossible de lire l\'image sélectionnée.'));
    };

    image.src = objectUrl;
  });
}

async function normalizeProfilePhoto(file: File): Promise<File> {
  const fileName = file.name.toLowerCase();
  const needsConversion = file.type === 'image/png'
    || file.type === 'image/x-png'
    || fileName.endsWith('.png')
    || file.size > 1024 * 1024;

  if (!needsConversion) {
    return file;
  }

  const image = await loadImageElement(file);
  const maxDimension = 1200;
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    return file;
  }

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((result) => resolve(result), 'image/jpeg', 0.82);
  });

  if (!blob) {
    return file;
  }

  const normalizedName = file.name.replace(/\.[^.]+$/, '') || 'profile-photo';
  return new File([blob], `${normalizedName}.jpg`, { type: 'image/jpeg' });
}

/**
 * Service pour gérer les profils utilisateurs
 */
export class ProfileService {
  
  /**
   * Récupère le profil de l'utilisateur connecté (tous les rôles)
   * GET /api/profile/
   */
  static async getMyProfile(): Promise<ProfileApiResponse> {
    return apiGet<ProfileApiResponse>('/profile/', true);
  }

  /**
   * Met à jour le profil de l'utilisateur connecté (student/bureau)
   * PUT /api/profile/
   */
  static async updateMyProfile(data: Partial<UserProfile>): Promise<ProfileApiResponse> {
    return apiPut<ProfileApiResponse>('/profile/', data, true);
  }

  /**
   * Récupère le profil d'un lauréat par son ID
   * GET /api/laureats/{userId}/profile/
   */
  static async getLaureatProfile(userId: number): Promise<LaureatViewProfile> {
    return apiGet<LaureatViewProfile>(`/laureats/${userId}/profile/`, true);
  }

  /**
   * Met à jour le profil d'un lauréat
   * PUT /api/laureats/{userId}/profile/
   */
  static async updateLaureatProfile(userId: number, data: Partial<LaureatProfile>): Promise<LaureatProfile> {
    return apiPut<LaureatProfile>(`/laureats/${userId}/profile/`, data, true);
  }

  /**
   * Upload la photo de profil (utilisateur)
   * POST /api/profile/photo/
   */
  static async uploadProfilePhoto(file: File): Promise<{ photoUrl: string }> {
    const normalizedFile = await normalizeProfilePhoto(file);
    const formData = new FormData();
    formData.append('photo', normalizedFile);

    return apiPostFormData<{ photoUrl: string }>('/profile/photo/', formData, true);
  }

  /**
   * Upload la photo de profil (lauréat)
   * POST /api/laureats/{userId}/profile/image/
   */
  static async uploadLaureatPhoto(userId: number, file: File): Promise<{ photoUrl: string }> {
    const normalizedFile = await normalizeProfilePhoto(file);
    const formData = new FormData();
    formData.append('photo', normalizedFile);

    return apiPostFormData<{ photoUrl: string }>(`/laureats/${userId}/profile/image/`, formData, true);
  }

  /**
   * Supprime la photo de profil
   * DELETE /api/profile/photo/
   */
  static async deleteProfilePhoto(): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE_URL}/profile/photo/`, {
      method: 'DELETE',
      credentials: 'include', // Envoie les cookies JWT automatiquement
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Utilisateur non connecté');
      }
      throw new Error('Erreur lors de la suppression');
    }

    return response.json();
  }

  /**
   * Met à jour la disponibilité au mentorat (lauréat uniquement)
   * PATCH /api/laureats/{userId}/mentoring/
   */
  static async updateMentoringAvailability(userId: number, isAvailable: boolean): Promise<{ isMentorAvailable: boolean }> {
    const response = await fetch(`${API_BASE_URL}/laureats/${userId}/mentoring/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Envoie les cookies JWT automatiquement
      body: JSON.stringify({ isMentorAvailable: isAvailable }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Utilisateur non connecté');
      }
      const error = await response.json().catch(() => ({ detail: 'Erreur' }));
      throw new Error(error.detail || 'Erreur lors de la mise à jour');
    }

    return response.json();
  }

  // =====================================================
  // HISTORIQUE ACADÉMIQUE ET PROFESSIONNEL
  // =====================================================

  /**
   * Récupère l'historique d'un lauréat
   * GET /api/laureats/{userId}/historique/
   */
  static async getHistorique(userId: number): Promise<HistoriqueEntry[]> {
    return apiGet<HistoriqueEntry[]>(`/laureats/${userId}/historique/`, true);
  }

  /**
   * Crée une nouvelle entrée d'historique
   * POST /api/laureats/{userId}/historique/
   */
  static async createHistoriqueEntry(userId: number, data: {
    entry_type: HistoriqueEntryType;
    title: string;
    organization?: string;
    location?: string;
    start_date: string;
    end_date?: string | null;
    is_current: boolean;
    description?: string;
  }): Promise<HistoriqueEntry> {
    return apiPost<HistoriqueEntry>(`/laureats/${userId}/historique/`, data, true);
  }

  /**
   * Met à jour une entrée d'historique
   * PUT /api/laureats/{userId}/historique/{entryId}/
   */
  static async updateHistoriqueEntry(userId: number, entryId: number, data: Partial<{
    entry_type: HistoriqueEntryType;
    title: string;
    organization: string;
    location: string;
    start_date: string;
    end_date: string | null;
    is_current: boolean;
    description: string;
  }>): Promise<HistoriqueEntry> {
    return apiPut<HistoriqueEntry>(`/laureats/${userId}/historique/${entryId}/`, data, true);
  }

  /**
   * Supprime une entrée d'historique
   * DELETE /api/laureats/{userId}/historique/{entryId}/
   */
  static async deleteHistoriqueEntry(userId: number, entryId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/laureats/${userId}/historique/${entryId}/`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Utilisateur non connecté');
      }
      throw new Error('Erreur lors de la suppression');
    }
  }

  // =====================================================
  // COMPÉTENCES
  // =====================================================

  /**
   * Récupère les catégories de compétences prédéfinies
   * GET /api/competence-categories/
   */
  static async getCompetenceCategories(): Promise<CompetenceCategory[]> {
    return apiGet<CompetenceCategory[]>('/competence-categories/', true);
  }

  /**
   * Récupère les compétences d'un lauréat groupées par catégorie
   * GET /api/laureats/{userId}/competences/
   */
  static async getCompetences(userId: number): Promise<CompetenceGroup[]> {
    return apiGet<CompetenceGroup[]>(`/laureats/${userId}/competences/`, true);
  }

  /**
   * Crée une nouvelle compétence pour un lauréat
   * POST /api/laureats/{userId}/competences/
   */
  static async createCompetence(userId: number, data: {
    category?: number;
    categoryName?: string;
    name: string;
    level?: CompetenceLevel;
  }): Promise<UserCompetence> {
    return apiPost<UserCompetence>(`/laureats/${userId}/competences/`, data, true);
  }

  /**
   * Met à jour une compétence
   * PUT /api/laureats/{userId}/competences/{compId}/
   */
  static async updateCompetence(userId: number, compId: number, data: Partial<{
    name: string;
    level: CompetenceLevel;
  }>): Promise<UserCompetence> {
    return apiPut<UserCompetence>(`/laureats/${userId}/competences/${compId}/`, data, true);
  }

  /**
   * Supprime une compétence
   * DELETE /api/laureats/{userId}/competences/{compId}/
   */
  static async deleteCompetence(userId: number, compId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/laureats/${userId}/competences/${compId}/`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Utilisateur non connecté');
      }
      throw new Error('Erreur lors de la suppression');
    }
  }

  /**
   * Supprime toutes les compétences d'une catégorie pour un lauréat
   * DELETE /api/laureats/{userId}/competences/category/{categoryId}/
   */
  static async deleteCompetenceCategory(userId: number, categoryId: number): Promise<{ deleted: number; message: string }> {
    const response = await fetch(`${API_BASE_URL}/laureats/${userId}/competences/category/${categoryId}/`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Utilisateur non connecté');
      }
      throw new Error('Erreur lors de la suppression');
    }

    return response.json();
  }

  // === MÉTHODE GETMYSTATS COMMENTÉE ===
  // /**
  //  * Récupère les statistiques de l'utilisateur connecté
  //  * GET /api/users/me/stats/
  //  */
  // static async getMyStats(): Promise<{
  //   activities: number;
  //   votes: number;
  //   connections: number;
  //   contributions: number;
  // }> {
  //   return apiGet<{
  //     activities: number;
  //     votes: number;
  //     connections: number;
  //     contributions: number;
  //   }>('/users/me/stats/', true);
  // }
  // === FIN MÉTHODE GETMYSTATS COMMENTÉE ===
}

export default ProfileService;
