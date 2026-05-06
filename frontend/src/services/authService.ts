/**
 * Service d'authentification - Connexion au backend Django
 * =========================================================
 * Utilise uniquement les cookies HttpOnly pour les tokens JWT (sécurisé)
 * Les données utilisateur sont récupérées via l'API /auth/me/
 */

import { 
  API_BASE_URL, 
  apiPost,
  apiGet,
  getCachedUser,
  setCachedUser,
  clearUserCache,
  isUserAuthenticated,
} from './api.config';
import { User, AuthResponse, LoginFormData, RegisterFormData, AdminVerifyResponse } from '@/types/auth';

/**
 * Service d'authentification
 */
export class AuthService {
  /**
   * Connexion d'un utilisateur
   * Les tokens JWT sont stockés en mémoire et envoyés via Authorization header
   */
  static async login(credentials: LoginFormData): Promise<AuthResponse> {
    const response = await apiPost<AuthResponse>('/auth/login/', {
      email: credentials.email,
      password: credentials.password,
      rememberMe: !!credentials.rememberMe,
    });
    
    // Stocker l'utilisateur en cache mémoire
    if (response.user) {
      setCachedUser(response.user);
    }
    
    return response;
  }

  /**
   * Inscription d'un nouvel utilisateur
   * Note: Ne pas stocker les données utilisateur car l'email doit être vérifié avant connexion
   */
  static async register(data: RegisterFormData): Promise<AuthResponse> {
    // Ne jamais envoyer de champ `role` depuis le frontend lors de l'inscription.
    // Le backend définit par défaut le rôle étudiant et l'admin peut le modifier ensuite.
    const response = await apiPost<AuthResponse>('/auth/register/', {
      email: data.email,
      password: data.password,
      password_confirm: data.password,
      // username est généré automatiquement par le backend si non fourni
      first_name: data.first_name || data.firstName,
      last_name: data.last_name || data.lastName,
      phone: data.phone || data.telephone || '',
      country: data.country || data.countryId,
      promotion: data.promotion || '',
      specialite: data.specialiteId,
    });
    
    // Ne pas stocker les données utilisateur après inscription
    // L'utilisateur doit d'abord vérifier son email avant de pouvoir se connecter
    
    return response;
  }

  /**
   * Déconnexion - Appelle l'API pour invalider les tokens et efface le cache
   */
  static async logout(): Promise<void> {
    clearUserCache();

    try {
      await apiPost('/auth/logout/', {});
    } catch (error) {
      console.warn('Erreur lors de la déconnexion:', error);
    }
  }

  /**
   * Vérifie si l'utilisateur est connecté via l'API
   */
  static async checkAuth(): Promise<boolean> {
    try {
      const user = await this.fetchCurrentUser();
      return !!user;
    } catch {
      return false;
    }
  }

  /**
   * Récupère l'utilisateur connecté depuis le cache mémoire
   */
  static getCurrentUser(): User | null {
    return getCachedUser();
  }

  /**
   * Récupère l'utilisateur connecté depuis l'API (et met en cache)
   */
  static async fetchCurrentUser(): Promise<User | null> {
    try {
      const response = await apiGet<{ user: User }>('/auth/me/', true);
      if (response.user) {
        setCachedUser(response.user);
        return response.user;
      }
      return null;
    } catch (error) {
      clearUserCache();
      return null;
    }
  }

  /**
   * Vérifie si l'utilisateur est admin via l'API
   */
  static async verifyAdmin(): Promise<AdminVerifyResponse> {
    try {
      const response = await apiGet<AdminVerifyResponse>('/auth/me/', true);
      return response;
    } catch {
      return { is_admin: false, is_authenticated: false };
    }
  }

  /**
   * Récupère le token actuel.
   * Les tokens sont gérés exclusivement via cookies HttpOnly.
   */
  static getToken(): string | null {
    return null;
  }

  /**
   * Met à jour les données utilisateur dans le cache mémoire
   */
  static updateStoredUser(user: Partial<User>): void {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...user };
      setCachedUser(updatedUser);
      // Émettre un événement pour mettre à jour l'UI
      window.dispatchEvent(new CustomEvent('profile-updated'));
    }
  }

  /**
   * Rafraîchit les données utilisateur depuis le serveur
   */
  static async refreshUserData(): Promise<User | null> {
    return this.fetchCurrentUser();
  }

  /**
   * Prévisualise les informations du compte avant activation
   * SÉCURITÉ: Permet de voir qui a créé le compte avant d'activer
   */
  static async previewEmailVerification(token: string): Promise<{
    already_verified: boolean;
    message: string;
    expired?: boolean;   // ✅ présent quand error est true
    error?: string; 
    account_info?: {
      first_name: string;
      last_name: string;
      email: string;
      created_at?: string;
    };
  }> {
    const response = await fetch(`${API_BASE_URL}/auth/verify-email/?token=${encodeURIComponent(token)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw errorData;
    }
    
    return response.json();
  }

  /**
   * Vérifie l'email avec un token (activation du compte)
   */
  static async verifyEmail(token: string): Promise<{ message: string; expired?: boolean; user?: any }> {
    return apiPost<{ message: string; expired?: boolean; user?: any }>('/auth/verify-email/', { token });
  }

  /**
   * Renvoyer l'email de vérification
   */
  static async resendVerificationEmail(email: string) {
    const response = await fetch(`${API_BASE_URL}/auth/resend-verification/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        frontend_url: window.location.origin,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  }

  /**
   * Demande de réinitialisation de mot de passe (mot de passe oublié)
   */
  static async forgotPassword(email: string): Promise<{ message: string }> {
    return apiPost<{ message: string }>('/auth/forgot-password/', { email });
  }

  /**
   * Réinitialisation du mot de passe avec token
   */
  static async resetPassword(token: string, newPassword: string, confirmPassword: string): Promise<{ message: string }> {
    return apiPost<{ message: string }>('/auth/reset-password/', {
      token,
      new_password: newPassword,
      password_confirm: confirmPassword,
    });
  }
}
