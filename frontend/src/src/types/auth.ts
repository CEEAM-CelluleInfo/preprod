/**
 * Types pour l'authentification - Compatible Django API
 */

/**
 * Données de connexion
 */
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Utilisateur connecté (depuis Django User model)
 */
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  whatsapp?: string;
  country?: number;
  country_name?: string;
  country_flag?: string;
  promotion?: string;
  specialite?: string;
  role: 'student' | 'bureau' | 'admin' | 'laureat';
  avatar_url?: string;
  biographie?: string;
  preferred_language: 'fr' | 'en';
  is_active: boolean;
  is_staff: boolean;
  date_joined: string;
  full_name?: string;
  
  // Alias pour compatibilité
  firstName?: string; // Alias pour first_name
  lastName?: string; // Alias pour last_name
  avatarUrl?: string; // Alias pour avatar_url
  joinedAt?: string; // Alias pour date_joined
}

/**
 * Réponse d'authentification du backend Django
 */
export interface AuthResponse {
  registration_status: string;
  success?: boolean;
  message?: string;
  error?: string;
  errors?: Record<string, string>;
  token?: string;
  refreshToken?: string;
  expiresIn?: number;
  user?: User;
  email_verified?: boolean;
  detail?: string;
}

/**
 * Erreurs de validation login
 */
export interface LoginValidationErrors {
  email?: string;
  password?: string;
  non_field_errors?: string;
}

/**
 * Données d'inscription
 */
export interface RegisterFormData {
  username?: string;
  email: string;
  password: string;
  confirmPassword?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  telephone?: string;
  country?: number;
  countryId?: number;
  promotion?: string;
  specialiteId?: number;
  acceptTerms?: boolean;
  
  // Alias pour compatibilité
  firstName?: string;
  lastName?: string;
}

/**
 * Réponse d'inscription
 */
export interface RegisterResponse {
  success: boolean;
  message: string;
  user?: User;
}

/**
 * Réponse de vérification admin
 */
export interface AdminVerifyResponse {
  is_admin: boolean;
  is_authenticated: boolean;
  user?: User;
}