import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast, Toaster } from "sonner";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import HeaderConnected from "@/components/layout/HeaderConnected";
import Footer from "@/components/layout/Footer";
import EditProfilHeader from "@/components/EditProfil/EditProfilHeader";
import ProfilePhotoUpload from "@/components/EditProfil/ProfilePhotoUpload";
import PersonalInfoForm from "@/components/EditProfil/PersonalInfoForm";
import BiographyForm from "@/components/EditProfil/BiographyForm";
import AcademicInfoForm from "@/components/EditProfil/AcademicInfoForm";
import LinkedInInput from "@/components/EditProfil/LinkedlnInput";
import InterestsSection from "@/components/EditProfil/InterestsSection";
// === IMPORT COMMENTÉ ===
// import LookingForSection from "@/components/EditProfil/LookingForSection";
import FormActions from "@/components/EditProfil/FormActions";
import { initialFormData } from "@/data/profileFormData";
import { ProfileService } from "@/services/profileService";
import { AuthService } from "@/services/authService";

interface FormData {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    nationality: string;
    language: string;
  };
  biography: string;
  academicInfo: {
    promotion: string;
    field: string;
    // campus: string;  // ← SUPPRIMÉ
  };
  linkedin: string;
  interests: string[];
  lookingFor: string[];
}

// Fonction pour afficher un toast personnalisé avec bords arrondis
const showCustomToast = (type: 'success' | 'error' | 'info', title: string, description?: string) => {
  const icons = {
    success: <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#15803d' }} />,
    error: <XCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#dc2626' }} />,
    info: <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#d97706' }} />
  };
  
  const colors = {
    success: { title: '#166534', desc: '#15803d' },
    error: { title: '#991b1b', desc: '#b91c1c' },
    info: { title: '#92400e', desc: '#b45309' }
  };
  
  toast.custom((t) => (
    <div className="flex items-start gap-3 p-4 rounded-2xl shadow-lg" style={{ background: '#fef3c7', border: '2px solid #f59f24', borderRadius: '20px' }}>
      {icons[type]}
      <div className="flex-1">
        <p className="font-semibold text-sm" style={{ color: colors[type].title }}>{title}</p>
        {description && <p className="text-xs mt-0.5" style={{ color: colors[type].desc }}>{description}</p>}
      </div>
      <button onClick={() => toast.dismiss(t)} className="text-gray-400 hover:text-gray-600 transition-colors">
        ✕
      </button>
    </div>
  ), { duration: 4000 });
};

