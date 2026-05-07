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
import { API_BASE_URL } from "@/services/api.config";
import {
  CompetenceCategory,
  CompetenceGroup,
  CompetenceLevel,
  COMPETENCE_LEVEL_LABELS,
  HistoriqueEntry,
  HistoriqueEntryType,
  HISTORIQUE_TYPE_LABELS,
  UserCompetence,
} from "@/types/laureats-connected";

interface Country {
  id: number;
  name: string;
  code_iso: string;
  flag_emoji?: string;
  continent?: string;
  is_active: boolean;
}

interface Specialite {
  id: number;
  code: string;
  intitule: string;
  is_active: boolean;
}

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
  const [countries, setCountries] = useState<Country[]>([]);
  const [specialites, setSpecialites] = useState<Specialite[]>([]);
  const [historique, setHistorique] = useState<HistoriqueEntry[]>([]);
  const [historiqueLoading, setHistoriqueLoading] = useState(false);
  const [editingHistoriqueId, setEditingHistoriqueId] = useState<number | null>(null);
  const [editingHistoriqueEntry, setEditingHistoriqueEntry] = useState<HistoriqueEntry | null>(null);
  const [newHistoriqueEntry, setNewHistoriqueEntry] = useState<Omit<HistoriqueEntry, 'id'>>({
    entryType: 'professional',
    title: '',
    organization: '',
    location: '',
    startDate: '',
    endDate: null,
    isCurrent: false,
    description: '',
  });
  const [competences, setCompetences] = useState<CompetenceGroup[]>([]);
  const [competencesLoading, setCompetencesLoading] = useState(false);
  const [editingCompetenceId, setEditingCompetenceId] = useState<number | null>(null);
  const [editingCompetence, setEditingCompetence] = useState<UserCompetence | null>(null);
  const [availableCategories, setAvailableCategories] = useState<CompetenceCategory[]>([]);
  const [newCompetence, setNewCompetence] = useState<{
    categoryId: number | null;
    customCategory: string;
    name: string;
    level: CompetenceLevel;
  }>({
    categoryId: null,
    customCategory: '',
    name: '',
    level: 'intermediate',
  });

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

        const [profile, countriesRes, specialitesRes, historiqueData, competencesData, categoriesData] = await Promise.all([
          ProfileService.getMyProfile(),
          fetch(`${API_BASE_URL}/countries/`),
          fetch(`${API_BASE_URL}/specialites/`),
          ProfileService.getHistorique(currentUser.id).catch(() => []),
          ProfileService.getCompetences(currentUser.id).catch(() => []),
          ProfileService.getCompetenceCategories().catch(() => []),
        ]);

        if (countriesRes.ok) {
          const countriesData = await countriesRes.json();
          setCountries(countriesData.results || countriesData);
        }

        if (specialitesRes.ok) {
          const specialitesData = await specialitesRes.json();
          setSpecialites(specialitesData.results || specialitesData);
        }
        
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
        setHistorique(historiqueData);
        setCompetences(competencesData);
        setAvailableCategories(categoriesData);
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

  const handleHistoriqueFormChange = (field: keyof Omit<HistoriqueEntry, 'id'>, value: string | boolean) => {
    setNewHistoriqueEntry((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'isCurrent' && value ? { endDate: null } : {}),
    }));
  };

  const handleEditHistoriqueFormChange = (field: keyof Omit<HistoriqueEntry, 'id'>, value: string | boolean) => {
    setEditingHistoriqueEntry((prev) => prev ? ({
      ...prev,
      [field]: value,
      ...(field === 'isCurrent' && value ? { endDate: null } : {}),
    }) : prev);
  };

  const handleStartEditHistorique = (entry: HistoriqueEntry) => {
    setEditingHistoriqueId(entry.id || null);
    setEditingHistoriqueEntry({ ...entry });
  };

  const handleCancelEditHistorique = () => {
    setEditingHistoriqueId(null);
    setEditingHistoriqueEntry(null);
  };

  const handleAddHistorique = async () => {
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser) return;
    if (!newHistoriqueEntry.title.trim() || !newHistoriqueEntry.startDate) {
      showCustomToast('error', 'Champs manquants', 'Veuillez remplir au moins le titre et la date de début.');
      return;
    }

    setHistoriqueLoading(true);
    try {
      const createdEntry = await ProfileService.createHistoriqueEntry(currentUser.id, {
        entry_type: newHistoriqueEntry.entryType,
        title: newHistoriqueEntry.title.trim(),
        organization: newHistoriqueEntry.organization.trim(),
        location: newHistoriqueEntry.location.trim(),
        start_date: newHistoriqueEntry.startDate,
        end_date: newHistoriqueEntry.isCurrent ? null : newHistoriqueEntry.endDate || null,
        is_current: newHistoriqueEntry.isCurrent,
        description: newHistoriqueEntry.description.trim(),
      });
      setHistorique((prev) => [...prev, createdEntry]);
      setNewHistoriqueEntry({
        entryType: 'professional',
        title: '',
        organization: '',
        location: '',
        startDate: '',
        endDate: null,
        isCurrent: false,
        description: '',
      });
      showCustomToast('success', 'Étape ajoutée', 'L\'entrée a été ajoutée à votre historique.');
    } catch (err: any) {
      console.error('Erreur ajout historique:', err);
      showCustomToast('error', 'Erreur', err.message || 'Erreur lors de l\'ajout.');
    } finally {
      setHistoriqueLoading(false);
    }
  };

  const handleSaveHistorique = async () => {
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser || !editingHistoriqueId || !editingHistoriqueEntry) return;
    if (!editingHistoriqueEntry.title.trim() || !editingHistoriqueEntry.startDate) {
      showCustomToast('error', 'Champs manquants', 'Veuillez remplir au moins le titre et la date de début.');
      return;
    }

    setHistoriqueLoading(true);
    try {
      const updatedEntry = await ProfileService.updateHistoriqueEntry(currentUser.id, editingHistoriqueId, {
        entry_type: editingHistoriqueEntry.entryType,
        title: editingHistoriqueEntry.title.trim(),
        organization: editingHistoriqueEntry.organization.trim(),
        location: editingHistoriqueEntry.location.trim(),
        start_date: editingHistoriqueEntry.startDate,
        end_date: editingHistoriqueEntry.isCurrent ? null : editingHistoriqueEntry.endDate || null,
        is_current: editingHistoriqueEntry.isCurrent,
        description: editingHistoriqueEntry.description.trim(),
      });
      setHistorique((prev) => prev.map((item) => item.id === editingHistoriqueId ? updatedEntry : item));
      handleCancelEditHistorique();
      showCustomToast('success', 'Historique mis à jour', 'L\'entrée a été modifiée avec succès.');
    } catch (err: any) {
      console.error('Erreur mise à jour historique:', err);
      showCustomToast('error', 'Erreur', err.message || 'Erreur lors de la mise à jour.');
    } finally {
      setHistoriqueLoading(false);
    }
  };

  const handleRemoveHistorique = async (entryId: number) => {
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser) return;
    if (!window.confirm('Voulez-vous vraiment supprimer cette entrée ?')) return;

    setHistoriqueLoading(true);
    try {
      await ProfileService.deleteHistoriqueEntry(currentUser.id, entryId);
      setHistorique((prev) => prev.filter((item) => item.id !== entryId));
      showCustomToast('success', 'Élément supprimé', 'L\'entrée a été retirée de votre historique.');
    } catch (err: any) {
      console.error('Erreur suppression historique:', err);
      showCustomToast('error', 'Erreur', err.message || 'Erreur lors de la suppression.');
    } finally {
      setHistoriqueLoading(false);
    }
  };

  const handleStartEditCompetence = (competence: UserCompetence) => {
    setEditingCompetenceId(competence.id || null);
    setEditingCompetence({ ...competence });
  };

  const handleCancelEditCompetence = () => {
    setEditingCompetenceId(null);
    setEditingCompetence(null);
  };

  const handleAddCompetence = async () => {
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser) return;
    if (!newCompetence.name.trim()) {
      showCustomToast('error', 'Nom requis', 'Veuillez saisir le nom de la compétence.');
      return;
    }
    if (!newCompetence.categoryId && !newCompetence.customCategory.trim()) {
      showCustomToast('error', 'Catégorie requise', 'Veuillez choisir ou créer une catégorie.');
      return;
    }

    setCompetencesLoading(true);
    try {
      await ProfileService.createCompetence(currentUser.id, {
        category: newCompetence.categoryId || undefined,
        categoryName: newCompetence.categoryId ? undefined : newCompetence.customCategory.trim(),
        name: newCompetence.name.trim(),
        level: newCompetence.level || 'intermediate',
      });
      const updatedCompetences = await ProfileService.getCompetences(currentUser.id);
      setCompetences(updatedCompetences);
      setNewCompetence({
        categoryId: null,
        customCategory: '',
        name: '',
        level: 'intermediate',
      });
      showCustomToast('success', 'Compétence ajoutée', 'La compétence a été ajoutée.');
    } catch (err: any) {
      console.error('Erreur ajout compétence:', err);
      showCustomToast('error', 'Erreur', err.message || 'Erreur lors de l\'ajout.');
    } finally {
      setCompetencesLoading(false);
    }
  };

  const handleSaveCompetence = async () => {
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser || !editingCompetenceId || !editingCompetence) return;
    if (!editingCompetence.name.trim()) {
      showCustomToast('error', 'Nom requis', 'Veuillez saisir le nom de la compétence.');
      return;
    }

    setCompetencesLoading(true);
    try {
      const updatedCompetence = await ProfileService.updateCompetence(currentUser.id, editingCompetenceId, {
        name: editingCompetence.name.trim(),
        level: editingCompetence.level || 'intermediate',
      });
      setCompetences((prev) => prev.map((group) => ({
        ...group,
        competences: group.competences.map((item) => item.id === editingCompetenceId ? {
          ...item,
          ...updatedCompetence,
          categoryId: item.categoryId,
          categoryName: item.categoryName,
        } : item),
      })));
      handleCancelEditCompetence();
      showCustomToast('success', 'Compétence mise à jour', 'La compétence a été modifiée avec succès.');
    } catch (err: any) {
      console.error('Erreur mise à jour compétence:', err);
      showCustomToast('error', 'Erreur', err.message || 'Erreur lors de la mise à jour.');
    } finally {
      setCompetencesLoading(false);
    }
  };

  const handleRemoveCompetence = async (competenceId: number) => {
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser) return;

    setCompetencesLoading(true);
    try {
      await ProfileService.deleteCompetence(currentUser.id, competenceId);
      setCompetences((prev) => prev
        .map((group) => ({
          ...group,
          competences: group.competences.filter((item) => item.id !== competenceId),
        }))
        .filter((group) => group.competences.length > 0));
      showCustomToast('success', 'Compétence supprimée', 'La compétence a été retirée.');
    } catch (err: any) {
      console.error('Erreur suppression compétence:', err);
      showCustomToast('error', 'Erreur', err.message || 'Erreur lors de la suppression.');
    } finally {
      setCompetencesLoading(false);
    }
  };

  const handleRemoveCategorie = async (categoryId: number) => {
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser) return;
    if (!window.confirm('Voulez-vous vraiment supprimer cette catégorie et toutes ses compétences ?')) return;

    setCompetencesLoading(true);
    try {
      await ProfileService.deleteCompetenceCategory(currentUser.id, categoryId);
      setCompetences((prev) => prev.filter((group) => group.categoryId !== categoryId));
      showCustomToast('success', 'Catégorie supprimée', 'La catégorie et toutes ses compétences ont été retirées.');
    } catch (err: any) {
      console.error('Erreur suppression catégorie:', err);
      showCustomToast('error', 'Erreur', err.message || 'Erreur lors de la suppression.');
    } finally {
      setCompetencesLoading(false);
    }
  };

  const handleAddCompetenceToCategory = async (categoryId: number, categoryName: string, competenceName: string) => {
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser || !competenceName.trim()) return;

    setCompetencesLoading(true);
    try {
      await ProfileService.createCompetence(currentUser.id, {
        category: categoryId,
        name: competenceName.trim(),
        level: 'intermediate',
      });
      const updatedCompetences = await ProfileService.getCompetences(currentUser.id);
      setCompetences(updatedCompetences);
      showCustomToast('success', 'Compétence ajoutée', `"${competenceName.trim()}" a été ajoutée à ${categoryName}.`);
    } catch (err: any) {
      console.error('Erreur ajout compétence:', err);
      showCustomToast('error', 'Erreur', err.message || 'Erreur lors de l\'ajout.');
    } finally {
      setCompetencesLoading(false);
    }
  };

  // Actions du formulaire
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    
    try {
      // Mapper les données du formulaire vers le format API (sans campus)
      const selectedCountry = countries.find(
        (country) => country.name === formData.personalInfo.nationality
      );
      const selectedSpecialite = specialites.find(
        (specialite) => specialite.intitule === formData.academicInfo.field
      );

      const updateData = {
        firstName: formData.personalInfo.firstName,
        lastName: formData.personalInfo.lastName,
        phone: formData.personalInfo.phone,
        country: selectedCountry?.id,
        language: formData.personalInfo.language,
        biography: formData.biography,
        promotion: formData.academicInfo.promotion,
        specialite: selectedSpecialite?.id,
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
          nationalityOptions={countries.map((country) => country.name)}
        />
        
        <BiographyForm
          value={formData.biography}
          onChange={handleBiographyChange}
        />
        
        <AcademicInfoForm
          data={formData.academicInfo}
          onChange={handleAcademicInfoChange}
          fieldOptions={specialites.map((specialite) => specialite.intitule)}
        />
        
        <LinkedInInput
          value={formData.linkedin}
          onChange={handleLinkedInChange}
        />
        
        <InterestsSection
          interests={formData.interests}
          setInterests={handleInterestsChange}
        />

        <div className="mb-10 pb-8 border-b border-gray-200">
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6 border-2 border-orange-300 shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Historique académique et professionnel</h2>
            <p className="text-gray-700 mb-4 font-medium">Ajoutez ou modifiez vos étapes importantes.</p>

            <div className="space-y-3 mb-6">
              {historiqueLoading && historique.length === 0 ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                  <span className="ml-2 text-gray-600">Chargement...</span>
                </div>
              ) : historique.length === 0 ? (
                <p className="text-gray-500 text-center py-4 italic">Aucun historique enregistré</p>
              ) : (
                historique.map((item) => (
                  <div key={item.id} className="flex items-start gap-4 p-4 bg-white rounded-lg border border-orange-200 shadow-sm">
                    {editingHistoriqueId === item.id && editingHistoriqueEntry ? (
                      <div className="flex-grow space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <select
                            value={editingHistoriqueEntry.entryType}
                            onChange={(e) => handleEditHistoriqueFormChange('entryType', e.target.value as HistoriqueEntryType)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          >
                            {Object.entries(HISTORIQUE_TYPE_LABELS).map(([value, label]) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={editingHistoriqueEntry.title}
                            onChange={(e) => handleEditHistoriqueFormChange('title', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="Titre"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input type="text" value={editingHistoriqueEntry.organization} onChange={(e) => handleEditHistoriqueFormChange('organization', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Organisation" />
                          <input type="text" value={editingHistoriqueEntry.location} onChange={(e) => handleEditHistoriqueFormChange('location', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Lieu" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <input type="date" value={editingHistoriqueEntry.startDate} onChange={(e) => handleEditHistoriqueFormChange('startDate', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                          <input type="date" value={editingHistoriqueEntry.endDate || ''} onChange={(e) => handleEditHistoriqueFormChange('endDate', e.target.value)} disabled={editingHistoriqueEntry.isCurrent} className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm ${editingHistoriqueEntry.isCurrent ? 'bg-gray-100 cursor-not-allowed' : ''}`} />
                          <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input type="checkbox" checked={editingHistoriqueEntry.isCurrent} onChange={(e) => handleEditHistoriqueFormChange('isCurrent', e.target.checked)} />
                            En cours
                          </label>
                        </div>
                        <textarea value={editingHistoriqueEntry.description} onChange={(e) => handleEditHistoriqueFormChange('description', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" rows={2} placeholder="Description" />
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={handleCancelEditHistorique} disabled={historiqueLoading} className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700">Annuler</button>
                          <button type="button" onClick={handleSaveHistorique} disabled={historiqueLoading} className="px-3 py-2 bg-orange-500 text-white rounded-lg text-sm disabled:opacity-50">Enregistrer</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-shrink-0 flex flex-col gap-1">
                          <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full border border-orange-300">
                            {HISTORIQUE_TYPE_LABELS[item.entryType] || item.entryType}
                          </span>
                          <span className="text-xs text-gray-500 text-center">
                            {item.startDate}{item.isCurrent ? ' - Présent' : item.endDate ? ` - ${item.endDate}` : ''}
                          </span>
                        </div>
                        <div className="flex-grow">
                          <p className="font-bold text-gray-800">{item.title}</p>
                          {item.organization && <p className="text-sm text-gray-600">{item.organization}{item.location ? `, ${item.location}` : ''}</p>}
                          {item.description && <p className="text-sm text-gray-500 mt-1">{item.description}</p>}
                        </div>
                        <div className="flex items-start gap-3">
                          <button type="button" onClick={() => handleStartEditHistorique(item)} disabled={historiqueLoading} className="text-orange-500 hover:text-orange-700 disabled:opacity-50">
                            <i className="fas fa-pen"></i>
                          </button>
                          <button type="button" onClick={() => item.id && handleRemoveHistorique(item.id)} disabled={historiqueLoading} className="text-red-500 hover:text-red-700 disabled:opacity-50">
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="bg-white rounded-lg p-4 border border-orange-200">
              <h4 className="font-medium text-gray-700 mb-3">Ajouter une étape</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                <div>
                  <label className="block text-gray-600 text-xs mb-1">Type *</label>
                  <select value={newHistoriqueEntry.entryType} onChange={(e) => handleHistoriqueFormChange('entryType', e.target.value as HistoriqueEntryType)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    {Object.entries(HISTORIQUE_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-3">
                  <label className="block text-gray-600 text-xs mb-1">Titre / Intitulé *</label>
                  <input type="text" value={newHistoriqueEntry.title} onChange={(e) => handleHistoriqueFormChange('title', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Ex: Stage, licence, projet..." />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div>
                  <label className="block text-gray-600 text-xs mb-1">Organisation / Établissement</label>
                  <input type="text" value={newHistoriqueEntry.organization} onChange={(e) => handleHistoriqueFormChange('organization', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-gray-600 text-xs mb-1">Lieu / Ville</label>
                  <input type="text" value={newHistoriqueEntry.location} onChange={(e) => handleHistoriqueFormChange('location', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                <div>
                  <label className="block text-gray-600 text-xs mb-1">Date de début *</label>
                  <input type="date" value={newHistoriqueEntry.startDate} onChange={(e) => handleHistoriqueFormChange('startDate', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-gray-600 text-xs mb-1">Date de fin</label>
                  <input type="date" value={newHistoriqueEntry.endDate || ''} onChange={(e) => handleHistoriqueFormChange('endDate', e.target.value)} disabled={newHistoriqueEntry.isCurrent} className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm ${newHistoriqueEntry.isCurrent ? 'bg-gray-100 cursor-not-allowed' : ''}`} />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={newHistoriqueEntry.isCurrent} onChange={(e) => handleHistoriqueFormChange('isCurrent', e.target.checked)} className="w-4 h-4 text-orange-500 border-gray-300 rounded" />
                    <span className="text-sm text-gray-700">En cours</span>
                  </label>
                </div>
              </div>
              <div className="mb-3">
                <label className="block text-gray-600 text-xs mb-1">Description</label>
                <textarea value={newHistoriqueEntry.description} onChange={(e) => handleHistoriqueFormChange('description', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" rows={2} />
              </div>
              <button type="button" onClick={handleAddHistorique} disabled={historiqueLoading || !newHistoriqueEntry.title.trim() || !newHistoriqueEntry.startDate} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed">
                {historiqueLoading ? 'Ajout...' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>

        <div className="mb-10 pb-8 border-b border-gray-200">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-300 shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Mes compétences</h2>
            <p className="text-gray-700 mb-4 font-medium">Ajoutez et modifiez vos compétences par catégorie.</p>

            <div className="space-y-4 mb-6">
              {competencesLoading && competences.length === 0 ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                  <span className="ml-2 text-gray-600">Chargement...</span>
                </div>
              ) : competences.length === 0 ? (
                <p className="text-gray-500 text-center py-4 italic">Aucune compétence enregistrée</p>
              ) : (
                competences.map((categorie) => (
                  <div key={categorie.categoryId} className="p-4 bg-white rounded-lg border border-green-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-green-700">{categorie.categorie}</h4>
                      <button type="button" onClick={() => handleRemoveCategorie(categorie.categoryId)} disabled={competencesLoading} className="text-red-500 hover:text-red-700 text-sm disabled:opacity-50">
                        <i className="fas fa-trash mr-1"></i>Supprimer catégorie
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {categorie.competences.map((competence) => (
                        <div key={competence.id} className="flex items-center gap-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm">
                          {editingCompetenceId === competence.id && editingCompetence ? (
                            <>
                              <input type="text" value={editingCompetence.name} onChange={(e) => setEditingCompetence((prev) => prev ? ({ ...prev, name: e.target.value }) : prev)} className="px-2 py-1 rounded text-gray-800 text-sm min-w-[140px]" />
                              <select value={editingCompetence.level || 'intermediate'} onChange={(e) => setEditingCompetence((prev) => prev ? ({ ...prev, level: e.target.value as CompetenceLevel }) : prev)} className="px-2 py-1 rounded text-gray-800 text-xs">
                                {Object.entries(COMPETENCE_LEVEL_LABELS).map(([value, label]) => (
                                  <option key={value} value={value}>{label}</option>
                                ))}
                              </select>
                              <button type="button" onClick={handleSaveCompetence} disabled={competencesLoading} className="text-white hover:text-gray-200 disabled:opacity-50">
                                <i className="fas fa-check text-xs"></i>
                              </button>
                              <button type="button" onClick={handleCancelEditCompetence} disabled={competencesLoading} className="text-white hover:text-gray-200 disabled:opacity-50">
                                <i className="fas fa-times text-xs"></i>
                              </button>
                            </>
                          ) : (
                            <>
                              <span>{competence.name}</span>
                              {competence.level && <span className="text-xs bg-green-600 px-2 py-0.5 rounded-full">{COMPETENCE_LEVEL_LABELS[competence.level] || competence.level}</span>}
                              <button type="button" onClick={() => handleStartEditCompetence(competence)} disabled={competencesLoading} className="text-white hover:text-gray-200 disabled:opacity-50">
                                <i className="fas fa-pen text-xs"></i>
                              </button>
                              <button type="button" onClick={() => competence.id && handleRemoveCompetence(competence.id)} disabled={competencesLoading} className="text-white hover:text-gray-200 disabled:opacity-50">
                                <i className="fas fa-times text-xs"></i>
                              </button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ajouter une compétence..."
                        className="flex-grow px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const input = e.target as HTMLInputElement;
                            if (input.value.trim()) {
                              handleAddCompetenceToCategory(categorie.categoryId, categorie.categorie, input.value.trim());
                              input.value = '';
                            }
                          }
                        }}
                        disabled={competencesLoading}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="bg-white rounded-lg p-4 border border-green-200">
              <h4 className="font-medium text-gray-700 mb-3">Ajouter une compétence</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                <div>
                  <label className="block text-gray-600 text-xs mb-1">Catégorie</label>
                  <select value={newCompetence.categoryId || ''} onChange={(e) => setNewCompetence({ ...newCompetence, categoryId: e.target.value ? parseInt(e.target.value, 10) : null, customCategory: e.target.value ? '' : newCompetence.customCategory })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option value="">-- Nouvelle catégorie --</option>
                    {availableCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                    {competences.filter((c) => !availableCategories.find((ac) => ac.id === c.categoryId)).map((c) => (
                      <option key={c.categoryId} value={c.categoryId}>{c.categorie}</option>
                    ))}
                  </select>
                </div>
                {!newCompetence.categoryId && (
                  <div>
                    <label className="block text-gray-600 text-xs mb-1">Nom catégorie *</label>
                    <input type="text" value={newCompetence.customCategory} onChange={(e) => setNewCompetence({ ...newCompetence, customCategory: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Ex: Langages, Bureautique..." />
                  </div>
                )}
                <div className={newCompetence.categoryId ? 'md:col-span-2' : ''}>
                  <label className="block text-gray-600 text-xs mb-1">Compétence *</label>
                  <input type="text" value={newCompetence.name} onChange={(e) => setNewCompetence({ ...newCompetence, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Ex: Excel, Python, Communication..." />
                </div>
                <div>
                  <label className="block text-gray-600 text-xs mb-1">Niveau</label>
                  <select value={newCompetence.level} onChange={(e) => setNewCompetence({ ...newCompetence, level: e.target.value as CompetenceLevel })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    {Object.entries(COMPETENCE_LEVEL_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button type="button" onClick={handleAddCompetence} disabled={competencesLoading || !newCompetence.name.trim() || (!newCompetence.categoryId && !newCompetence.customCategory.trim())} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed">
                {competencesLoading ? 'Ajout...' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
        
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