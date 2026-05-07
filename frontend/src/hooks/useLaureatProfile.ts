/**
 * Hook pour gérer le profil lauréat
 * Utilisé par ViewProfilLaureat et EditProfileLaureat
 */

import { useState, useEffect } from 'react';
import { ProfileService } from '@/services/profileService';
import { AuthService } from '@/services/authService';
import { apiGet } from '@/services/api.config';
import { LaureatProfile, LaureatViewProfile, HistoriqueEntry, CompetenceGroup } from '@/types/laureats-connected';
import { getAbsoluteMediaUrl } from '@/lib/utils';

interface LaureatProfileData {
  id: number;
  initials: string;
  fullName: string;
  role: string;
  status: string;
  promotion: string;
  field: string;
  country: string;
  memberSince: string;
  bio: string;
  quote: string;
  avatarUrl: string;
  
  stats: {
    activities: number;
    votes: number;
    connections: number;
    contributions: number;
  };
  
  experience: {
    title: string;
    company: string;
    location: string;
    professionalEmail: string;
    domain: string;
  };
  
  mentorship: {
    isAvailable: boolean;
    areas: string[];
    message: string;
  };
  
  personalInfo: {
    email: string;
    phone: string;
    nationality: string;
    nationalityWithFlag: string;
    whatsapp: string;
  };
  
  academicInfo: {
    promotion: string;
    field: string;
    linkedin: string;
  };
  
  interests: string[];
  searches: string[];
  isProfilePublic: boolean;
  
  // Historique et compétences (nouveau format relationnel)
  historique: HistoriqueEntry[];
  competences: CompetenceGroup[];
}

interface UseLaureatProfileReturn {
  profile: LaureatProfileData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateProfile: (data: Partial<LaureatProfile>) => Promise<boolean>;
  uploadPhoto: (file: File) => Promise<string | null>;
  toggleMentoring: (isAvailable: boolean) => Promise<boolean>;
}