const EditProfilePage = () => {
  const navigate = useNavigate();
  
  // États pour chaque section
  const [formData, setFormData] = useState<FormData>({
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      nationality: '',
      language: '🇫🇷 Français',
    },
    biography: '',
    academicInfo: {
      promotion: '',
      field: '',
    },
    linkedin: '',
    interests: [],
    lookingFor: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger le profil depuis l'API
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const currentUser = AuthService.getCurrentUser();
        if (!currentUser) {
          setError('Utilisateur non connecté');
          setIsLoading(false);
          return;
        }

        const profile = await ProfileService.getMyProfile();
        
        // Mapper les données API vers le format du formulaire (sans campus)
        setFormData({
          personalInfo: {
            firstName: profile.firstName || currentUser.first_name || '',
            lastName: profile.lastName || currentUser.last_name || '',
            email: profile.email || currentUser.email || '',
            phone: profile.phone || '',
            nationality: profile.nationality || profile.country_name || '',
            language: profile.preferred_language || profile.language || '🇫🇷 Français',
          },
          biography: profile.biography || profile.biographie || '',
          academicInfo: {
            promotion: profile.promotion || currentUser.promotion || '',
            field: profile.field || profile.specialite_intitule || currentUser.specialite?.toString() || '',
          },
          linkedin: profile.linkedin || profile.linkedin_url || '',
          interests: profile.interests || [],
          lookingFor: profile.lookingFor || profile.looking_for || [],
        });
      } catch (err) {
        console.error('Erreur chargement profil:', err);
        setError('Impossible de charger le profil');
        showCustomToast('error', 'Erreur de chargement', 'Impossible de charger le profil.');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  // Handlers pour chaque section
  const handlePersonalInfoChange = (newData: any) => {
    setFormData(prev => ({
      ...prev,
      personalInfo: newData
    }));
  };

  const handleBiographyChange = (biography: string) => {
    setFormData(prev => ({
      ...prev,
      biography
    }));
  };

  const handleAcademicInfoChange = (newData: any) => {
    setFormData(prev => ({
      ...prev,
      academicInfo: newData
    }));
  };

  const handleLinkedInChange = (linkedin: string) => {
    setFormData(prev => ({
      ...prev,
      linkedin
    }));
  };

  const handleInterestsChange = (interests: string[]) => {
    setFormData(prev => ({
      ...prev,
      interests
    }));
  };

  // === FONCTION COMMENTÉE ===
  // const handleLookingForChange = (lookingFor: string[]) => {
  //   setFormData(prev => ({
  //     ...prev,
  //     lookingFor
  //   }));
  // };

  // Actions du formulaire
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    
    try {
      // Mapper les données du formulaire vers le format API (sans campus)
      const updateData = {
        firstName: formData.personalInfo.firstName,
        lastName: formData.personalInfo.lastName,
        phone: formData.personalInfo.phone,
        language: formData.personalInfo.language,
        biography: formData.biography,
        promotion: formData.academicInfo.promotion,
        // campus: formData.academicInfo.campus,  // ← SUPPRIMÉ
        linkedin: formData.linkedin,
        interests: formData.interests,
        lookingFor: formData.lookingFor,
      };
      
      await ProfileService.updateMyProfile(updateData);
      showCustomToast('success', 'Profil mis à jour', 'Vos modifications ont été enregistrées avec succès.');
      navigate('/profil');
    } catch (err: any) {
      console.error('Erreur sauvegarde profil:', err);
      // Afficher un message d'erreur plus détaillé
      if (err.response?.data) {
        const errorData = err.response.data;
        if (typeof errorData === 'object') {
          const messages = Object.entries(errorData)
            .map(([key, val]) => `${key}: ${Array.isArray(val) ? val[0] : val}`)
            .join(', ');
          setError(`Erreur: ${messages}`);
          showCustomToast('error', 'Erreur de sauvegarde', messages);
        } else {
          const msg = errorData.message || 'Erreur lors de la sauvegarde';
          setError(msg);
          showCustomToast('error', 'Erreur de sauvegarde', msg);
        }
      } else {
        const msg = err.message || 'Erreur lors de la sauvegarde du profil';
        setError(msg);
        showCustomToast('error', 'Erreur de sauvegarde', msg);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm("Voulez-vous vraiment annuler les modifications?")) {
      navigate('/profil');
    }
  };

  const handlePreview = () => {
    navigate('/profil');
  };

  // Affichage du chargement
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <Toaster position="top-right" />
        <HeaderConnected />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Chargement du profil...</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Affichage de l'erreur
  if (error && !formData.personalInfo.email) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <Toaster position="top-right" />
        <HeaderConnected />
        <main className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={() => navigate('/connexion')}
              className="mt-4 text-blue-600 hover:underline"
            >
              Se connecter
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Toaster 
        position="top-right"
        toastOptions={{
          className: 'rounded-2xl',
          style: {
            borderRadius: '20px',
          },
        }}
      />
      {/* UTILISE HeaderConnected au lieu de Header */}
      <HeaderConnected />
      
      <main className="container mx-auto px-4 md:px-6 py-8 max-w-6xl">
        <EditProfilHeader />
        
        {/* Bannière d'erreur de sauvegarde */}
        {error && formData.personalInfo.email && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-red-700">{error}</p>
              <button 
                onClick={() => setError(null)} 
                className="text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          </div>
        )}
        
        <ProfilePhotoUpload />
        
        <PersonalInfoForm
          data={formData.personalInfo}
          onChange={handlePersonalInfoChange}
        />
        
        <BiographyForm
          value={formData.biography}
          onChange={handleBiographyChange}
        />
        
        <AcademicInfoForm
          data={formData.academicInfo}
          onChange={handleAcademicInfoChange}
        />
        
        <LinkedInInput
          value={formData.linkedin}
          onChange={handleLinkedInChange}
        />
        
        <InterestsSection
          interests={formData.interests}
          setInterests={handleInterestsChange}
        />
        
        {/* === SECTION "JE RECHERCHE ACTUELLEMENT" COMMENTÉE ===
        <LookingForSection
          items={formData.lookingFor}
          setItems={handleLookingForChange}
        />
        === FIN SECTION COMMENTÉE === */}
        
        <FormActions
          onCancel={handleCancel}
          onPreview={handlePreview}
          onSave={handleSave}
          isSaving={isSaving}
        />
      </main>
      
      <Footer />
    </div>
  );
};

export default EditProfilePage;