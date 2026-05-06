import { useState, useEffect } from 'react';
import { ProfileService } from '@/services/profileService';
import { AuthService } from '@/services/authService';
import { ProfileApiResponse, HistoriqueEntry, CompetenceGroup } from '@/types/laureats-connected';
import { getAbsoluteMediaUrl } from '@/lib/utils';

interface UserProfileData {
  id: number;
  name: string;
  initials: string;
  status: string;
  promotion: string;
  filiere: string;
  country: string;
  countryFlag: string;
  memberSince: string;
  email: string;
  phone: string;
  whatsapp: string;       // ✅ remplace language
  nationality: string;
  linkedin: string;
  biography: string;
  avatarUrl: string;
  interests: string[];
  lookingFor: string[];
  stats: {
    activities: number;
    votes: number;
    connections: number;
    contributions: number;
  };
  academicInfo: {
    promotion: string;
    filiere: string;
    linkedin: string;
  };
  historique: HistoriqueEntry[];    // ✅ ajouté
  competences: CompetenceGroup[];   // ✅ ajouté
}

interface UseUserProfileReturn {
  profile: UserProfileData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateProfile: (data: Partial<UserProfileData>) => Promise<boolean>;
  uploadPhoto: (file: File) => Promise<string | null>;
}

export function useUserProfile(): UseUserProfileReturn {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const currentUser = AuthService.getCurrentUser();
      if (!currentUser) {
        setError('Utilisateur non connecté');
        setIsLoading(false);
        return;
      }

      const currentUser2 = AuthService.getCurrentUser();
      const apiProfile = await ProfileService.getMyProfile();

      // Chargement de l'historique et des compétences
      let historique: any[] = [];
      let competences: any[] = [];
      if (currentUser2?.id) {
        try {
          historique = await ProfileService.getHistorique(currentUser2.id);
        } catch { historique = []; }
        try {
          competences = await ProfileService.getCompetences(currentUser2.id);
        } catch { competences = []; }
      }

      const transformedProfile: UserProfileData = {
        id: apiProfile.id,
        name: `${apiProfile.lastName?.toUpperCase() || ''} ${apiProfile.firstName || ''}`.trim(),
        initials: `${apiProfile.firstName?.[0] || ''}${apiProfile.lastName?.[0] || ''}`.toUpperCase(),
        status: 'Actif',
        promotion: apiProfile.promotion || '',
        filiere: apiProfile.field || apiProfile.specialite_intitule || apiProfile.specialite || '',
        country: apiProfile.country_name || apiProfile.country || '',
        countryFlag: apiProfile.country_flag || '',
        memberSince: formatDate(apiProfile.date_joined),
        email: apiProfile.email || '',
        phone: apiProfile.phone || '',
        whatsapp: apiProfile.whatsapp || currentUser.whatsapp || '',
        nationality: apiProfile.nationality || apiProfile.country_name || '',
        linkedin: apiProfile.linkedin || apiProfile.linkedin_url || '',
        biography: apiProfile.biography || apiProfile.biographie || '',
        avatarUrl: getAbsoluteMediaUrl(apiProfile.photoUrl || apiProfile.avatar_url),
        interests: apiProfile.interests || [],
        lookingFor: apiProfile.lookingFor || apiProfile.looking_for || [],
        stats: {
          activities: 0,
          votes: 0,
          connections: 0,
          contributions: 0,
        },
        academicInfo: {
          promotion: apiProfile.promotion || '',
          filiere: apiProfile.field || apiProfile.specialite_intitule || '',
          linkedin: apiProfile.linkedin || apiProfile.linkedin_url || '',
        },
        historique,
        competences,
      };

      setProfile(transformedProfile);
    } catch (err: any) {
      console.error('Erreur lors du chargement du profil:', err);
      setError(err.message || 'Erreur lors du chargement du profil');
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: Partial<UserProfileData>): Promise<boolean> => {
    try {
      const apiData: any = {};
      if (data.name) {
        const parts = data.name.split(' ');
        apiData.lastName = parts[0];
        apiData.firstName = parts.slice(1).join(' ');
      }
      if (data.phone)     apiData.phone = data.phone;
      if (data.whatsapp)  apiData.whatsapp = data.whatsapp;
      if (data.biography) apiData.biography = data.biography;
      if (data.linkedin)  apiData.linkedin = data.linkedin;
      if (data.interests) apiData.interests = data.interests;
      if (data.lookingFor) apiData.lookingFor = data.lookingFor;

      await ProfileService.updateMyProfile(apiData);
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
      const result = await ProfileService.uploadProfilePhoto(file);
      await fetchProfile();
      return result.photoUrl;
    } catch (err: any) {
      console.error("Erreur lors de l'upload:", err);
      setError(err.message || "Erreur lors de l'upload");
      return null;
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return { profile, isLoading, error, refetch: fetchProfile, updateProfile, uploadPhoto };
}

function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const months = ['Jan', 'Fév', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

export default useUserProfile;