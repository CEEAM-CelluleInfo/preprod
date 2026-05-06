import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { LaureatsService } from "@/services/laureatsService";
import { AuthService } from "@/services/authService";

interface JoinForm {
  nom: string;
  promotion: string;
  specialite: string;
  poste: string;
  entreprise: string;
  ville: string;
  pays: string;
  contact: string;
}

const getSpecialiteLabel = (user: any) => user?.specialite_intitule || user?.specialite || "";

const initialForm: JoinForm = {
  nom: "",
  promotion: "",
  specialite: "",
  poste: "",
  entreprise: "",
  ville: "",
  pays: "",
  contact: "",
};

const RejoindreLaureats = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<JoinForm>(initialForm);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      const user = AuthService.getCurrentUser() || await AuthService.fetchCurrentUser();
      if (!user) {
        setIsCheckingAuth(false);
        navigate("/connexion", {
          replace: true,
          state: {
            from: "/laureats/rejoindre",
            messageType: "event_register",
          },
        });
        return;
      }

      setForm((prev) => ({
        ...prev,
        nom: prev.nom || `${user.first_name || ""} ${user.last_name || ""}`.trim(),
        promotion: prev.promotion || user.promotion || "",
        specialite: prev.specialite || getSpecialiteLabel(user),
        contact: prev.contact || user.email || "",
      }));

      setIsCheckingAuth(false);
    };

    checkAccess();
  }, [navigate]);

  const onChange = (field: keyof JoinForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await LaureatsService.rejoindreAnnuaire(form);
      setMessage(response.message);
      setForm(initialForm);
    } catch (err: any) {
      if (err?.status === 401) {
        setError("Vous devez vous connecter pour soumettre cette demande.");
      } else if (err?.status === 409) {
        setError("Une demande est deja en attente pour ce contact.");
      } else {
        setError("Impossible d'envoyer la demande pour le moment.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-600">
        Verification de la session...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-10">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-md p-6 md:p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Rejoindre l'annuaire</h1>
          <p className="text-gray-600 mb-6">
            Soumettez votre profil. Votre demande sera verifiee par l'equipe CEEAM.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Les champs sont pre-remplis depuis votre compte quand possible. Seuls le nom et l'email de contact sont indispensables.
          </p>

          {message && <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-3 text-green-700">{message}</div>}
          {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-red-700">{error}</div>}

          <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
            <input className="border rounded-lg p-3" placeholder="Nom complet" value={form.nom} onChange={(e) => onChange("nom", e.target.value)} required maxLength={100} />
            <input className="border rounded-lg p-3" placeholder="Promotion (optionnel)" value={form.promotion} onChange={(e) => onChange("promotion", e.target.value)} maxLength={20} />
            <input className="border rounded-lg p-3" placeholder="Specialite (optionnel)" value={form.specialite} onChange={(e) => onChange("specialite", e.target.value)} maxLength={200} />
            <input className="border rounded-lg p-3" placeholder="Poste (optionnel)" value={form.poste} onChange={(e) => onChange("poste", e.target.value)} maxLength={150} />
            <input className="border rounded-lg p-3" placeholder="Entreprise (optionnel)" value={form.entreprise} onChange={(e) => onChange("entreprise", e.target.value)} maxLength={150} />
            <input className="border rounded-lg p-3" placeholder="Ville (optionnel)" value={form.ville} onChange={(e) => onChange("ville", e.target.value)} maxLength={100} />
            <input className="border rounded-lg p-3" placeholder="Pays (optionnel)" value={form.pays} onChange={(e) => onChange("pays", e.target.value)} maxLength={100} />
            <input className="border rounded-lg p-3" type="email" placeholder="Email de contact" value={form.contact} onChange={(e) => onChange("contact", e.target.value)} required />

            <div className="md:col-span-2 flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-800 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-900 disabled:opacity-60"
              >
                {isLoading ? "Envoi..." : "Soumettre ma demande"}
              </button>
              <button
                type="button"
                className="px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-50"
                onClick={() => navigate("/laureats")}
              >
                Retour
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RejoindreLaureats;
