import { useState } from "react";
import { Mail, ArrowLeft, Loader2, CheckCircle, KeyRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { AuthService } from "@/services/authService";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await AuthService.forgotPassword(email);
      setIsSubmitted(true);
    } catch (err: any) {
      // Message générique pour la sécurité (ne pas révéler si l'email existe)
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div>
        <Header />
        <div
          className="min-h-screen py-12 px-4 flex items-center justify-center"
          style={{ backgroundColor: "#e5e7eb" }}
        >
          <div className="bg-white rounded-3xl shadow-lg p-8 max-w-md w-full text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-green-100">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Email envoyé !
            </h1>
            <p className="text-gray-600 mb-6">
              Si un compte existe avec l'adresse <strong>{email}</strong>, vous recevrez un email avec les instructions pour réinitialiser votre mot de passe.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Vérifiez également votre dossier spam si vous ne recevez pas l'email dans les prochaines minutes.
            </p>
            <button
              onClick={() => navigate("/connexion")}
              className="w-full px-6 py-3 rounded-lg text-white font-medium transition-all hover:opacity-90"
              style={{ backgroundColor: "#172d45" }}
            >
              Retour à la connexion
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div
        className="min-h-screen py-12 px-4 flex items-center justify-center"
        style={{ backgroundColor: "#e5e7eb" }}
      >
        <div className="bg-white rounded-3xl shadow-lg p-8 max-w-md w-full">
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
              Mot de passe oublié ?
            </h1>
            <p className="text-gray-600">
              Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-900 block">
                  Adresse Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    required
                    className="w-full pl-10 pr-4 py-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400"
                  />
                </div>
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
                disabled={isLoading || !email}
                className="w-full py-3 text-white font-semibold rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#172d45" }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  "Envoyer le lien de réinitialisation"
                )}
              </button>

              {/* Back to login */}
              <button
                type="button"
                onClick={() => navigate("/connexion")}
                className="w-full py-3 flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour à la connexion
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ForgotPassword;
