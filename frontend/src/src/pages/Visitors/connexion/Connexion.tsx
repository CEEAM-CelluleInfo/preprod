import { useState, useEffect } from "react";
import { ArrowRight, Mail, Lock, Eye, EyeOff, Check, UserPlus, Loader2, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { toast, Toaster } from "sonner";
import Header from "@/components/layout/Header"; 
import Footer from "@/components/layout/Footer";
import { AuthService } from "@/services/authService";

// Composant d'icône personnalisé pour les toasts
const ToastIcon = ({ type }: { type: 'success' | 'error' | 'warning' }) => {
  const iconClass = "w-5 h-5";
  if (type === 'success') return <CheckCircle className={iconClass} style={{ color: '#15803d' }} />;
  if (type === 'error') return <XCircle className={iconClass} style={{ color: '#dc2626' }} />;
  return <AlertCircle className={iconClass} style={{ color: '#d97706' }} />;
};

const Connexion = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
    showPassword: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contextMessage, setContextMessage] = useState<string | null>(null);

  // URL de redirection après connexion (si l'utilisateur venait d'une page protégée)
  const redirectTo = (location.state as any)?.from || "/dashboard-connected";

  // Si l'utilisateur est déjà connecté, éviter d'afficher la page de connexion.
  useEffect(() => {
    let isMounted = true;

    const redirectIfAuthenticated = async () => {
      const cachedUser = AuthService.getCurrentUser();
      if (cachedUser) {
        navigate(redirectTo, { replace: true });
        return;
      }

      const user = await AuthService.fetchCurrentUser();
      if (user) {
        navigate(redirectTo, { replace: true });
        return;
      }

      if (isMounted) {
        setIsCheckingSession(false);
      }
    };

    redirectIfAuthenticated();

    return () => {
      isMounted = false;
    };
  }, [navigate, redirectTo]);

  // Vérifier si l'utilisateur vient de s'inscrire
  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      toast.custom((t) => (
        <div className="flex items-start gap-3 p-4 rounded-xl shadow-lg" style={{ background: '#fef3c7', border: '2px solid #f59f24' }}>
          <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#15803d' }} />
          <div className="flex-1">
            <p className="font-semibold text-sm" style={{ color: '#166534' }}>Inscription réussie !</p>
            <p className="text-xs mt-0.5" style={{ color: '#15803d' }}>Un email de vérification a été envoyé à votre adresse. Veuillez vérifier votre boîte de réception et cliquer sur le lien pour activer votre compte avant de vous connecter.</p>
          </div>
          <button onClick={() => toast.dismiss(t)} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
      ), { duration: 8000 });
      // Nettoyer l'URL
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

    useEffect(() => {
    const state = (location.state as any) || {};
    const stateMessageType = state.messageType as string | undefined;
    const stateActivityId = state.redirectActivityId as string | undefined;

    if (stateMessageType) {
      localStorage.setItem("loginMessageType", stateMessageType);
    }
    if (stateActivityId) {
      localStorage.setItem("redirectActivityId", stateActivityId);
    }

    const messageType = stateMessageType || localStorage.getItem("loginMessageType") || "default";
    if (messageType === "activity_details") {
      setContextMessage("Connectez-vous pour voir les details de cette activite.");
    } else if (messageType === "event_register") {
      setContextMessage("Connectez-vous pour continuer");
    }
  }, [location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await AuthService.login({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe,
      });

      if (response.user) {
        const storedActivityId = localStorage.getItem("redirectActivityId");
        const isValidActivityId = !!storedActivityId && /^\d+$/.test(storedActivityId);

        toast.custom((t) => (
          <div className="flex items-start gap-3 p-4 rounded-xl shadow-lg" style={{ background: '#fef3c7', border: '2px solid #f59f24' }}>
            <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#15803d' }} />
            <div className="flex-1">
              <p className="font-semibold text-sm" style={{ color: '#166534' }}>Connexion réussie !</p>
              <p className="text-xs mt-0.5" style={{ color: '#15803d' }}>Bienvenue sur votre espace membre CEEAM.</p>
            </div>
            <button onClick={() => toast.dismiss(t)} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>
        ), { duration: 3000 });

        // Connexion réussie, redirection vers la page d'origine ou le dashboard
        if (isValidActivityId) {
          navigate(`/activites/${storedActivityId}`);
        } else {
          navigate(redirectTo);
        }

        localStorage.removeItem("redirectActivityId");
        localStorage.removeItem("loginMessageType");

        navigate(redirectTo);
      } else {
        // Message d'erreur générique pour la sécurité
        const errorMsg = "Identifiants incorrects. Vérifiez votre email et mot de passe.";
        setError(errorMsg);
        toast.custom((t) => (
          <div className="flex items-start gap-3 p-4 rounded-xl shadow-lg" style={{ background: '#fef3c7', border: '2px solid #f59f24' }}>
            <XCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#dc2626' }} />
            <div className="flex-1">
              <p className="font-semibold text-sm" style={{ color: '#991b1b' }}>Erreur de connexion</p>
              <p className="text-xs mt-0.5" style={{ color: '#b91c1c' }}>{errorMsg}</p>
            </div>
            <button onClick={() => toast.dismiss(t)} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>
        ), { duration: 4000 });
      }
    } catch (err: any) {
      console.error("Erreur de connexion:", err);
      const errorResponse = err || {};
      const serverMessage =
        errorResponse.detail ||
        errorResponse.error ||
        (errorResponse.errors?.non_field_errors?.[0] as string) ||
        (typeof errorResponse === 'string' ? errorResponse : '');

      if (serverMessage.toLowerCase().includes("vérifier") || serverMessage.toLowerCase().includes("verify") || serverMessage.toLowerCase().includes("active")) {
        const msg = "Veuillez vérifier votre email avant de vous connecter. Un email de vérification vous a été envoyé lors de votre inscription.";
        setError(msg);
        toast.custom((t) => (
          <div className="flex items-start gap-3 p-4 rounded-xl shadow-lg" style={{ background: '#fef3c7', border: '2px solid #f59f24' }}>
            <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#d97706' }} />
            <div className="flex-1">
              <p className="font-semibold text-sm" style={{ color: '#92400e' }}>Email non vérifié</p>
              <p className="text-xs mt-0.5" style={{ color: '#b45309' }}>{msg}</p>
            </div>
            <button onClick={() => toast.dismiss(t)} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>
        ), { duration: 6000 });
      } else if (serverMessage) {
        setError(serverMessage);
        toast.custom((t) => (
          <div className="flex items-start gap-3 p-4 rounded-xl shadow-lg" style={{ background: '#fef3c7', border: '2px solid #f59f24' }}>
            <XCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#dc2626' }} />
            <div className="flex-1">
              <p className="font-semibold text-sm" style={{ color: '#991b1b' }}>Erreur de connexion</p>
              <p className="text-xs mt-0.5" style={{ color: '#b91c1c' }}>{serverMessage}</p>
            </div>
            <button onClick={() => toast.dismiss(t)} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>
        ), { duration: 4000 });
      } else {
        const msg = "Identifiants incorrects. Vérifiez votre email et mot de passe.";
        setError(msg);
        toast.custom((t) => (
          <div className="flex items-start gap-3 p-4 rounded-xl shadow-lg" style={{ background: '#fef3c7', border: '2px solid #f59f24' }}>
            <XCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#dc2626' }} />
            <div className="flex-1">
              <p className="font-semibold text-sm" style={{ color: '#991b1b' }}>Erreur de connexion</p>
              <p className="text-xs mt-0.5" style={{ color: '#b91c1c' }}>{msg}</p>
            </div>
            <button onClick={() => toast.dismiss(t)} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>
        ), { duration: 4000 });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const benefits = [
    "Accès aux événements exclusifs",
    "Réseau professionnel des alumni",
    "Ressources et formations gratuites",
    "Actualités et opportunités en temps réel",
  ];

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#172d45] mx-auto mb-3" />
          <p className="text-gray-600">Vérification de la session...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Toaster position="top-right" />
      <Header />
      <div className="min-h-screen py-2 px-4" style={{ backgroundColor: '#e5e7eb' }}>
        <div className="max-w-2xl mx-auto space-y-0">
          
          {/* Section 1 - Carte de Connexion */}
          <div className="bg-white rounded-t-3xl shadow-lg p-4">
            {/* Icon */}
            <div className="flex justify-center mb-2">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#172d45' }}>
                <ArrowRight className="w-6 h-6 text-white" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 text-center mb-1">
              Connexion
            </h1>
            <p className="text-gray-600 text-center mb-4 text-base">
              Accédez à votre espace personnel
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              {contextMessage && (
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-700 text-sm text-center">{contextMessage}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                {/* Email Field */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-900 block">
                    Adresse Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="votre@email.com"
                      className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-200 focus:border-gray-300 transition-all placeholder:text-gray-400"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-900 block">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={formData.showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="votre mot de passe"
                      className="w-full pl-9 pr-10 py-2.5 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-200 focus:border-gray-300 transition-all placeholder:text-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, showPassword: !formData.showPassword })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {formData.showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-2">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                  />
                  Se souvenir de moi
                </label>
              </div>

              {/* Lien mot de passe oublié */}
              <div className="text-right mb-2">
                <button
                  type="button"
                  onClick={() => navigate('/mot-de-passe-oublie')}
                  className="text-sm text-gray-600 hover:text-gray-900 hover:underline transition-colors"
                >
                  Mot de passe oublié ?
                </button>
              </div>

              {/* Message d'erreur (garde l'affichage visuel en plus du toast) */}
              {error && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm text-center">{error}</p>
                </div>
              )}

              {/* Bouton Se connecter */}
              <div className="mb-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 text-white font-semibold rounded-lg hover:opacity-90 transition-all text-base flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#172d45' }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Connexion en cours...
                    </>
                  ) : (
                    "Se connecter"
                  )}
                </button>
              </div>

              {/* Register Link */}
              <p className="text-center text-gray-600 text-sm">
                Pas encore membre?{" "}
                <button
                  type="button"
                  onClick={() => navigate('/visiteur/inscription')}
                  className="font-semibold hover:underline"
                  style={{ color: '#172d45' }}
                >
                  S'inscrire
                </button>
              </p>
            </form>
          </div>

          {/* Section 2 - Bienvenue */}
          <div className="bg-gray-100 p-4">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Bienvenue !</h2>
            <p className="text-gray-700 mb-2 text-sm">
              Connectez-vous à votre espace membre CEEAM pour profiter de tous nos services.
            </p>
            <p className="text-sm font-bold text-gray-900 mb-2">
              Votre espace membre vous permet de :
            </p>
            <ul className="space-y-1.5">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                  </div>
                  <span className="text-gray-900 text-sm">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Section 3 - Inscription */}
          <div className="rounded-b-3xl p-4 text-center" style={{ backgroundColor: '#f59f24' }}>
            <div className="flex justify-center mb-2">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-white" strokeWidth={2} />
              </div>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              Nouveau sur CEEAM ?
            </h2>
            <p className="text-white text-sm mb-3">
              Rejoignez notre communauté d'étudiants et bénéficiez de tous nos services exclusifs.
            </p>
            <button
              onClick={() => navigate('/visiteur/inscription')}
              className="w-full py-2.5 bg-white rounded-lg font-semibold hover:bg-gray-50 transition-all shadow-lg text-base"
              style={{ color: '#f59f24' }}
            >
              Créer un compte gratuitement
            </button>
          </div>

        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Connexion;