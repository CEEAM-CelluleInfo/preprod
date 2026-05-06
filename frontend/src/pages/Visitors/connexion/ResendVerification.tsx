import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import { Mail, Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { AuthService } from "@/services/authService";

type PageStatus = "idle" | "loading" | "success" | "error";

const ResendVerification = () => {
  const [searchParams] = useSearchParams();
  const isFromRegistration = searchParams.get("check_email") === "true"; 
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<PageStatus>("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    if (!email.trim()) return;

    setStatus("loading");

    try {
      const response = await AuthService.resendVerificationEmail(email.trim());
      setStatus("success");
      // Le backend retourne toujours le même message pour des raisons de sécurité
      setMessage(
        response.message ||
          "Si cet email existe, un nouveau lien de vérification vous a été envoyé."
      );
    } catch (err: any) {
      setStatus("error");
      setMessage(err.error || err.message || "Une erreur est survenue. Veuillez réessayer.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSubmit();
  };

  const renderContent = () => {
    if (status === "success") {
      return (
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center bg-green-100">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Email envoyé !</h1>
          <p className="text-gray-600 mb-2">{message}</p>
          <p className="text-sm text-gray-400 mb-6">
            Pensez à vérifier vos spams. Le lien est valable <strong>15 minutes</strong>.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate("/connexion")}
              className="w-full px-6 py-3 rounded-lg text-white font-medium transition-all hover:opacity-90"
              style={{ backgroundColor: "#172d45" }}
            >
              Se connecter
            </button>
            <button
              onClick={() => {
                setStatus("idle");
                setEmail("");
                setMessage("");
              }}
              className="w-full px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium transition-all hover:bg-gray-50"
            >
              Renvoyer à un autre email
            </button>
          </div>
        </div>
      );
    }

    return (
      <div>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>

        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center bg-blue-100">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Renvoyer l'email de vérification
          </h1>
          {/* ✅ Message contextuel selon l'origine */}
          {isFromRegistration ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4 text-left">
              <p className="text-sm font-semibold text-amber-800">Un compte existe déjà avec cet email</p>
              <p className="text-xs text-amber-700 mt-1">
                Votre compte n'a pas encore été activé. Entrez votre email pour recevoir un nouveau lien de vérification.
              </p>
            </div>
          ) : (
            <p className="text-gray-600">
              Entrez votre adresse email pour recevoir un nouveau lien de vérification.
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adresse email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="votre@email.com"
              disabled={status === "loading"}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 transition"
            />
          </div>

          {/* Message d'erreur */}
          {status === "error" && (
            <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
              {message}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={status === "loading" || !email.trim()}
            className="w-full px-6 py-3 rounded-lg text-white font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ backgroundColor: "#172d45" }}
          >
            {status === "loading" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              "Envoyer le lien"
            )}
          </button>

          <p className="text-xs text-gray-400 text-center">
            Pour des raisons de sécurité, nous envoyons un email même si l'adresse n'est pas reconnue.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div>
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

export default ResendVerification;