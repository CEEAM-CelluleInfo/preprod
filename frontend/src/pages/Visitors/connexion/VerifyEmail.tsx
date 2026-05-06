import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Loader2, Mail, AlertTriangle, User } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { AuthService } from "@/services/authService";

type VerificationStatus = "loading" | "pending_confirmation" | "activating" | "success" | "error" | "already_verified" | "ignored";

interface AccountInfo {
  first_name: string;
  last_name: string;
  email: string;
  created_at?: string;
}

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<VerificationStatus>("loading");
  const [message, setMessage] = useState("");
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState<boolean>(false); // ✅ nom clair, type explicite

  useEffect(() => {
    const tokenParam = searchParams.get("token");

    if (!tokenParam) {
      setStatus("error");
      setMessage("Aucun token de vérification fourni.");
      return;
    }

    setToken(tokenParam);

    const previewAccount = async () => {
      try {
        const response = await AuthService.previewEmailVerification(tokenParam);

        if (response.already_verified) {
          setStatus("already_verified");
          setMessage(response.message);
        } else if (response.account_info) {
          setAccountInfo(response.account_info);
          setStatus("pending_confirmation");
          setMessage(response.message);
        } else if (response.error) {
          // response, pas err + message renseigné
          setStatus("error");
          setIsExpired(response.expired ?? false);
          setMessage(response.error || "Token invalide ou expiré.");
        }
      } catch (err: any) {
        setStatus("error");
        setIsExpired(err.expired ?? false); // err ici c'est bien le catch
        setMessage(err.error || err.message || "Token invalide ou expiré.");
      }
    };

    previewAccount();
  }, [searchParams]);

  const handleConfirmActivation = async () => {
    if (!token) return;
    setStatus("activating");

    try {
      const response = await AuthService.verifyEmail(token);
      setStatus("success");
      setMessage(response.message || "Votre email a été vérifié avec succès !");
    } catch (err: any) {
      setStatus("error");
      setIsExpired(err.expired ?? false);
      setMessage(err.error || err.message || "Erreur lors de l'activation.");
    }
  };

  const handleIgnore = () => {
    setStatus("ignored");
    setMessage(
      "Vous avez choisi de ne pas activer ce compte. Si quelqu'un a utilisé votre email sans autorisation, vous pouvez ignorer cet email en toute sécurité."
    );
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Chargement...</h1>
            <p className="text-gray-600">Veuillez patienter pendant que nous récupérons les informations.</p>
          </div>
        );

      case "pending_confirmation":
        return (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-amber-100">
                <AlertTriangle className="w-8 h-8 text-amber-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Confirmation requise</h1>
            <p className="text-gray-600 mb-4">
              Un compte a été créé avec votre adresse email. Vérifiez les informations ci-dessous :
            </p>

            {accountInfo && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {accountInfo.first_name} {accountInfo.last_name}
                    </p>
                    <p className="text-sm text-gray-500">{accountInfo.email}</p>
                  </div>
                </div>
              </div>
            )}

            <p className="text-sm text-gray-500 mb-6">
              <strong>Est-ce vous qui avez créé ce compte ?</strong>
              <br />
              Si oui, cliquez sur "C'est bien moi" pour activer votre compte.
              <br />
              Sinon, cliquez sur "Ce n'est pas moi" pour ignorer cette demande.
            </p>

            <div className="space-y-3">
              <button
                onClick={handleConfirmActivation}
                className="w-full px-6 py-3 rounded-lg text-white font-medium transition-all hover:opacity-90"
                style={{ backgroundColor: "#22c55e" }}
              >
                ✓ C'est bien moi - Activer mon compte
              </button>
              <button
                onClick={handleIgnore}
                className="w-full px-6 py-3 rounded-lg border border-red-300 text-red-600 font-medium transition-all hover:bg-red-50"
              >
                ✕ Ce n'est pas moi - Ignorer
              </button>
            </div>
          </div>
        );

      case "activating":
        return (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-blue-100">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Activation en cours...</h1>
            <p className="text-gray-600">Veuillez patienter pendant que nous activons votre compte.</p>
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Email vérifié !</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => navigate("/connexion")}
              className="px-6 py-3 rounded-lg text-white font-medium transition-all hover:opacity-90"
              style={{ backgroundColor: "#172d45" }}
            >
              Se connecter
            </button>
          </div>
        );

      case "already_verified":
        return (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-blue-100">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Déjà vérifié</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => navigate("/connexion")}
              className="px-6 py-3 rounded-lg text-white font-medium transition-all hover:opacity-90"
              style={{ backgroundColor: "#172d45" }}
            >
              Se connecter
            </button>
          </div>
        );

      case "ignored":
        return (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-gray-100">
                <XCircle className="w-8 h-8 text-gray-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Demande ignorée</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-3 rounded-lg text-white font-medium transition-all hover:opacity-90"
              style={{ backgroundColor: "#172d45" }}
            >
              Retour à l'accueil
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Échec de la vérification</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="space-y-3">
              <button
                onClick={() => navigate("/connexion")}
                className="w-full px-6 py-3 rounded-lg text-white font-medium transition-all hover:opacity-90"
                style={{ backgroundColor: "#172d45" }}
              >
                Se connecter
              </button>

              {/* ✅ isExpired est un booléen direct, plus besoin de ?.expired */}
              {isExpired && (
                <button
                  onClick={() => navigate("/resend-verification")}
                  className="w-full px-6 py-3 rounded-lg border border-blue-600 text-blue-600 font-medium transition-all hover:bg-blue-50"
                >
                  Renvoyer l'email de vérification
                </button>
              )}

              <button
                onClick={() => navigate("/visiteur/inscription")}
                className="w-full px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium transition-all hover:bg-gray-50"
              >
                S'inscrire à nouveau
              </button>
            </div>
          </div>
        );
    }
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

export default VerifyEmail;