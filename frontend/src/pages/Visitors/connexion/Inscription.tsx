import { useState, useEffect } from "react";
import { UserPlus, User, Mail, Phone, GraduationCap, Lock, ChevronDown, Info, Check, Eye, EyeOff, Loader2, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast, Toaster } from "sonner";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { AuthService } from "@/services/authService";
import { API_BASE_URL } from "@/services/api.config";

// Types pour les données de l'API
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

const Inscription = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Données chargées depuis l'API
  const [countries, setCountries] = useState<Country[]>([]);
  const [specialites, setSpecialites] = useState<Specialite[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  // État pour toutes les données du formulaire
  const [formData, setFormData] = useState({
    // Étape 1
    prenom: "",
    nom: "",
    email: "",
    telephone: "",
    // Étape 2
    paysOrigine: "",
    promotion: "",
    specialite: "",
    // Étape 3
    motDePasse: "",
    confirmerMotDePasse: "",
    showPassword: false,
    showConfirmPassword: false,
    acceptConditions: false,
  });

  // Critères de validation du mot de passe
  const passwordCriteria = [
    { label: "Au moins 8 caractères", test: (p: string) => p.length >= 8 },
    { label: "Une lettre majuscule", test: (p: string) => /[A-Z]/.test(p) },
    { label: "Une lettre minuscule", test: (p: string) => /[a-z]/.test(p) },
    { label: "Un chiffre", test: (p: string) => /[0-9]/.test(p) },
  ];

  const allCriteriaValid = passwordCriteria.every((c) => c.test(formData.motDePasse));
  const passwordsMatch = formData.motDePasse === formData.confirmerMotDePasse && formData.confirmerMotDePasse.length > 0;
  const canSubmitStep3 = allCriteriaValid && passwordsMatch && formData.acceptConditions;

  // Charger les pays et spécialités au montage
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);
        const [countriesRes, specialitesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/countries/`),
          fetch(`${API_BASE_URL}/specialites/`)
        ]);
        
        if (countriesRes.ok) {
          const countriesData = await countriesRes.json();
          setCountries(countriesData.results || countriesData);
        }
        
        if (specialitesRes.ok) {
          const specialitesData = await specialitesRes.json();
          setSpecialites(specialitesData.results || specialitesData);
        }
      } catch (err) {
        console.error("Erreur lors du chargement des données:", err);
        toast.custom((t) => (
          <div className="flex items-start gap-3 p-4 rounded-xl shadow-lg" style={{ background: '#fef3c7', border: '2px solid #f59f24' }}>
            <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#d97706' }} />
            <div className="flex-1">
              <p className="font-semibold text-sm" style={{ color: '#92400e' }}>Erreur de chargement</p>
              <p className="text-xs mt-0.5" style={{ color: '#b45309' }}>Impossible de charger les pays et spécialités.</p>
            </div>
            <button onClick={() => toast.dismiss(t)} className="text-gray-400 hover:text-gray-600 transition-colors">
              ✕
            </button>
          </div>
        ), { duration: 4000 });
      } finally {
        setLoadingData(false);
      }
    };
    
    fetchData();
  }, []);

  const handlePromotionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 4) {
      setFormData({ ...formData, promotion: value });
    }
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation des champs de l'étape 1
    if (currentStep === 1) {
      if (!formData.prenom.trim()) {
        toast.custom((t) => (
          <div className="flex items-start gap-3 p-4 rounded-xl shadow-lg" style={{ background: '#fef3c7', border: '2px solid #f59f24' }}>
            <XCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#dc2626' }} />
            <div className="flex-1">
              <p className="font-semibold text-sm" style={{ color: '#991b1b' }}>Prénom requis</p>
              <p className="text-xs mt-0.5" style={{ color: '#b91c1c' }}>Veuillez entrer votre prénom.</p>
            </div>
            <button onClick={() => toast.dismiss(t)} className="text-gray-400 hover:text-gray-600 transition-colors">
              ✕
            </button>
          </div>
        ), { duration: 3000 });
        return;
      }
      if (!formData.nom.trim()) {
        toast.custom((t) => (
          <div className="flex items-start gap-3 p-4 rounded-xl shadow-lg" style={{ background: '#fef3c7', border: '2px solid #f59f24' }}>
            <XCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#dc2626' }} />
            <div className="flex-1">
              <p className="font-semibold text-sm" style={{ color: '#991b1b' }}>Nom requis</p>
              <p className="text-xs mt-0.5" style={{ color: '#b91c1c' }}>Veuillez entrer votre nom.</p>
            </div>
            <button onClick={() => toast.dismiss(t)} className="text-gray-400 hover:text-gray-600 transition-colors">
              ✕
            </button>
          </div>
        ), { duration: 3000 });
        return;
      }
      if (!formData.email.trim()) {
        toast.custom((t) => (
          <div className="flex items-start gap-3 p-4 rounded-xl shadow-lg" style={{ background: '#fef3c7', border: '2px solid #f59f24' }}>
            <XCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#dc2626' }} />
            <div className="flex-1">
              <p className="font-semibold text-sm" style={{ color: '#991b1b' }}>Email requis</p>
              <p className="text-xs mt-0.5" style={{ color: '#b91c1c' }}>Veuillez entrer votre adresse email.</p>
            </div>
            <button onClick={() => toast.dismiss(t)} className="text-gray-400 hover:text-gray-600 transition-colors">
              ✕
            </button>
          </div>
        ), { duration: 3000 });
        return;
      }
      if (!formData.telephone.trim()) {
        toast.custom((t) => (
          <div className="flex items-start gap-3 p-4 rounded-xl shadow-lg" style={{ background: '#fef3c7', border: '2px solid #f59f24' }}>
            <XCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#dc2626' }} />
            <div className="flex-1">
              <p className="font-semibold text-sm" style={{ color: '#991b1b' }}>Téléphone requis</p>
              <p className="text-xs mt-0.5" style={{ color: '#b91c1c' }}>Veuillez entrer votre numéro de téléphone.</p>
            </div>
            <button onClick={() => toast.dismiss(t)} className="text-gray-400 hover:text-gray-600 transition-colors">
              ✕
            </button>
          </div>
        ), { duration: 3000 });
        return;
      }
    }
    
    // Validation des champs de l'étape 2
    if (currentStep === 2) {
      if (!formData.paysOrigine) {
        toast.custom((t) => (
          <div className="flex items-start gap-3 p-4 rounded-xl shadow-lg" style={{ background: '#fef3c7', border: '2px solid #f59f24' }}>
            <XCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#dc2626' }} />
            <div className="flex-1">
              <p className="font-semibold text-sm" style={{ color: '#991b1b' }}>Pays d'origine requis</p>
              <p className="text-xs mt-0.5" style={{ color: '#b91c1c' }}>Veuillez sélectionner votre pays d'origine.</p>
            </div>
            <button onClick={() => toast.dismiss(t)} className="text-gray-400 hover:text-gray-600 transition-colors">
              ✕
            </button>
          </div>
        ), { duration: 3000 });
        return;
      }
      if (!formData.promotion) {
        toast.custom((t) => (
          <div className="flex items-start gap-3 p-4 rounded-xl shadow-lg" style={{ background: '#fef3c7', border: '2px solid #f59f24' }}>
            <XCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#dc2626' }} />
            <div className="flex-1">
              <p className="font-semibold text-sm" style={{ color: '#991b1b' }}>Promotion requise</p>
              <p className="text-xs mt-0.5" style={{ color: '#b91c1c' }}>Veuillez entrer votre année de promotion.</p>
            </div>
            <button onClick={() => toast.dismiss(t)} className="text-gray-400 hover:text-gray-600 transition-colors">
              ✕
            </button>
          </div>
        ), { duration: 3000 });
        return;
      }
      if (!formData.specialite) {
        toast.custom((t) => (
          <div className="flex items-start gap-3 p-4 rounded-xl shadow-lg" style={{ background: '#fef3c7', border: '2px solid #f59f24' }}>
            <XCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#dc2626' }} />
            <div className="flex-1">
              <p className="font-semibold text-sm" style={{ color: '#991b1b' }}>Spécialité requise</p>
              <p className="text-xs mt-0.5" style={{ color: '#b91c1c' }}>Veuillez sélectionner votre spécialité.</p>
            </div>
            <button onClick={() => toast.dismiss(t)} className="text-gray-400 hover:text-gray-600 transition-colors">
              ✕
            </button>
          </div>
        ), { duration: 3000 });
        return;
      }
    }
    
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmitStep3) return;

    setError(null);
    setIsLoading(true);

    try {
      const response = await AuthService.register({
        firstName: formData.prenom,
        lastName: formData.nom,
        email: formData.email,
        password: formData.motDePasse,
        phone: formData.telephone,
        country: formData.paysOrigine ? parseInt(formData.paysOrigine) : undefined,
        promotion: formData.promotion,
        specialiteId: formData.specialite ? parseInt(formData.specialite) : undefined,
      });

      // Cas 1 : compte créé normalement (201)
      if (response.registration_status === 'created') {
        toast.custom((t) => (
          <div className="flex items-start gap-3 p-4 rounded-xl shadow-lg" style={{ background: '#f0fdf4', border: '2px solid #22c55e' }}>
            <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#15803d' }} />
            <div className="flex-1">
              <p className="font-semibold text-sm" style={{ color: '#166534' }}>Inscription réussie !</p>
              <p className="text-xs mt-0.5" style={{ color: '#15803d' }}>
                Un email de vérification vous a été envoyé.
              </p>
            </div>
            <button onClick={() => toast.dismiss(t)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
        ), { duration: 5000 });

        navigate("/connexion?registered=true");
      }

      //  Cas 2 : email existant non vérifié → on informe sans modifier le compte
      if (response.registration_status === 'pending_verification') {
        toast.custom((t) => (
          <div className="flex items-start gap-3 p-4 rounded-xl shadow-lg" style={{ background: '#eff6ff', border: '2px solid #3b82f6' }}>
            <Mail className="w-5 h-5 flex-shrink-0" style={{ color: '#1d4ed8' }} />
            <div className="flex-1">
              <p className="font-semibold text-sm" style={{ color: '#1e40af' }}>Email déjà enregistré</p>
              <p className="text-xs mt-0.5" style={{ color: '#1d4ed8' }}>
                Un compte existe avec cet email mais n'a pas encore été vérifié.
                Un nouveau lien de vérification vous a été envoyé.
              </p>
            </div>
            <button onClick={() => toast.dismiss(t)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
        ), { duration: 6000 });

        // On redirige vers connexion,
        // L'utilisateur doit vérifier son mail, pas recréer un compte
        navigate("/connexion?check_email=true");
        // ou
        // navigate("/resend-verification/connexion?check_email=true");

      }

    } catch (err: any) {
      // ApiError: les données d'erreur sont dans err.data, pas directement sur err
      const errorResponse = err?.data || err;

      if (errorResponse.email) {
        // ✅ Ce cas = email vérifié existant (compte actif)
        const msg = "Un compte actif existe déjà avec cette adresse email.";
        setError(msg);
        toast.custom((t) => (
          <div className="flex items-start gap-3 p-4 rounded-xl shadow-lg" style={{ background: '#fef3c7', border: '2px solid #f59f24' }}>
            <XCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#dc2626' }} />
            <div className="flex-1">
              <p className="font-semibold text-sm" style={{ color: '#991b1b' }}>Email déjà utilisé</p>
              <p className="text-xs mt-0.5" style={{ color: '#b91c1c' }}>{msg}</p>
            </div>
            <button onClick={() => toast.dismiss(t)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
        ), { duration: 4000 });

      } else if (errorResponse.password || errorResponse.password_confirm) {
        const msg = "Le mot de passe ne respecte pas les critères de sécurité requis.";
        setError(msg);
        toast.custom((t) => (
          <div className="flex items-start gap-3 p-4 rounded-xl shadow-lg" style={{ background: '#fef3c7', border: '2px solid #f59f24' }}>
            <XCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#dc2626' }} />
            <div className="flex-1">
              <p className="font-semibold text-sm" style={{ color: '#991b1b' }}>Mot de passe invalide</p>
              <p className="text-xs mt-0.5" style={{ color: '#b91c1c' }}>{msg}</p>
            </div>
            <button onClick={() => toast.dismiss(t)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
        ), { duration: 4000 });

      } else {
        const msg = "Une erreur est survenue lors de l'inscription. Veuillez réessayer.";
        setError(msg);
        toast.custom((t) => (
          <div className="flex items-start gap-3 p-4 rounded-xl shadow-lg" style={{ background: '#fef3c7', border: '2px solid #f59f24' }}>
            <XCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#dc2626' }} />
            <div className="flex-1">
              <p className="font-semibold text-sm" style={{ color: '#991b1b' }}>Erreur d'inscription</p>
              <p className="text-xs mt-0.5" style={{ color: '#b91c1c' }}>{msg}</p>
            </div>
            <button onClick={() => toast.dismiss(t)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
        ), { duration: 4000 });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Toaster position="top-right" />
      <Header />
      <div className="min-h-screen py-2 px-4" style={{ backgroundColor: '#e5e7eb' }}>
        <div className="max-w-2xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-2" style={{ backgroundColor: '#172d45' }}>
              <UserPlus className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              Rejoignez la CEEAM
            </h1>
            <p className="text-gray-700 text-sm">
              Créez votre compte et accédez à tous nos services exclusifs
            </p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-start justify-center w-full max-w-xl mx-auto mb-4 px-4">
            {/* Étape 1 */}
            <div className="flex flex-col items-center">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  currentStep > 1 ? 'bg-green-500' : currentStep === 1 ? '' : 'bg-gray-300'
                }`}
                style={currentStep === 1 ? { backgroundColor: '#172d45' } : {}}
              >
                {currentStep > 1 ? (
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                ) : (
                  <User className={`w-4 h-4 ${currentStep === 1 ? 'text-white' : 'text-gray-600'}`} strokeWidth={2} />
                )}
              </div>
              <span 
                className={`mt-1.5 text-xs text-center font-semibold whitespace-pre-line ${
                  currentStep > 1 ? 'text-green-500' : currentStep === 1 ? '' : 'text-gray-600'
                }`}
                style={currentStep === 1 ? { color: '#172d45' } : {}}
              >
                {"Informations\nPersonnelles"}
              </span>
            </div>
            
            {/* Barre de séparation 1 */}
            <div 
              className="h-0.5 mx-2 mt-5" 
              style={{ 
                width: '60px', 
                backgroundColor: currentStep > 1 ? '#22c55e' : '#d1d5db' 
              }} 
            />

            {/* Étape 2 */}
            <div className="flex flex-col items-center">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  currentStep > 2 ? 'bg-green-500' : currentStep === 2 ? '' : 'bg-gray-300'
                }`}
                style={currentStep === 2 ? { backgroundColor: '#172d45' } : {}}
              >
                {currentStep > 2 ? (
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                ) : (
                  <GraduationCap className={`w-4 h-4 ${currentStep === 2 ? 'text-white' : 'text-gray-600'}`} strokeWidth={2} />
                )}
              </div>
              <span 
                className={`mt-1.5 text-xs text-center font-semibold whitespace-pre-line ${
                  currentStep > 2 ? 'text-green-500' : currentStep === 2 ? '' : 'text-gray-600'
                }`}
                style={currentStep === 2 ? { color: '#172d45' } : {}}
              >
                {"Informations\nAcadémiques"}
              </span>
            </div>
            
            {/* Barre de séparation 2 */}
            <div 
              className="h-0.5 mx-2 mt-5" 
              style={{ 
                width: '60px', 
                backgroundColor: currentStep > 2 ? '#22c55e' : '#d1d5db' 
              }} 
            />

            {/* Étape 3 */}
            <div className="flex flex-col items-center">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  currentStep === 3 ? '' : 'bg-gray-300'
                }`}
                style={currentStep === 3 ? { backgroundColor: '#172d45' } : {}}
              >
                <Lock className={`w-4 h-4 ${currentStep === 3 ? 'text-white' : 'text-gray-600'}`} strokeWidth={2} />
              </div>
              <span 
                className={`mt-1.5 text-xs text-center font-semibold ${
                  currentStep === 3 ? '' : 'text-gray-600'
                }`}
                style={currentStep === 3 ? { color: '#172d45' } : {}}
              >
                Sécurité
              </span>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-lg p-4 max-w-xl mx-auto">
            
            {/* ÉTAPE 1 - Informations Personnelles */}
            {currentStep === 1 && (
              <form onSubmit={handleNextStep} className="space-y-3">
                
                {/* Prénom */}
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-900 block">Prénom</label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      name="prenom"
                      placeholder="Votre prénom"
                      value={formData.prenom}
                      onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-200 focus:border-gray-300 transition-all placeholder:text-gray-400"
                      required
                    />
                  </div>
                </div>

                {/* Nom */}
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-900 block">Nom</label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      name="nom"
                      placeholder="Votre nom"
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-200 focus:border-gray-300 transition-all placeholder:text-gray-400"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-900 block">Adresse Email</label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      placeholder="votre@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-200 focus:border-gray-300 transition-all placeholder:text-gray-400"
                      required
                    />
                  </div>
                </div>

                {/* Téléphone */}
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-900 block">Téléphone</label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      name="telephone"
                      placeholder="+212 6 19 94 48 95"
                      value={formData.telephone}
                      onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-200 focus:border-gray-300 transition-all placeholder:text-gray-400"
                      required
                    />
                  </div>
                </div>

                {/* Button */}
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex justify-end">
                    <button 
                      type="submit" 
                      className="px-6 py-2.5 text-white font-semibold rounded-lg hover:opacity-90 transition-all text-sm"
                      style={{ backgroundColor: '#172d45' }}
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* ÉTAPE 2 - Informations Académiques */}
            {currentStep === 2 && (
              <form onSubmit={handleNextStep} className="space-y-3">
                
                {/* Pays d'origine */}
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-900 block">Pays d'origine</label>
                  <div className="relative">
                    <select
                      value={formData.paysOrigine}
                      onChange={(e) => setFormData({ ...formData, paysOrigine: e.target.value })}
                      className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2.5 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-200 cursor-pointer"
                      disabled={loadingData}
                    >
                      <option value="">
                        {loadingData ? "Chargement..." : "Sélectionner votre pays d'origine"}
                      </option>
                      {countries.map((country) => (
                        <option key={country.id} value={country.id}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Promotion */}
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-900 block">Promotion</label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formData.promotion}
                      onChange={handlePromotionChange}
                      placeholder="2028"
                      maxLength={4}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-200 placeholder:text-gray-400"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Entrez l'année de promotion (4 chiffres)</p>
                </div>

                {/* Spécialité */}
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-900 block">Spécialité</label>
                  <div className="relative">
                    <select
                      value={formData.specialite}
                      onChange={(e) => setFormData({ ...formData, specialite: e.target.value })}
                      className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2.5 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-200 cursor-pointer"
                      disabled={loadingData}
                    >
                      <option value="">
                        {loadingData ? "Chargement..." : "Sélectionner votre Spécialité"}
                      </option>
                      {specialites.map((spec) => (
                        <option key={spec.id} value={spec.id}>
                          {spec.code} - {spec.intitule}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Info Message */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-900">
                    Ces informations nous permettent de personnaliser votre expérience et de vous connecter avec d'autres membres de votre promotion.
                  </p>
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-3 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handlePreviousStep}
                    className="px-4 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Précédent
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 text-white font-semibold rounded-lg hover:opacity-90 transition-all text-sm"
                    style={{ backgroundColor: '#172d45' }}
                  >
                    Suivant
                  </button>
                </div>
              </form>
            )}

            {/* ÉTAPE 3 - Sécurité */}
            {currentStep === 3 && (
              <form onSubmit={handleFinalSubmit} className="space-y-3">
                
                {/* Mot de passe */}
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-900 block">Mot de passe</label>
                  <div className="relative">
                    <input
                      type={formData.showPassword ? "text" : "password"}
                      value={formData.motDePasse}
                      onChange={(e) => setFormData({ ...formData, motDePasse: e.target.value })}
                      placeholder="Votre mot de passe"
                      className="w-full px-3 py-2.5 pr-10 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-200 transition-all placeholder:text-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, showPassword: !formData.showPassword })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {formData.showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Critères du mot de passe */}
                  <div className="bg-gray-50 rounded-lg p-2.5 mt-1.5">
                    <ul className="space-y-1">
                      {passwordCriteria.map((criteria, index) => {
                        const isValid = criteria.test(formData.motDePasse);
                        return (
                          <li key={index} className="flex items-center text-xs">
                            <span className={`w-1.5 h-1.5 rounded-full mr-2 ${isValid ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className={isValid ? 'text-green-600' : 'text-red-600'}>{criteria.label}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>

                {/* Confirmer mot de passe */}
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-900 block">Confirmer le mot de passe</label>
                  <div className="relative">
                    <input
                      type={formData.showConfirmPassword ? "text" : "password"}
                      value={formData.confirmerMotDePasse}
                      onChange={(e) => setFormData({ ...formData, confirmerMotDePasse: e.target.value })}
                      placeholder="Confirmez votre mot de passe"
                      className="w-full px-3 py-2.5 pr-10 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-200 transition-all placeholder:text-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, showConfirmPassword: !formData.showConfirmPassword })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {formData.showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {formData.confirmerMotDePasse.length > 0 && !passwordsMatch && (
                    <p className="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas</p>
                  )}
                </div>

                {/* Checkbox conditions */}
                <div className="flex items-start gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={formData.acceptConditions}
                    onChange={(e) => setFormData({ ...formData, acceptConditions: e.target.checked })}
                    className="mt-0.5 w-4 h-4 rounded border-gray-300 cursor-pointer"
                    style={{ accentColor: '#172d45' }}
                  />
                  <label htmlFor="terms" className="text-xs text-gray-700 cursor-pointer">
                    J'accepte les{" "}
                    <a href="#" className="font-semibold hover:underline" style={{ color: '#172d45' }}>
                      conditions d'utilisation
                    </a>
                    {" "}et la{" "}
                    <a href="#" className="font-semibold hover:underline" style={{ color: '#172d45' }}>
                      politique de confidentialité
                    </a>
                  </label>
                </div>

                {/* Message d'erreur (gardé pour l'affichage visuel) */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm text-center">{error}</p>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-3 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handlePreviousStep}
                    disabled={isLoading}
                    className="px-4 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Précédent
                  </button>
                  <button
                    type="submit"
                    disabled={!canSubmitStep3 || isLoading}
                    className={`px-6 py-2.5 rounded-lg text-white font-semibold text-sm transition-all flex items-center gap-2 ${
                      canSubmitStep3 && !isLoading ? 'bg-green-500 hover:opacity-90 cursor-pointer' : 'bg-gray-300 cursor-not-allowed'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Création en cours...
                      </>
                    ) : (
                      "Créer votre compte"
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Login Link */}
            <div className="text-center mt-3 pt-3">
              <p className="text-gray-700 text-sm">
                Vous avez déjà un compte ?{" "}
                <button
                  onClick={() => navigate('/connexion')}
                  className="font-semibold hover:underline"
                  style={{ color: '#172d45' }}
                >
                  Se connecter
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Inscription;