// frontend/src/pages/laureats/EditProfileLaureat.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast, Toaster } from "sonner";
import { CheckCircle, XCircle, AlertCircle, Check, Trash2, Plus, Loader2, Wheat } from 'lucide-react';
import HeaderConnected from '../../components/layout/HeaderConnected';
import Footer from '../../components/layout/Footer';
import { 
  UserProfile, 
  HistoriqueEntry, 
  HistoriqueEntryType,
  HISTORIQUE_TYPE_LABELS,
  CompetenceGroup,
  CompetenceCategory,
  UserCompetence,
  CompetenceLevel,
  COMPETENCE_LEVEL_LABELS
} from '../../types/laureats-connected';
import { ProfileService } from '../../services/profileService';
import { AuthService } from '../../services/authService';
import { getAbsoluteMediaUrl } from '@/lib/utils';
import { API_BASE_URL } from '@/services/api.config';

const EditProfileLaureat = () => {
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<UserProfile>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    whatsapp: '',
    nationality: '',
    biography: '',
    quote: '',
    promotion: '',
    field: '',
    linkedin: '',
    interests: [],
    searches: [],
    // Job fields
    jobTitle: '',
    jobCompany: '',
    jobCity: '',
    jobEmail: '',
    jobDomain: ''
  });

  // État pour les erreurs de validation par champ
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const [newInterest, setNewInterest] = useState('');
  const [newSearch, setNewSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  
  // États pour les nouvelles options
  const [isMentorAvailable, setIsMentorAvailable] = useState(false);
  const [isProfilePublic, setIsProfilePublic] = useState(true);
  const [mentorshipAreas, setMentorshipAreas] = useState<string[]>([]);
  const [newMentorshipArea, setNewMentorshipArea] = useState('');
  
  // États pour historique et compétences (nouvelle approche relationnelle)
  const [historique, setHistorique] = useState<HistoriqueEntry[]>([]);
  const [historiqueLoading, setHistoriqueLoading] = useState(false);
  // Formulaire pour ajouter une nouvelle entrée d'historique
  const [newHistoriqueEntry, setNewHistoriqueEntry] = useState<Omit<HistoriqueEntry, 'id'>>({
    entryType: 'professional',
    title: '',
    organization: '',
    location: '',
    startDate: '',
    endDate: null,
    isCurrent: false,
    description: ''
  });
  
  // États pour compétences (nouvelle approche relationnelle)
  const [competences, setCompetences] = useState<CompetenceGroup[]>([]);
  const [competencesLoading, setCompetencesLoading] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<CompetenceCategory[]>([]);
  // Formulaire pour ajouter une nouvelle compétence
  const [newCompetence, setNewCompetence] = useState<{
    categoryId: number | null;
    customCategory: string;
    name: string;
    level: CompetenceLevel;
  }>({
    categoryId: null,
    customCategory: '',
    name: '',
    level: 'intermediate'
  });
  //=================================
  const [specialites, setSpecialites] = useState<{ id: number; intitule: string }[]>([]);
  const [countries, setCountries] = useState<{ id: number; name: string; flag_emoji: string }[]>([]);
  const [selectedSpecialiteId, setSelectedSpecialiteId] = useState<number | null>(null);
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);

  // Fonction pour afficher un toast personnalisé
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
      <div className="flex items-start gap-3 p-4 rounded-xl shadow-lg" style={{ background: '#fef3c7', border: '2px solid #f59f24' }}>
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

        const [laureatProfile, specsRes, countriesRes] = await Promise.all([
          ProfileService.getLaureatProfile(currentUser.id),
          fetch(`${API_BASE_URL}/specialites/`),
          fetch(`${API_BASE_URL}/countries/`),
        ]);

        const specsJson = await specsRes.json();
        const specsArray = Array.isArray(specsJson) ? specsJson : (specsJson.data || specsJson.results || []);
        setSpecialites(specsArray);

        const countriesJson = await countriesRes.json();
        const countriesArray = Array.isArray(countriesJson) ? countriesJson : (countriesJson.data || countriesJson.results || []);
        setCountries(countriesArray);

        const resolvedSpecialiteId = currentUser.specialite || specsArray.find(
          (spec: { id: number; intitule: string }) => spec.intitule === laureatProfile.speciality
        )?.id || null;
        const resolvedCountryId = currentUser.country || countriesArray.find(
          (country: { id: number; name: string }) => country.name === laureatProfile.nationality
        )?.id || null;

        setSelectedSpecialiteId(resolvedSpecialiteId);
        setSelectedCountryId(resolvedCountryId);

        // Mapper les données du profil lauréat (sans campus)
        setProfile({
          firstName: laureatProfile.name?.split(' ')[1] || currentUser.first_name || '',
          lastName: laureatProfile.name?.split(' ')[0] || currentUser.last_name || '',
          email: laureatProfile.personalInfo?.email || currentUser.email || '',
          phone: laureatProfile.personalInfo?.phone || '',
          nationality: laureatProfile.nationality || '',
          whatsapp: laureatProfile.personalInfo?.whatsapp || '',
          biography: laureatProfile.bio || '',
          quote: laureatProfile.quote || '',
          promotion: laureatProfile.promotion || '',
          field: laureatProfile.speciality || '',
          linkedin: laureatProfile.academicInfo?.linkedin || '',
          interests: [],
          searches: [],
          // Charger les données d'emploi depuis l'API
          jobTitle: laureatProfile.job?.title || '',
          jobCompany: laureatProfile.job?.company || '',
          jobCity: laureatProfile.job?.location?.split(',')[0]?.trim() || '',
          jobEmail: laureatProfile.job?.email || '',
          jobDomain: laureatProfile.job?.domain || ''
        });
        
        // Charger l'image de profil si disponible
        if (currentUser.avatar_url) {
          setProfileImage(getAbsoluteMediaUrl(currentUser.avatar_url));
        }
        
        // Charger l'historique depuis l'API relationnelle
        try {
          const historiqueData = await ProfileService.getHistorique(currentUser.id);
          setHistorique(historiqueData);
        } catch (err) {
          console.warn('Erreur chargement historique:', err);
        }
        
        // Charger les compétences depuis l'API relationnelle
        try {
          const [competencesData, categoriesData] = await Promise.all([
            ProfileService.getCompetences(currentUser.id),
            ProfileService.getCompetenceCategories()
          ]);
          setCompetences(competencesData);
          setAvailableCategories(categoriesData);
        } catch (err) {
          console.warn('Erreur chargement compétences:', err);
        }
        
      } catch (err) {
        console.error('Erreur chargement profil:', err);
        setError('Impossible de charger le profil');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  // Gestion des changements dans les champs de formulaire
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile({
      ...profile,
      [name]: value
    });
  };

  // Gestion du téléchargement d'image
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validation
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setImageError('Format non supporté. Utilisez JPG ou PNG.');
      showCustomToast('error', 'Format non supporté', 'Utilisez JPG ou PNG.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError('Le fichier est trop volumineux (max 5MB)');
      showCustomToast('error', 'Fichier trop volumineux', 'La taille maximale est de 5MB.');
      return;
    }
    
    setIsUploadingImage(true);
    setImageError(null);
    
    try {
      const currentUser = AuthService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Utilisateur non connecté');
      }
      
      const result = await ProfileService.uploadLaureatPhoto(currentUser.id, file);
      setProfileImage(result.photoUrl);
      AuthService.updateStoredUser({ avatar_url: result.photoUrl });
      showCustomToast('success', 'Photo mise à jour', 'Votre photo de profil a été modifiée avec succès.');
    } catch (err: any) {
      console.error('Erreur upload photo:', err);
      setImageError(err.message || 'Erreur lors de l\'upload');
      showCustomToast('error', 'Erreur', err.message || 'Erreur lors de l\'upload de la photo.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Ajout d'un nouvel intérêt
  const handleAddInterest = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newInterest.trim()) {
      e.preventDefault();
      if (!profile.interests.includes(newInterest.trim())) {
        setProfile({
          ...profile,
          interests: [...profile.interests, newInterest.trim()]
        });
        showCustomToast('success', 'Intérêt ajouté', `"${newInterest.trim()}" a été ajouté.`);
      }
      setNewInterest('');
    }
  };

  // Suppression d'un intérêt
  const handleRemoveInterest = (interestToRemove: string) => {
    setProfile({
      ...profile,
      interests: profile.interests.filter(interest => interest !== interestToRemove)
    });
    showCustomToast('info', 'Intérêt supprimé', `"${interestToRemove}" a été retiré.`);
  };

  // Ajout d'une nouvelle recherche
  const handleAddSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newSearch.trim()) {
      e.preventDefault();
      if (!profile.searches.includes(newSearch.trim())) {
        setProfile({
          ...profile,
          searches: [...profile.searches, newSearch.trim()]
        });
        showCustomToast('success', 'Recherche ajoutée', `"${newSearch.trim()}" a été ajouté.`);
      }
      setNewSearch('');
    }
  };

  // Suppression d'une recherche
  const handleRemoveSearch = (searchToRemove: string) => {
    setProfile({
      ...profile,
      searches: profile.searches.filter(search => search !== searchToRemove)
    });
    showCustomToast('info', 'Recherche supprimée', `"${searchToRemove}" a été retiré.`);
  };

  // Ajout d'un domaine de mentorat
  const handleAddMentorshipArea = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newMentorshipArea.trim()) {
      e.preventDefault();
      if (!mentorshipAreas.includes(newMentorshipArea.trim())) {
        setMentorshipAreas([...mentorshipAreas, newMentorshipArea.trim()]);
        showCustomToast('success', 'Domaine de mentorat ajouté', `"${newMentorshipArea.trim()}" a été ajouté.`);
      }
      setNewMentorshipArea('');
    }
  };

  // Suppression d'un domaine de mentorat
  const handleRemoveMentorshipArea = (areaToRemove: string) => {
    setMentorshipAreas(mentorshipAreas.filter(area => area !== areaToRemove));
    showCustomToast('info', 'Domaine supprimé', `"${areaToRemove}" a été retiré.`);
  };

  // ========== HISTORIQUE ==========
  const handleHistoriqueFormChange = (field: keyof Omit<HistoriqueEntry, 'id'>, value: string | boolean) => {
    setNewHistoriqueEntry(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'isCurrent' && value ? { endDate: null } : {})
    }));
  };

  const handleAddHistorique = async () => {
    if (!newHistoriqueEntry.title.trim() || !newHistoriqueEntry.startDate) {
      showCustomToast('error', 'Champs manquants', 'Veuillez remplir au moins le titre et la date de début.');
      return;
    }
    
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser) return;
    
    setHistoriqueLoading(true);
    try {
      const createdEntry = await ProfileService.createHistoriqueEntry(currentUser.id, {
        entry_type: newHistoriqueEntry.entryType,
        title: newHistoriqueEntry.title.trim(),
        organization: newHistoriqueEntry.organization?.trim() || '',
        location: newHistoriqueEntry.location?.trim() || '',
        start_date: newHistoriqueEntry.startDate,
        end_date: newHistoriqueEntry.isCurrent ? null : newHistoriqueEntry.endDate || null,
        is_current: newHistoriqueEntry.isCurrent,
        description: newHistoriqueEntry.description?.trim() || ''
      });
      
      setHistorique([...historique, createdEntry]);
      setNewHistoriqueEntry({
        entryType: 'professional',
        title: '',
        organization: '',
        location: '',
        startDate: '',
        endDate: null,
        isCurrent: false,
        description: ''
      });
      showCustomToast('success', 'Étape ajoutée', `"${createdEntry.title}" a été ajouté à votre historique.`);
    } catch (err: any) {
      console.error('Erreur ajout historique:', err);
      showCustomToast('error', 'Erreur', err.message || 'Erreur lors de l\'ajout.');
    } finally {
      setHistoriqueLoading(false);
    }
  };

  const handleRemoveHistorique = async (entryId: number) => {
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser || !entryId) return;
    
    if (!window.confirm('Voulez-vous vraiment supprimer cette entrée ?')) return;
    
    setHistoriqueLoading(true);
    try {
      await ProfileService.deleteHistoriqueEntry(currentUser.id, entryId);
      setHistorique(historique.filter(h => h.id !== entryId));
      showCustomToast('success', 'Élément supprimé', 'L\'entrée a été retirée de votre historique.');
    } catch (err: any) {
      console.error('Erreur suppression historique:', err);
      showCustomToast('error', 'Erreur', err.message || 'Erreur lors de la suppression.');
    } finally {
      setHistoriqueLoading(false);
    }
  };

  // ========== COMPÉTENCES ==========
  const handleAddCompetence = async () => {
    if (!newCompetence.name.trim()) {
      showCustomToast('error', 'Nom requis', 'Veuillez saisir le nom de la compétence.');
      return;
    }
    
    if (!newCompetence.categoryId && !newCompetence.customCategory.trim()) {
      showCustomToast('error', 'Catégorie requise', 'Veuillez choisir ou créer une catégorie.');
      return;
    }
    
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser) return;
    
    setCompetencesLoading(true);
    try {
      await ProfileService.createCompetence(currentUser.id, {
        category: newCompetence.categoryId || undefined,
        categoryName: !newCompetence.categoryId ? newCompetence.customCategory.trim() : undefined,
        name: newCompetence.name.trim(),
        level: newCompetence.level || 'intermediate'
      });
      
      const updatedCompetences = await ProfileService.getCompetences(currentUser.id);
      setCompetences(updatedCompetences);
      
      setNewCompetence({
        categoryId: null,
        customCategory: '',
        name: '',
        level: 'intermediate'
      });
      showCustomToast('success', 'Compétence ajoutée', `"${newCompetence.name.trim()}" a été ajoutée.`);
    } catch (err: any) {
      console.error('Erreur ajout compétence:', err);
      showCustomToast('error', 'Erreur', err.message || 'Erreur lors de l\'ajout.');
    } finally {
      setCompetencesLoading(false);
    }
  };

  const handleRemoveCompetence = async (competenceId: number) => {
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser || !competenceId) return;
    
    setCompetencesLoading(true);
    try {
      await ProfileService.deleteCompetence(currentUser.id, competenceId);
      
      const updatedCompetences = competences.map(group => ({
        ...group,
        competences: group.competences.filter(c => c.id !== competenceId)
      })).filter(group => group.competences.length > 0);
      
      setCompetences(updatedCompetences);
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
      setCompetences(competences.filter(group => group.categoryId !== categoryId));
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
        level: 'intermediate'
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

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setFieldErrors({});
    
    try {
      const currentUser = AuthService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Utilisateur non connecté');
      }

      const updateData = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        nationality: profile.nationality,
        WhatsApp: profile.whatsapp, 
        biography: profile.biography,
        quote: profile.quote,
        promotion: profile.promotion,
        field: profile.field,
        linkedin: profile.linkedin,
        interests: profile.interests,
        searches: profile.searches,
        isMentorAvailable,
        isProfilePublic,
        mentorshipAreas,
        jobTitle: profile.jobTitle,
        jobCompany: profile.jobCompany,
        jobCity: profile.jobCity,
        jobEmail: profile.jobEmail,
        jobDomain: profile.jobDomain,
        specialite: selectedSpecialiteId,
        country: selectedCountryId
      };
      
      await ProfileService.updateLaureatProfile(currentUser.id, updateData);
      await ProfileService.updateMentoringAvailability(currentUser.id, isMentorAvailable);
      
      showCustomToast('success', 'Profil mis à jour', 'Vos modifications ont été enregistrées avec succès.');
      navigate('/laureats/profil');
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour du profil:', err);
      
      if (err.response?.data) {
        const errorData = err.response.data;
        
        if (errorData.details?.field) {
          setFieldErrors({ [errorData.details.field]: errorData.details.reason || errorData.message });
          setError(`Erreur: ${errorData.message}`);
          showCustomToast('error', 'Erreur', errorData.message);
        } else if (typeof errorData === 'object') {
          const newFieldErrors: { [key: string]: string } = {};
          Object.keys(errorData).forEach(key => {
            const value = errorData[key];
            newFieldErrors[key] = Array.isArray(value) ? value[0] : value;
          });
          setFieldErrors(newFieldErrors);
          setError('Veuillez corriger les erreurs dans le formulaire');
          showCustomToast('error', 'Erreur de validation', 'Veuillez corriger les erreurs dans le formulaire.');
        } else {
          setError(errorData.message || 'Une erreur est survenue');
          showCustomToast('error', 'Erreur', errorData.message || 'Une erreur est survenue.');
        }
      } else if (err.message) {
        if (err.message.includes('email') || err.message.includes('Email')) {
          setFieldErrors({ email: err.message });
        }
        setError(err.message);
        showCustomToast('error', 'Erreur', err.message);
      } else {
        setError('Une erreur est survenue lors de la mise à jour du profil');
        showCustomToast('error', 'Erreur', 'Une erreur est survenue lors de la mise à jour.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Annulation des modifications
  const handleCancel = () => {
    if (window.confirm('Voulez-vous vraiment annuler les modifications ?')) {
      navigate('/laureats/profil');
    }
  };

  // Affichage du chargement
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <HeaderConnected />
        <main className="flex-grow py-8 px-4 md:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Chargement du profil...</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Affichage de l'erreur (si aucun profil chargé)
  if (error && !profile.email) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <HeaderConnected />
        <main className="flex-grow py-8 px-4 md:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-600">{error}</p>
              <button 
                onClick={() => navigate('/connexion')}
                className="mt-4 text-blue-600 hover:underline"
              >
                Se connecter
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Toaster position="top-right" />
      <HeaderConnected />
      
      <main className="flex-grow py-8 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Modifier mon profil Lauréat</h1>
            <p className="text-gray-600">Mettez à jour vos informations personnelles et professionnelles de lauréat CEEAM.</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 md:p-8">
            {/* Bannière d'erreur globale */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <i className="fas fa-exclamation-circle text-red-500"></i>
                  <p className="text-red-700 font-medium">{error}</p>
                </div>
                {Object.keys(fieldErrors).length > 0 && (
                  <ul className="mt-2 ml-6 text-sm text-red-600 list-disc">
                    {Object.entries(fieldErrors).map(([field, message]) => (
                      <li key={field}><strong>{field}:</strong> {message}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Rectangle bleu pour Changer la photo */}
            <div className="mb-10 pb-8 border-b border-gray-200">
              <div className="bg-blue-100/70 rounded-xl p-6 border-2 border-blue-300 shadow-md">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Changer la photo</h2>
                
                {imageError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {imageError}
                  </div>
                )}
                
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                  <div className="flex-shrink-0 relative">
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-white flex items-center justify-center border-2 border-blue-300">
                      {isUploadingImage ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      ) : profileImage ? (
                        <img 
                          src={profileImage} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-4xl text-gray-400">
                          <i className="fas fa-user-circle"></i>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-grow">
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-medium mb-2">
                        Télécharger une nouvelle photo
                      </label>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        onChange={handleImageUpload}
                        disabled={isUploadingImage}
                        className={`block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition ${isUploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                    </div>
                    <p className="text-sm text-gray-700 font-medium">
                      {isUploadingImage ? 'Upload en cours...' : 'Format recommandé : JPG, PNG (max 5MB)'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Rectangle bleu pour Informations personnelles */}
            <div className="mb-10 pb-8 border-b border-gray-200">
              <div className="bg-blue-100/70 rounded-xl p-6 border-2 border-blue-300 shadow-md">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Informations personnelles</h2>
                <p className="text-gray-700 mb-6 font-medium">Vos informations de base</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Prénom *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={profile.firstName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Nom *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={profile.lastName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={profile.email}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white ${
                        fieldErrors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      required
                    />
                    {fieldErrors.email && (
                      <p className="mt-1 text-sm text-red-600">
                        <i className="fas fa-exclamation-circle mr-1"></i>
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Téléphone *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={profile.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
                      required
                    />
                  </div>
                  
                  {/* Nationalité */}
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">Nationalité</label>
                    {!Array.isArray(countries) || countries.length === 0 ? (
                      <input
                        type="text"
                        value={profile.nationality}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100"
                        placeholder="Chargement des pays..."
                        disabled
                      />
                    ) : (
                      <select
                        value={selectedCountryId ?? ''}
                        onChange={(e) => {
                          const id = e.target.value ? parseInt(e.target.value) : null;
                          setSelectedCountryId(id);
                          const country = countries.find(c => c.id === id);
                          setProfile(prev => ({ ...prev, nationality: country?.name || '' }));
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
                      >
                        <option value="">-- Sélectionner un pays --</option>
                        {countries.map(country => (
                          <option key={country.id} value={country.id}>
                            {country.flag_emoji} {country.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      whatsapp
                    </label>
                    <input
                      type="text"
                      name="whatsapp"
                      value={profile.whatsapp}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Rectangle bleu pour Biographie */}
            <div className="mb-10 pb-8 border-b border-gray-200">
              <div className="bg-blue-100/70 rounded-xl p-6 border-2 border-blue-300 shadow-md">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Biographie</h2>
                
                <textarea
                  name="biography"
                  value={profile.biography}
                  onChange={handleChange}
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
                  placeholder="Décrivez-vous en quelques lignes"
                />
                <div className="flex justify-between mt-2">
                  <p className="text-sm text-gray-700 font-medium">Décrivez-vous en quelques lignes (max 500 caractères)</p>
                  <span className="text-sm text-gray-700 font-medium">{profile.biography.length}/500</span>
                </div>

                {/* Champ Citation / Devise */}
                <div className="mt-6 pt-4 border-t border-blue-200">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Citation / Devise
                  </label>
                  <input
                    type="text"
                    name="quote"
                    value={profile.quote || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
                    placeholder="Ex: L'innovation au service de l'excellence"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Une courte phrase qui vous représente (apparaîtra sous votre nom sur votre profil public)
                  </p>
                </div>
              </div>
            </div>

            {/* Rectangle bleu pour Informations académiques et LinkedIn */}
            <div className="mb-10 pb-8 border-b border-gray-200">
              <div className="bg-blue-100/70 rounded-xl p-6 border-2 border-blue-300 shadow-md">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Informations académiques</h2>
                <p className="text-gray-700 mb-6 font-medium">Votre parcours à l'ENSAM</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Promotion *
                    </label>
                    <input
                      type="text"
                      name="promotion"
                      value={profile.promotion}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
                      required
                    />
                  </div>
                  
                  {/* Filière */}
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">Filière *</label>
                    {!Array.isArray(specialites) || specialites.length === 0 ? (
                      <input
                        type="text"
                        value={profile.field}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100"
                        placeholder="Chargement des filières..."
                        disabled
                      />
                    ) : (
                      <select
                        value={selectedSpecialiteId ?? ''}
                        onChange={(e) => {
                          const id = e.target.value ? parseInt(e.target.value) : null;
                          setSelectedSpecialiteId(id);
                          const spec = specialites.find(s => s.id === id);
                          setProfile(prev => ({ ...prev, field: spec?.intitule || '' }));
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
                      >
                        <option value="">-- Sélectionner une filière --</option>
                        {specialites.map(spec => (
                          <option key={spec.id} value={spec.id}>{spec.intitule}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* LinkedIn */}
                <div className="mt-6 pt-6 border-t-2 border-blue-300">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">LinkedIn</h2>
                  <input
                    type="url"
                    name="linkedin"
                    value={profile.linkedin}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
                    placeholder="linkedin.com/in/votre-profil"
                  />
                  <p className="text-sm text-gray-700 mt-2 font-medium">Votre profil LinkedIn professionnel</p>
                </div>
              </div>
            </div>

            {/* Le reste du formulaire reste identique */}
            {/* ... (la suite du JSX reste inchangée) ... */}
            
            {/* Rectangle bleu pour Emploi actuel */}
            <div className="mb-10 pb-8 border-b border-gray-200">
              <div className="bg-blue-100/70 rounded-xl p-6 border-2 border-blue-300 shadow-md">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Emploi actuel</h2>
                <p className="text-gray-700 mb-6 font-medium">Votre situation professionnelle</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Poste / Titre
                    </label>
                    <input
                      type="text"
                      name="jobTitle"
                      value={profile.jobTitle || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
                      placeholder="Ex: Ingénieur Développement"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Entreprise
                    </label>
                    <input
                      type="text"
                      name="jobCompany"
                      value={profile.jobCompany || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
                      placeholder="Ex: Renault Group"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Ville
                    </label>
                    <input
                      type="text"
                      name="jobCity"
                      value={profile.jobCity || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
                      placeholder="Ex: Paris"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Email professionnel
                    </label>
                    <input
                      type="email"
                      name="jobEmail"
                      value={profile.jobEmail || ''}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white ${
                        fieldErrors.jobEmail ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Ex: nom@entreprise.com"
                    />
                    {fieldErrors.jobEmail && (
                      <p className="mt-1 text-sm text-red-600">
                        <i className="fas fa-exclamation-circle mr-1"></i>
                        {fieldErrors.jobEmail}
                      </p>
                    )}
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Domaine d'activité
                    </label>
                    <input
                      type="text"
                      name="jobDomain"
                      value={profile.jobDomain || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
                      placeholder="Ex: Développement logiciel, IA, Systèmes embarqués"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Rectangle bleu pour Centres d'intérêt */}
            <div className="mb-10 pb-8 border-b border-gray-200">
              <div className="bg-blue-100/70 rounded-xl p-6 border-2 border-blue-300 shadow-md">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Centres d'intérêt</h2>
                <div className="mb-4">
                  <p className="text-gray-700 mb-4 font-medium">Vous possédez des centres d'intérêt :</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {profile.interests.map((interest, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-full"
                      >
                        <span>{interest}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveInterest(interest)}
                          className="text-white hover:text-gray-200"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <input
                    type="text"
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    onKeyDown={handleAddInterest}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
                    placeholder="Ajouter un intérêt..."
                  />
                  <p className="text-sm text-gray-600 mt-2 font-medium">Appuyez sur Entrée pour ajouter un intérêt</p>
                </div>
              </div>
            </div>

            {/* Rectangle orange pour Historique académique et professionnel */}
            <div className="mb-10 pb-8 border-b border-gray-200">
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6 border-2 border-orange-300 shadow-md">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Historique académique et professionnel</h2>
                <p className="text-gray-700 mb-4 font-medium">Ajoutez vos étapes importantes (études, stages, emplois, certifications...)</p>
                
                {/* Liste des éléments d'historique existants */}
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
                      <div
                        key={item.id}
                        className="flex items-start gap-4 p-4 bg-white rounded-lg border border-orange-200 shadow-sm"
                      >
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
                          {item.organization && (
                            <p className="text-sm text-gray-600">{item.organization}{item.location ? `, ${item.location}` : ''}</p>
                          )}
                          {item.description && (
                            <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => item.id && handleRemoveHistorique(item.id)}
                          disabled={historiqueLoading}
                          className="text-red-500 hover:text-red-700 disabled:opacity-50"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    ))
                  )}
                </div>
                
                {/* Formulaire d'ajout professionnel */}
                <div className="bg-white rounded-lg p-4 border border-orange-200">
                  <h4 className="font-medium text-gray-700 mb-3">Ajouter une étape</h4>
                  
                  {/* Ligne 1: Type et titre */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <label className="block text-gray-600 text-xs mb-1">Type *</label>
                      <select
                        value={newHistoriqueEntry.entryType}
                        onChange={(e) => handleHistoriqueFormChange('entryType', e.target.value as HistoriqueEntryType)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                      >
                        {Object.entries(HISTORIQUE_TYPE_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-gray-600 text-xs mb-1">Titre / Intitulé *</label>
                      <input
                        type="text"
                        value={newHistoriqueEntry.title}
                        onChange={(e) => handleHistoriqueFormChange('title', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                        placeholder="Ex: Ingénieur Développement, Master en IA..."
                      />
                    </div>
                  </div>
                  
                  {/* Ligne 2: Organisation et localisation */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-gray-600 text-xs mb-1">Organisation / Entreprise</label>
                      <input
                        type="text"
                        value={newHistoriqueEntry.organization}
                        onChange={(e) => handleHistoriqueFormChange('organization', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                        placeholder="Ex: Renault, ENSAM Casablanca..."
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 text-xs mb-1">Lieu / Ville</label>
                      <input
                        type="text"
                        value={newHistoriqueEntry.location}
                        onChange={(e) => handleHistoriqueFormChange('location', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                        placeholder="Ex: Paris, France"
                      />
                    </div>
                  </div>
                  
                  {/* Ligne 3: Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div>
                      <label className="block text-gray-600 text-xs mb-1">Date de début *</label>
                      <input
                        type="date"
                        value={newHistoriqueEntry.startDate}
                        onChange={(e) => handleHistoriqueFormChange('startDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 text-xs mb-1">Date de fin</label>
                      <input
                        type="date"
                        value={newHistoriqueEntry.endDate || ''}
                        onChange={(e) => handleHistoriqueFormChange('endDate', e.target.value)}
                        disabled={newHistoriqueEntry.isCurrent}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm ${newHistoriqueEntry.isCurrent ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      />
                    </div>
                    <div className="flex items-end pb-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newHistoriqueEntry.isCurrent}
                          onChange={(e) => handleHistoriqueFormChange('isCurrent', e.target.checked)}
                          className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                        />
                        <span className="text-sm text-gray-700">En cours</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Description */}
                  <div className="mb-3">
                    <label className="block text-gray-600 text-xs mb-1">Description (optionnel)</label>
                    <textarea
                      value={newHistoriqueEntry.description}
                      onChange={(e) => handleHistoriqueFormChange('description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                      placeholder="Décrivez brièvement cette expérience..."
                      rows={2}
                    />
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleAddHistorique}
                    disabled={historiqueLoading || !newHistoriqueEntry.title.trim() || !newHistoriqueEntry.startDate}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {historiqueLoading ? (
                      <span className="flex items-center">
                        <i className="fas fa-spinner fa-spin mr-2"></i>Ajout...
                      </span>
                    ) : (
                      <span><i className="fas fa-plus mr-2"></i>Ajouter</span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Rectangle vert pour Mes compétences */}
            <div className="mb-10 pb-8 border-b border-gray-200">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-300 shadow-md">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Mes compétences</h2>
                <p className="text-gray-700 mb-4 font-medium">Organisez vos compétences par catégorie avec leur niveau de maîtrise</p>
                
                {/* Liste des catégories de compétences */}
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
                      <div
                        key={categorie.categoryId}
                        className="p-4 bg-white rounded-lg border border-green-200 shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-bold text-green-700 flex items-center gap-2">
                            {categorie.icon && <i className={`fas ${categorie.icon}`}></i>}
                            {categorie.categorie}
                          </h4>
                          <button
                            type="button"
                            onClick={() => handleRemoveCategorie(categorie.categoryId)}
                            disabled={competencesLoading}
                            className="text-red-500 hover:text-red-700 text-sm disabled:opacity-50"
                          >
                            <i className="fas fa-trash mr-1"></i>Supprimer catégorie
                          </button>
                        </div>
                        
                        {/* Compétences dans cette catégorie */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {categorie.competences.map((competence) => (
                            <div
                              key={competence.id}
                              className="flex items-center gap-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm"
                            >
                              <span>{competence.name}</span>
                              {competence.level && (
                                <span className="text-xs bg-green-600 px-2 py-0.5 rounded-full">
                                  {COMPETENCE_LEVEL_LABELS[competence.level] || competence.level}
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => competence.id && handleRemoveCompetence(competence.id)}
                                disabled={competencesLoading}
                                className="text-white hover:text-gray-200 disabled:opacity-50"
                              >
                                <i className="fas fa-times text-xs"></i>
                              </button>
                            </div>
                          ))}
                        </div>
                        
                        {/* Ajouter une compétence à cette catégorie (inline) */}
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
                
                {/* Formulaire d'ajout de nouvelle compétence */}
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <h4 className="font-medium text-gray-700 mb-3">Ajouter une compétence</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                    {/* Catégorie existante ou nouvelle */}
                    <div>
                      <label className="block text-gray-600 text-xs mb-1">Catégorie</label>
                      <select
                        value={newCompetence.categoryId || ''}
                        onChange={(e) => setNewCompetence({
                          ...newCompetence,
                          categoryId: e.target.value ? parseInt(e.target.value) : null,
                          customCategory: e.target.value ? '' : newCompetence.customCategory
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                      >
                        <option value="">-- Nouvelle catégorie --</option>
                        {availableCategories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                        {competences.filter(c => !availableCategories.find(ac => ac.id === c.categoryId)).map((c) => (
                          <option key={c.categoryId} value={c.categoryId}>{c.categorie}</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Nom de la nouvelle catégorie (si pas de catégorie sélectionnée) */}
                    {!newCompetence.categoryId && (
                      <div>
                        <label className="block text-gray-600 text-xs mb-1">Nom catégorie *</label>
                        <input
                          type="text"
                          value={newCompetence.customCategory}
                          onChange={(e) => setNewCompetence({ ...newCompetence, customCategory: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                          placeholder="Ex: Langages, Soft Skills..."
                        />
                      </div>
                    )}
                    
                    {/* Nom de la compétence */}
                    <div className={newCompetence.categoryId ? 'md:col-span-2' : ''}>
                      <label className="block text-gray-600 text-xs mb-1">Compétence *</label>
                      <input
                        type="text"
                        value={newCompetence.name}
                        onChange={(e) => setNewCompetence({ ...newCompetence, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                        placeholder="Ex: Python, Leadership, CAO..."
                      />
                    </div>
                    
                    {/* Niveau */}
                    <div>
                      <label className="block text-gray-600 text-xs mb-1">Niveau</label>
                      <select
                        value={newCompetence.level}
                        onChange={(e) => setNewCompetence({ ...newCompetence, level: e.target.value as CompetenceLevel })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                      >
                        {Object.entries(COMPETENCE_LEVEL_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleAddCompetence}
                    disabled={competencesLoading || !newCompetence.name.trim() || (!newCompetence.categoryId && !newCompetence.customCategory.trim())}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {competencesLoading ? (
                      <span className="flex items-center">
                        <i className="fas fa-spinner fa-spin mr-2"></i>Ajout...
                      </span>
                    ) : (
                      <span><i className="fas fa-plus mr-2"></i>Ajouter</span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Section Mentorat */}
            <div className="mb-10 pb-8 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Disponibilité Mentorat</h2>
              
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800"></h3>
                      <p className="text-gray-600"></p>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setIsMentorAvailable(!isMentorAvailable)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isMentorAvailable ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isMentorAvailable ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>
                
                <div className="mt-4 pl-16">
                  <p className="text-gray-700">
                    <i className="fas fa-check-circle text-green-500 mr-2"></i>
                    Accepter d'être contacté par les étudiants pour le mentorat ou conseil
                  </p>
                  
                  {isMentorAvailable && (
                    <div className="mt-4 p-4 bg-white rounded-lg border border-blue-100">
                      <h4 className="font-medium text-gray-800 mb-2"></h4>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {mentorshipAreas.map((area, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
                          >
                            <span>{area}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveMentorshipArea(area)}
                              className="text-blue-500 hover:text-blue-700"
                            >
                              <i className="fas fa-times text-xs"></i>
                            </button>
                          </div>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={newMentorshipArea}
                        onChange={(e) => setNewMentorshipArea(e.target.value)}
                        onKeyDown={handleAddMentorshipArea}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        placeholder="Ajouter un domaine..."
                      />
                      <p className="text-xs text-gray-500 mt-1">Appuyez sur Entrée pour ajouter</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Rectangle bleu pour Visibilité du profil */}
            <div className="mb-10 pb-8 border-b border-gray-200">
              <div className="bg-blue-100/70 rounded-xl p-6 border-2 border-blue-300 shadow-md">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Visibilité du profil</h2>
                
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center justify-end mb-4">
                    <button
                      type="button"
                      onClick={() => setIsProfilePublic(!isProfilePublic)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isProfilePublic ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isProfilePublic ? 'translate-x-6' : 'translate-x-1'}`}
                      />
                    </button>
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-gray-700">
                      <i className="fas fa-check-circle text-green-500 mr-2"></i>
                      Rendre votre profil visible dans l'annuaire des lauréats
                    </p>
                    
                    {!isProfilePublic && (
                      <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="text-yellow-700 text-sm">
                          <i className="fas fa-exclamation-triangle mr-2"></i>
                          Votre profil sera invisible pour les autres utilisateurs
                        </p>
                      </div>
                    )}
                    
                    {isProfilePublic && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-green-700 text-sm">
                          <i className="fas fa-check-circle mr-2"></i>
                          Votre profil sera visible dans la liste des lauréats
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-gray-200">
              <div className="flex gap-4 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition w-full sm:w-auto"
                >
                  Annuler
                </button>
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-8 py-3 rounded-lg font-medium transition w-full sm:w-auto ${
                  isSubmitting 
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Enregistrement...
                  </span>
                ) : (
                  'Enregistrer les modifications'
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EditProfileLaureat;