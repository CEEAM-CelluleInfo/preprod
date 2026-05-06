import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, Loader2, CheckCircle, XCircle, Check, KeyRound } from "lucide-react";
import { toast, Toaster } from "sonner";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { AuthService } from "@/services/authService";

type ResetStatus = "form" | "loading" | "success" | "error";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<ResetStatus>("form");
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
    showPassword: false,
    showConfirmPassword: false,
  });

  // Critères de validation du mot de passe
  const passwordCriteria = [
    { label: "Au moins 8 caractères", test: (p: string) => p.length >= 8 },
    { label: "Une lettre majuscule", test: (p: string) => /[A-Z]/.test(p) },
    { label: "Une lettre minuscule", test: (p: string) => /[a-z]/.test(p) },
    { label: "Un chiffre", test: (p: string) => /[0-9]/.test(p) },
  ];

  const allCriteriaValid = passwordCriteria.every((c) => c.test(formData.password));
  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0;
  const canSubmit = allCriteriaValid && passwordsMatch;

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (!tokenParam) {
      setStatus("error");
      setError("Lien de réinitialisation invalide. Veuillez demander un nouveau lien.");
      toast.custom((t) => (
        <div className="flex items-start gap-3 p-4 rounded-xl shadow-lg" style={{ background: '#fef3c7', border: '2px solid #f59f24' }}>
          <XCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#dc2626' }} />
          <div className="flex-1">
            <p className="font-semibold text-sm" style={{ color: '#991b1b' }}>Lien invalide</p>
            <p className="text-xs mt-0.5" style={{ color: '#b91c1c' }}>Lien de réinitialisation invalide. Veuillez demander un nouveau lien.</p>
          </div>
          <button onClick={() => toast.dismiss(t)} className="text-gray-400 hover:text-gray-600 transition-colors">
            ✕
          </button>
        </div>
      ), { duration: 5000 });
    } else {
      setToken(tokenParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !token) return;

    setStatus("loading");
    setError(null);

    try {
      await AuthService.resetPassword(token, formData.password, formData.confirmPassword);
      setStatus("success");
      toast.custom((t) => (
        <div className="flex items-start gap-3 p-4 rounded-xl shadow-lg" style={{ background: '#fef3c7', border: '2px solid #f59f24' }}>
          <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#15803d' }} />
          <div className="flex-1">
            <p className="font-semibold text-sm" style={{ color: '#166534' }}>Mot de passe réinitialisé !</p>
            <p className="text-xs mt-0.5" style={{ color: '#15803d' }}>Votre mot de passe a été modifié avec succès.</p>
          </div>
          <button onClick={() => toast.dismiss(t)} className="text-gray-400 hover:text-gray-600 transition-colors">
            ✕
          </button>
        </div>
      ), { duration: 5000 });
    } catch (err: any) {
      setStatus("form");
      // Gestion des erreurs de validation
      const errorData = err.data || err;
      if (err.detail?.includes("expiré") || err.detail?.includes("invalide") || errorData.error?.includes("expiré")) {
        const msg = "Ce lien a expiré ou est invalide. Veuillez demander un nouveau lien de réinitialisation.";
        setError(msg);
        toast.custom((t) => (
          <div className="flex items-start gap-3 p-4 rounded-xl shadow-lg" style={{ background: '#fef3c7', border: '2px solid #f59f24' }}>
            <XCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#dc2626' }} />
            <div className="flex-1">
              <p className="font-semibold text-sm" style={{ color: '#991b1b' }}>Lien expiré</p>
              <p className="text-xs mt-0.5" style={{ color: '#b91c1c' }}>{msg}</p>
            </div>
            <button onClick={() => toast.dismiss(t)} className="text-gray-400 hover:text-gray-600 transition-colors">
              ✕
            </button>
          </div>
        ), { duration: 5000 });
      } else if (errorData.new_password) {
        // Erreur de validation du mot de passe depuis Django
        const passwordErrors = Array.isArray(errorData.new_password) 
          ? errorData.new_password.join(' ') 
          : errorData.new_password;
        const msg = passwordErrors || "Le mot de passe ne respecte pas les critères de sécurité.";
        setError(msg);
        toast.custom((t) => (
          <div className="flex items-start gap-3 p-4 rounded-xl shadow-lg" style={{ background: '#fef3c7', border: '2px solid #f59f24' }}>
            <XCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#dc2626' }} />
            <div className="flex-1">
              <p className="font-semibold text-sm" style={{ color: '#991b1b' }}>Mot de passe invalide</p>
              <p className="text-xs mt-0.5" style={{ color: '#b91c1c' }}>{msg}</p>
            </div>
            <button onClick={() => toast.dismiss(t)} className="text-gray-400 hover:text-gray-600 transition-colors">
              ✕
            </button>
          </div>
        ), { duration: 5000 });
      } else if (errorData.password_confirm) {
        const msg = "Les mots de passe ne correspondent pas.";
        setError(msg);
        toast.custom((t) => (
          <div className="flex items-start gap-3 p-4 rounded-xl shadow-lg" style={{ background: '#fef3c7', border: '2px solid #f59f24' }}>
            <XCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#dc2626' }} />
            <div className="flex-1">
              <p className="font-semibold text-sm" style={{ color: '#991b1b' }}>Erreur de confirmation</p>
              <p className="text-xs mt-0.5" style={{ color: '#b91c1c' }}>{msg}</p>
            </div>
            <button onClick={() => toast.dismiss(t)} className="text-gray-400 hover:text-gray-600 transition-colors">
              ✕
            </button>
          </div>
        ), { duration: 5000 });
      } else {
        const msg = "Une erreur est survenue. Veuillez réessayer.";
        setError(msg);
        toast.custom((t) => (
          <div className="flex items-start gap-3 p-4 rounded-xl shadow-lg" style={{ background: '#fef3c7', border: '2px solid #f59f24' }}>
            <XCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#dc2626' }} />
            <div className="flex-1">
              <p className="font-semibold text-sm" style={{ color: '#991b1b' }}>Erreur</p>
              <p className="text-xs mt-0.5" style={{ color: '#b91c1c' }}>{msg}</p>
            </div>
            <button onClick={() => toast.dismiss(t)} className="text-gray-400 hover:text-gray-600 transition-colors">
              ✕
            </button>
          </div>
        ), { duration: 5000 });
      }
    }
  };

  const renderContent = () => {
    switch (status) {
      case "loading":
        return (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-blue-100">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Réinitialisation en cours...
            </h1>
            <p className="text-gray-600">
              Veuillez patienter pendant que nous mettons à jour votre mot de passe.
            </p>
          </div>
        );

      case "success":
        return (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-green-100">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Mot de passe réinitialisé !
            </h1>
            <p className="text-gray-600 mb-6">
              Votre mot de passe a été modifié avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
            </p>
            <button
              onClick={() => navigate("/connexion")}
              className="w-full px-6 py-3 rounded-lg text-white font-medium transition-all hover:opacity-90"
              style={{ backgroundColor: "#172d45" }}
            >
              Se connecter
            </button>
          </div>
        );

      case "error":
        return (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-red-100">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Lien invalide
            </h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              <button
                onClick={() => navigate("/mot-de-passe-oublie")}
                className="w-full px-6 py-3 rounded-lg text-white font-medium transition-all hover:opacity-90"
                style={{ backgroundColor: "#172d45" }}
              >
                Demander un nouveau lien
              </button>
              <button
                onClick={() => navigate("/connexion")}
                className="w-full px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium transition-all hover:bg-gray-50"
              >
                Retour à la connexion
              </button>
            </div>
          </div>
        );

      case "form":
      default:
        return (
          <>
            {/* Header */}
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "#172d45" }}
                >
                  <KeyRound className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Nouveau mot de passe
              </h1>
              <p className="text-gray-600">
                Choisissez un nouveau mot de passe sécurisé pour votre compte.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* Password field */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-900 block">
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={formData.showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Votre nouveau mot de passe"
                      className="w-full pl-10 pr-10 py-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, showPassword: !formData.showPassword })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {formData.showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Password criteria */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-700 mb-2">Le mot de passe doit contenir :</p>
                  <div className="grid grid-cols-2 gap-1">
                    {passwordCriteria.map((criterion, index) => (
                      <div key={index} className="flex items-center gap-1.5">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          criterion.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'
                        }`}>
                          <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                        </div>
                        <span className={`text-xs ${
                          criterion.test(formData.password) ? 'text-green-700' : 'text-gray-500'
                        }`}>
                          {criterion.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Confirm password field */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-900 block">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={formData.showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="Confirmez le mot de passe"
                      className="w-full pl-10 pr-10 py-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, showConfirmPassword: !formData.showConfirmPassword })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {formData.showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {formData.confirmPassword && !passwordsMatch && (
                    <p className="text-red-500 text-xs mt-1">Les mots de passe ne correspondent pas</p>
                  )}
                  {passwordsMatch && (
                    <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Les mots de passe correspondent
                    </p>
                  )}
                </div>

                {/* Error message */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm text-center">{error}</p>
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full py-3 text-white font-semibold rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#172d45" }}
                >
                  Réinitialiser le mot de passe
                </button>
              </div>
            </form>
          </>
        );
    }
  };

  return (
    <div>
      <Toaster position="top-right" />
      <Header />
      <div
        className="min-h-screen py-12 px-4 flex items-center justify-center"
        style={{ backgroundColor: "#e5e7eb" }}
      >
        <div className="bg-white rounded-3xl shadow-lg p-8 max-w-md w-full">
          {renderContent()}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ResetPassword;