export function useLaureatProfile(): UseLaureatProfileReturn {
  const [profile, setProfile] = useState<LaureatProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
  setIsLoading(true);
  setError(null);

  try {
    const currentUser = AuthService.getCurrentUser();
    
    // ✅ Si l'utilisateur n'est pas lauréat, ne pas appeler l'API
    if (!currentUser || currentUser.role !== 'laureat') {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    let apiProfile: LaureatViewProfile;

    try {
      apiProfile = await apiGet<LaureatViewProfile>('/laureats/me/profile/', true);
    } catch (apiError: any) {
      if (apiError?.status === 403 || apiError?.status === 404) {
        setProfile(null);
        setIsLoading(false);
        return;
      }

      throw apiError;
    }

    // Transformation des données reçues
    const transformedProfile: LaureatProfileData = {
      id: currentUser.id,
      initials: apiProfile.initials || `${currentUser.first_name?.[0] || ''}${currentUser.last_name?.[0] || ''}`.toUpperCase(),
      fullName: apiProfile.fullName || `${currentUser.last_name?.toUpperCase()} ${currentUser.first_name}`,
      role: apiProfile.role || 'Lauréat',
      status: apiProfile.status || 'Actif',
      promotion: apiProfile.promotion || currentUser.promotion || '',
      field: apiProfile.field || apiProfile.specialite_intitule || currentUser.specialite_intitule || currentUser.specialite || '',
      country: apiProfile.nationality || apiProfile.country_name || apiProfile.country || '',
      memberSince: apiProfile.memberSince || formatDate(currentUser.date_joined),
      bio: apiProfile.bio || '',
      quote: apiProfile.quote || apiProfile.bio || '',
      avatarUrl: getAbsoluteMediaUrl(currentUser.avatar_url),
      
      stats: {
        activities: apiProfile.stats?.activities || 0,
        votes: apiProfile.stats?.votes || 0,
        connections: apiProfile.stats?.connections || 0,
        contributions: apiProfile.stats?.contributions || 0,
      },
      
      experience: {
        title: apiProfile.job?.title || apiProfile.experience?.title || '',
        company: apiProfile.job?.company || apiProfile.experience?.company || '',
        location: apiProfile.job?.location || apiProfile.experience?.location || '',
        professionalEmail: apiProfile.job?.email || apiProfile.experience?.professionalEmail || '',
        domain: apiProfile.job?.domain || apiProfile.experience?.domain || '',
      },
      
      mentorship: {
        isAvailable: apiProfile.mentorship?.isAvailable ?? false,
        areas: apiProfile.mentorship?.areas || [],
        message: apiProfile.mentorship?.message || 'Je suis disponible pour aider les étudiants actuels',
      },
      
      personalInfo: {
        email: apiProfile.personalInfo?.email || currentUser.email || '',
        phone: apiProfile.personalInfo?.phone || apiProfile.phone || currentUser.phone || '',
        nationality: apiProfile.personalInfo?.nationality || apiProfile.nationality || apiProfile.country_name || '',
        nationalityWithFlag: apiProfile.personalInfo?.nationalityWithFlag || apiProfile.personalInfo?.nationality || apiProfile.nationality || apiProfile.country_name || '',
        whatsapp: apiProfile.personalInfo?.whatsapp || apiProfile.whatsapp || currentUser.whatsapp || '',
      },
      
      academicInfo: {
        promotion: apiProfile.academicInfo?.promotion || apiProfile.promotion || currentUser.promotion || '',
        field: apiProfile.academicInfo?.field || apiProfile.field || apiProfile.specialite_intitule || '',
        linkedin: apiProfile.academicInfo?.linkedin || apiProfile.linkedin || apiProfile.linkedin_url || '',
      },
      
      interests: apiProfile.interests || [],
      searches: apiProfile.searches || [],
      isProfilePublic: apiProfile.isProfilePublic ?? true,
      
      historique: apiProfile.historique || [],
      competences: apiProfile.competences || [],
    };

    // Si le backend ne renvoie pas historique/competences, les charger séparément
    if (!apiProfile.historique || apiProfile.historique.length === 0) {
      try {
        transformedProfile.historique = await ProfileService.getHistorique(currentUser.id) || [];
      } catch { transformedProfile.historique = []; }
    }
    if (!apiProfile.competences || apiProfile.competences.length === 0) {
      try {
        transformedProfile.competences = await ProfileService.getCompetences(currentUser.id) || [];
      } catch { transformedProfile.competences = []; }
    }

    setProfile(transformedProfile);
  } catch (err: any) {
    console.error('Erreur lors du chargement du profil lauréat:', err);
    setError(err.message || 'Erreur lors du chargement du profil');
  } finally {
    setIsLoading(false);
  }
};

  const updateProfile = async (data: Partial<LaureatProfile>): Promise<boolean> => {
    try {
      const currentUser = AuthService.getCurrentUser();
      if (!currentUser) {
        setError('Utilisateur non connecté');
        return false;
      }

      await ProfileService.updateLaureatProfile(currentUser.id, data);
      await fetchProfile();
      return true;
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour:', err);
      setError(err.message || 'Erreur lors de la mise à jour');
      return false;
    }
  };

  const uploadPhoto = async (file: File): Promise<string | null> => {
    try {
      const currentUser = AuthService.getCurrentUser();
      if (!currentUser) {
        setError('Utilisateur non connecté');
        return null;
      }

      const result = await ProfileService.uploadLaureatPhoto(currentUser.id, file);
      await fetchProfile();
      return result.photoUrl;
    } catch (err: any) {
      console.error('Erreur lors de l\'upload:', err);
      setError(err.message || 'Erreur lors de l\'upload');
      return null;
    }
  };

  const toggleMentoring = async (isAvailable: boolean): Promise<boolean> => {
    try {
      const currentUser = AuthService.getCurrentUser();
      if (!currentUser) {
        setError('Utilisateur non connecté');
        return false;
      }

      await ProfileService.updateMentoringAvailability(currentUser.id, isAvailable);
      
      if (profile) {
        setProfile({
          ...profile,
          mentorship: {
            ...profile.mentorship,
            isAvailable,
          },
        });
      }
      
      return true;
    } catch (err: any) {
      console.error('Erreur lors du toggle mentorat:', err);
      setError(err.message || 'Erreur lors de la mise à jour');
      return false;
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    profile,
    isLoading,
    error,
    refetch: fetchProfile,
    updateProfile,
    uploadPhoto,
    toggleMentoring,
  };
}

function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const months = ['Jan', 'Fév', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

export default useLaureatProfile;