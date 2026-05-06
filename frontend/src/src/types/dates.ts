/**
 * Types pour les dates académiques - Compatible Django API
 */

/**
 * Type de semestre (match Django SEMESTER_CHOICES)
 */
export type Semester = 'A' | 'B';

/**
 * Date académique (modèle Django AcademicDate)
 */
export interface DateItem {
  id: number; // ID auto Django
  date_id: string; // ex: 'a1', 'b1'
  label: string;
  value: string;
  semester: Semester;
  academic_year: string; // ex: "2024-2025"
  updated_at?: string;
  updated_by?: number;
  
  // Alias pour compatibilité
  academicYear?: string; // Alias pour academic_year
}

/**
 * Données pour créer/modifier une date académique
 */
export interface DateItemCreateData {
  date_id: string;
  label: string;
  value: string;
  semester: Semester;
  academic_year: string;
}

/**
 * Réponse paginée des dates
 */
export interface DatesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: DateItem[];
  
  // Pour compatibilité
  dates?: DateItem[];
  academicYear?: string;
  lastUpdated?: string;
  updatedBy?: string;
}

/**
 * Auth admin (pour compatibilité avec l'ancien code)
 */
export interface AdminAuth {
  isAuthenticated: boolean;
  isAdmin: boolean;
  userEmail?: string;
}

/**
 * Dates par défaut pour l'année en cours (fonction utilitaire)
 */
export const getDefaultDates = (): DateItem[] => {
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;
  const academicYear = `${currentYear}-${nextYear}`;
  
  return [
    { 
      id: 1,
      date_id: 'a1', 
      label: 'Début des cours :', 
      value: '15 Septembre', 
      semester: 'A',
      academic_year: academicYear 
    },
    { 
      id: 2,
      date_id: 'a2', 
      label: 'Début des contrôles :', 
      value: '15 Novembre', 
      semester: 'A',
      academic_year: academicYear 
    },
    { 
      id: 3,
      date_id: 'a3', 
      label: 'Début des examens :', 
      value: '15 Décembre', 
      semester: 'A',
      academic_year: academicYear 
    },
    { 
      id: 4,
      date_id: 'a4', 
      label: 'Fin du semestre :', 
      value: '20 Janvier', 
      semester: 'A',
      academic_year: academicYear 
    },
    { 
      id: 5,
      date_id: 'b1', 
      label: 'Début des cours :', 
      value: '15 Février', 
      semester: 'B',
      academic_year: academicYear 
    },
    { 
      id: 6,
      date_id: 'b2', 
      label: 'Début des contrôles :', 
      value: '15 Avril', 
      semester: 'B',
      academic_year: academicYear 
    },
    { 
      id: 7,
      date_id: 'b3', 
      label: 'Début des examens :', 
      value: '15 Mai', 
      semester: 'B',
      academic_year: academicYear 
    },
    { 
      id: 8,
      date_id: 'b4', 
      label: 'Fin du semestre :', 
      value: '20 Juin', 
      semester: 'B',
      academic_year: academicYear 
    },
  ];
};