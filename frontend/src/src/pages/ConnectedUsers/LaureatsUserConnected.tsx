import { useState, useEffect } from "react";
import HeaderConnected from "@/components/layout/HeaderConnected";
import Footer from "@/components/layout/Footer";
import LaureatCard from "@/components/laureatDetail/LaureatCard";      
import { ChevronLeft, ChevronRight } from "lucide-react";
import { laureatsData as fallbackData } from "@/data/laureatsData";
import { useNavigate } from "react-router-dom";
import { getAbsoluteMediaUrl } from "@/lib/utils";
import { LaureatsService } from "@/services/laureatsService";
import { AuthService } from "@/services/authService";

// Interface pour un lauréat (identique à l’existant)
interface Laureat {
  id: number;
  name: string;
  speciality: string;
  company: string;
  promo: string;
  location: string;
  country?: string;
  position?: string;
  photo?: string;
}

interface JoinFormData {
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

const LaureatsUserConnected = () => {
  const navigate = useNavigate();
  
  // États pour les données
  const [laureats, setLaureats] = useState<Laureat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // États pour les filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [promotions, setPromotions] = useState<string[]>(['Toutes les promos']);
  const [specialities, setSpecialities] = useState<string[]>(['Toutes les spécialités']);
  const [selectedPromotion, setSelectedPromotion] = useState("Toutes les promos");
  const [selectedSpeciality, setSelectedSpeciality] = useState("Toutes les spécialités");
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredLaureats, setFilteredLaureats] = useState<Laureat[]>([]);
  const [paginatedLaureats, setPaginatedLaureats] = useState<Laureat[]>([]);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [isCurrentUserLaureat, setIsCurrentUserLaureat] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinForm, setJoinForm] = useState<JoinFormData>({
    nom: "",
    promotion: "",
    specialite: "",
    poste: "",
    entreprise: "",
    ville: "",
    pays: "",
    contact: "",
  });
  
  // Statistiques (venant de l’API)
  const [stats, setStats] = useState({ totalLaureats: 0, totalCompanies: 0, totalCountries: 0, employmentRate: 95 });

  const itemsPerPage = 6;

  useEffect(() => {
    const preloadJoinForm = async () => {
      const user = AuthService.getCurrentUser() || await AuthService.fetchCurrentUser();
      if (!user) return;

      setIsCurrentUserLaureat(user.role === 'laureat');

      if (user.role === 'laureat') {
        setShowJoinForm(false);
        return;
      }

      setJoinForm((prev) => ({
        ...prev,
        nom: prev.nom || `${user.first_name || ""} ${user.last_name || ""}`.trim(),
        promotion: prev.promotion || user.promotion || "",
        specialite: prev.specialite || getSpecialiteLabel(user),
        contact: prev.contact || user.email || "",
      }));
    };

    preloadJoinForm();
  }, []);

  // Récupération des données depuis le backend
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // 1. Récupération des statistiques
        const statsRes = await fetch('/api/laureats/stats/', { credentials: 'include' });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats({
            totalLaureats: statsData.totalLaureats,
            totalCompanies: statsData.totalCompanies,
            totalCountries: statsData.totalCountries,
            employmentRate: statsData.employmentRate,
          });
        }

        // 2. Récupération des options de filtres
        const filtersRes = await fetch('/api/laureats/filters/', { credentials: 'include' });
        if (filtersRes.ok) {
          const filtersData = await filtersRes.json();
          setPromotions(filtersData.promotions || ['Toutes les promos']);
          setSpecialities(filtersData.specialities || ['Toutes les spécialités']);
        }

        // 3. Récupération de la liste complète des lauréats publics
        //    (on prend un grand nombre pour avoir tous les résultats)
        const laureatsRes = await fetch('/api/laureats/?limit=1000', { credentials: 'include' });
        if (laureatsRes.ok) {
          const data = await laureatsRes.json();
          const results = data.results || [];
          const mapped = results.map((l: any) => ({
            id: l.id,
            name: l.name || `${l.prenom} ${l.nom}`,
            speciality: l.specialite || '',
            company: l.entreprise || '',
            promo: l.promotion || '',
            location: l.localisation || '',
            country: l.country || '',
            position: l.position || '',
            photo: getAbsoluteMediaUrl(l.photoUrl)
          }));
          setLaureats(mapped);
        } else {
          // Fallback en cas d’échec de l’API (données mockées)
          console.warn('API lauréats non disponible, utilisation des données de fallback');
          setLaureats(fallbackData);
        }
      } catch (err) {
        console.error('Erreur chargement lauréats:', err);
        setError('Impossible de charger les données');
        setLaureats(fallbackData);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Filtrer les lauréats quand les filtres changent (client‑side)
  useEffect(() => {
    const filtered = laureats.filter((laureat) => {
      const matchesSearch = searchTerm === "" || 
        laureat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        laureat.speciality.toLowerCase().includes(searchTerm.toLowerCase()) ||
        laureat.company.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPromotion = selectedPromotion === "Toutes les promos" || 
        laureat.promo === selectedPromotion;
      
      const matchesSpeciality = selectedSpeciality === "Toutes les spécialités" || 
        laureat.speciality === selectedSpeciality;
      
      return matchesSearch && matchesPromotion && matchesSpeciality;
    });

    setFilteredLaureats(filtered);
    setCurrentPage(1);
  }, [searchTerm, selectedPromotion, selectedSpeciality, laureats]);

  // Pagination client‑side
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedLaureats(filteredLaureats.slice(startIndex, endIndex));
  }, [filteredLaureats, currentPage]);

  const totalPages = Math.ceil(filteredLaureats.length / itemsPerPage);

  const handleViewProfile = (laureat: Laureat) => {
    navigate(`/laureat-details/${laureat.id}`);
  };

  const handleJoinChange = (field: keyof JoinFormData, value: string) => {
    setJoinForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleJoinSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setJoinLoading(true);
    setJoinError(null);
    setJoinSuccess(null);

    try {
      const response = await LaureatsService.rejoindreAnnuaire(joinForm);
      setJoinSuccess(response.message);
      setJoinForm({
        nom: "",
        promotion: "",
        specialite: "",
        poste: "",
        entreprise: "",
        ville: "",
        pays: "",
        contact: "",
      });
    } catch (err: any) {
      if (err?.status === 401) {
        setJoinError("Vous devez etre connecte pour soumettre cette demande.");
      } else if (err?.status === 409) {
        setJoinError("Une demande est deja en attente pour ce contact.");
      } else {
        setJoinError("Impossible de soumettre la demande pour le moment.");
      }
    } finally {
      setJoinLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <HeaderConnected />

      <main className="flex-1">
        {/* Bannière */}
        <div className="bg-blue-800 flex flex-col items-center justify-center p-6 pb-16 space-y-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="72" height="72" fill="none" stroke="#fbf8f8" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0zM22 10v6"/>
            <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>
          </svg>
          <h1 className="text-5xl font-bold text-center text-white">Annuaire des Lauréats</h1>
          <h2 className="text-white">Retrouvez nos anciens etudiants et restez connecter</h2>
        </div>

        {/* Cartes statistiques */}
        <div className="flex flex-col space-y-6 items-center justify-center pb-6 -mt-8 bg-gray-100" >
          <div className="flex flex-row gap-16 relative z-10">
            <div className="bg-white shadow-lg rounded-2xl p-6 w-48 h-28 flex flex-col items-center justify-center text-center">
              <h1 className="text-2xl">👥</h1>
              <h2 className="text-2xl font-semibold">{stats.totalLaureats}+</h2>
              <h2 className="text-lg">Lauréats</h2>
            </div>
            <div className="bg-white shadow-lg rounded-2xl p-6 w-48 h-28 flex flex-col items-center justify-center text-center">
              <h1 className="text-2xl">🏢</h1>
              <h2 className="text-2xl font-semibold">{stats.totalCompanies}+</h2>
              <h2 className="text-lg">Entreprises</h2>
            </div>
          </div>
          <div className="flex flex-row gap-16"> 
            <div className="bg-white shadow-lg rounded-2xl p-6 w-48 h-28 flex flex-col items-center justify-center text-center">
              <h1 className="text-2xl">🌍</h1>
              <h2 className="text-2xl font-semibold">{stats.totalCountries}+</h2>
              <h2 className="text-lg">Pays</h2>
            </div>
            <div className="bg-white shadow-lg rounded-2xl p-6 w-48 h-28 flex flex-col items-center justify-center text-center">
              <h1 className="text-2xl">📈</h1>
              <h2 className="text-2xl font-semibold">{stats.employmentRate}%</h2>
              <h2 className="text-lg">Taux d'emploi</h2>
            </div>
          </div>
        </div>
        
        {/* Filtres */}
        <section className="container bg-gray-100 pb-6">
          <div className="p-4 space-y-2 bg-white rounded-lg shadow-md flex flex-col gap-2">
            <input
              type="text"
              placeholder="Recherche par nom, spécialité ou entreprise"
              className="w-full p-1 border rounded-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex flex-col w-full gap-2">
                <div className="flex flex-row gap-2">
                  <img src="trophy.png" alt="Promotion icon" height={14} width={14}/>
                  <p className="text-xs">Promotion</p>
                </div>
                <select 
                  className="p-1 border rounded-lg w-full"
                  value={selectedPromotion}
                  onChange={(e) => setSelectedPromotion(e.target.value)}
                >
                  {promotions.map((promo) => (
                    <option key={promo} value={promo}>{promo}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col w-full gap-2">
                <div className="flex flex-row gap-2">
                  <img src="trophy.png" alt="Promotion icon" height={14} width={14}/>
                  <p className="text-xs">Specialites</p>
                </div>
                <select 
                  className="p-1 border rounded-lg w-full"
                  value={selectedSpeciality}
                  onChange={(e) => setSelectedSpeciality(e.target.value)}
                >
                  {specialities.map((spec) => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Liste des cartes */}
        <section className="container bg-gray-100 pb-16">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Chargement des lauréats...</span>
            </div>
          ) : error && laureats.length === 0 ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-600">{error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedLaureats.map((laureat) => (
                <LaureatCard 
                  key={laureat.id} 
                  laureat={laureat}
                  onViewProfile={handleViewProfile}
                />
              ))}
            </div>
          )}
        </section>

        {/* Pagination (deux blocs – à conserver tels quels) */}
        {filteredLaureats.length > 0 && (
          <div className="flex items-center justify-center gap-2 py-8">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
            >
              Précédent
            </button>
            
            <span className="px-4">
              Page {currentPage} sur {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        )}
        
        <div className="flex items-center justify-center gap-2 m-6">
          <button
            className="p-1 text-primary disabled:opacity-30"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={20} />
          </button>

          {Array.from({ length: Math.min(4, totalPages) }).map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full ${
                index + 1 === currentPage ? "bg-blue-800" : "bg-primary"
              }`}
              onClick={() => setCurrentPage(index + 1)}
            />
          ))}

          <button
            className="p-1 text-primary disabled:opacity-30"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {!isCurrentUserLaureat && (
          <section className="bg-blue-800 py-16 text-center text-white">
            <h2 className="text-3xl font-bold mb-2">Vous êtes lauréat ?</h2>
            <p className="mb-6">
              Rejoignez notre annuaire et restez connecté avec la communauté CEEAM
            </p>
            <p className="text-sm opacity-90 mb-6">
              Les informations de base sont pre-remplies depuis votre compte. Les champs professionnels sont facultatifs.
            </p>

            <div className="max-w-3xl mx-auto px-4">
              {joinSuccess && (
                <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-3 text-green-700">
                  {joinSuccess}
                </div>
              )}
              {joinError && (
                <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-red-700">
                  {joinError}
                </div>
              )}

              {!showJoinForm ? (
                <button
                  type="button"
                  onClick={() => setShowJoinForm(true)}
                  className="bg-white text-blue-800 px-6 py-3 rounded-lg font-semibold"
                >
                  Rejoindre l'annuaire
                </button>
              ) : (
                <form onSubmit={handleJoinSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white rounded-xl p-4 text-left">
                  <input
                    className="border rounded-lg p-2 text-gray-900"
                    placeholder="Nom complet"
                    value={joinForm.nom}
                    onChange={(e) => handleJoinChange("nom", e.target.value)}
                    required
                    maxLength={100}
                  />
                  <input
                    className="border rounded-lg p-2 text-gray-900"
                    placeholder="Promotion (optionnel)"
                    value={joinForm.promotion}
                    onChange={(e) => handleJoinChange("promotion", e.target.value)}
                    maxLength={20}
                  />
                  <input
                    className="border rounded-lg p-2 text-gray-900"
                    placeholder="Specialite (optionnel)"
                    value={joinForm.specialite}
                    onChange={(e) => handleJoinChange("specialite", e.target.value)}
                    maxLength={200}
                  />
                  <input
                    className="border rounded-lg p-2 text-gray-900"
                    placeholder="Poste (optionnel)"
                    value={joinForm.poste}
                    onChange={(e) => handleJoinChange("poste", e.target.value)}
                    maxLength={150}
                  />
                  <input
                    className="border rounded-lg p-2 text-gray-900"
                    placeholder="Entreprise (optionnel)"
                    value={joinForm.entreprise}
                    onChange={(e) => handleJoinChange("entreprise", e.target.value)}
                    maxLength={150}
                  />
                  <input
                    className="border rounded-lg p-2 text-gray-900"
                    placeholder="Ville (optionnel)"
                    value={joinForm.ville}
                    onChange={(e) => handleJoinChange("ville", e.target.value)}
                    maxLength={100}
                  />
                  <input
                    className="border rounded-lg p-2 text-gray-900"
                    placeholder="Pays (optionnel)"
                    value={joinForm.pays}
                    onChange={(e) => handleJoinChange("pays", e.target.value)}
                    maxLength={100}
                  />
                  <input
                    type="email"
                    className="border rounded-lg p-2 text-gray-900"
                    placeholder="Email de contact"
                    value={joinForm.contact}
                    onChange={(e) => handleJoinChange("contact", e.target.value)}
                    required
                  />

                  <div className="md:col-span-2 flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowJoinForm(false)}
                      className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={joinLoading}
                      className="px-4 py-2 rounded-lg bg-blue-800 text-white font-semibold disabled:opacity-60"
                    >
                      {joinLoading ? "Envoi..." : "Soumettre"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </section>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default LaureatsUserConnected;