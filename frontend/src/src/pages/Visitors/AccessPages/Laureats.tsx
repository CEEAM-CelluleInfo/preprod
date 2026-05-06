import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search, GraduationCap, Building2, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { LaureatListItem, LaureatStats, LaureatsService } from "@/services/laureatsService";
import { AuthService } from "@/services/authService";

const ITEMS_PER_PAGE = 6;

const defaultStats: LaureatStats = {
  totalLaureats: 0,
  totalEntreprises: 0,
  totalPays: 0,
  tauxEmploi: 0,
};

const formatStat = (value: number) => `${value}+`;

const getInitials = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const Laureats = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedPromo, setSelectedPromo] = useState("all");
  const [selectedSpecialite, setSelectedSpecialite] = useState("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [laureats, setLaureats] = useState<LaureatListItem[]>([]);
  const [stats, setStats] = useState<LaureatStats>(defaultStats);
  const [promotions, setPromotions] = useState<string[]>([]);
  const [specialites, setSpecialites] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / ITEMS_PER_PAGE)), [total]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedPromo, selectedSpecialite]);

  useEffect(() => {
    const loadStaticData = async () => {
      try {
        const [statsResponse, promotionsResponse, specialitesResponse] = await Promise.all([
          LaureatsService.getStats(),
          LaureatsService.getPromotions(),
          LaureatsService.getSpecialites(),
        ]);
        setStats(statsResponse);
        setPromotions(promotionsResponse);
        setSpecialites(specialitesResponse);
      } catch (error) {
        console.error("Erreur chargement des donnees de la page laureats:", error);
      }
    };

    loadStaticData();
  }, []);

  useEffect(() => {
    const loadLaureats = async () => {
      try {
        setIsLoading(true);
        setPageError(null);

        const response = await LaureatsService.getLaureats({
          page: currentPage,
          limit: ITEMS_PER_PAGE,
          search: debouncedSearch || undefined,
          promotion: selectedPromo === "all" ? undefined : selectedPromo,
          specialite: selectedSpecialite === "all" ? undefined : selectedSpecialite,
        });

        setLaureats(response.data || []);
        setTotal(response.total || 0);
      } catch (error) {
        console.error("Erreur chargement des laureats:", error);
        setPageError("Impossible de charger les laureats pour le moment.");
        setLaureats([]);
        setTotal(0);
      } finally {
        setIsLoading(false);
      }
    };

    loadLaureats();
  }, [currentPage, debouncedSearch, selectedPromo, selectedSpecialite]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleJoinClick = async () => {
    const user = AuthService.getCurrentUser() || await AuthService.fetchCurrentUser();
    if (user) {
      navigate('/laureats/rejoindre');
      return;
    }

    navigate('/connexion', {
      state: {
        from: '/laureats/rejoindre',
        messageType: 'event_register',
      },
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <div 
          className="flex flex-col items-center justify-center px-6 py-16 pb-20 space-y-4"
          style={{ background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)' }}
        >
          {/* Icon SVG */}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            width="72" 
            height="72" 
            fill="none" 
            stroke="#fbf8f8" 
            strokeWidth="1" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }}
          >
            <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0zM22 10v6"/>
            <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>
          </svg>
          <h1 className="text-5xl font-bold text-center text-white">
            Annuaire des Lauréats
          </h1>
          <h2 className="text-white text-xl opacity-90">
            Retrouvez nos anciens étudiants et restez connectés
          </h2>
        </div>

        {/* Stats Cards */}
        <div className="flex flex-col space-y-6 items-center justify-center pb-6 -mt-10 bg-gray-100 relative z-10">
          <div className="flex flex-row gap-8 md:gap-16">
            <div 
              className="bg-white shadow-xl rounded-2xl p-6 w-40 md:w-48 h-28 flex flex-col items-center justify-center text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className="text-2xl mb-1">👥</div>
              <h2 className="text-2xl font-semibold text-gray-900">{formatStat(stats.totalLaureats)}</h2>
              <h2 className="text-base text-gray-600">Lauréats</h2>
            </div>
            <div 
              className="bg-white shadow-xl rounded-2xl p-6 w-40 md:w-48 h-28 flex flex-col items-center justify-center text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className="text-2xl mb-1">🏢</div>
              <h2 className="text-2xl font-semibold text-gray-900">{formatStat(stats.totalEntreprises)}</h2>
              <h2 className="text-base text-gray-600">Entreprises</h2>
            </div>
          </div>
          <div className="flex flex-row gap-8 md:gap-16"> 
            <div 
              className="bg-white shadow-xl rounded-2xl p-6 w-40 md:w-48 h-28 flex flex-col items-center justify-center text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className="text-2xl mb-1">🌍</div>
              <h2 className="text-2xl font-semibold text-gray-900">{formatStat(stats.totalPays)}</h2>
              <h2 className="text-base text-gray-600">Pays</h2>
            </div>
            <div 
              className="bg-white shadow-xl rounded-2xl p-6 w-40 md:w-48 h-28 flex flex-col items-center justify-center text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className="text-2xl mb-1">📈</div>
              <h2 className="text-2xl font-semibold text-gray-900">{stats.tauxEmploi}%</h2>
              <h2 className="text-base text-gray-600">Taux d'emploi</h2>
            </div>
          </div>
        </div>

        {/* Search and Filters Section */}
        <section className="container mx-auto px-4 bg-gray-100 pb-6">
          <div className="p-6 space-y-4 bg-white rounded-xl shadow-md">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Recherche par nom, spécialité ou entreprise"
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex flex-col w-full gap-2">
                <div className="flex flex-row gap-2 items-center">
                  <GraduationCap className="w-4 h-4 text-blue-800" />
                  <p className="text-sm font-medium text-gray-700">Promotion</p>
                </div>
                <select 
                  className="p-3 border-2 border-gray-200 rounded-lg w-full focus:outline-none focus:border-blue-500 bg-white transition-colors"
                  value={selectedPromo}
                  onChange={(e) => setSelectedPromo(e.target.value)}
                >
                  <option value="all">Toutes les promos</option>
                  {promotions.map((promo) => (
                    <option key={promo} value={promo}>{promo}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex flex-col w-full gap-2">
                <div className="flex flex-row gap-2 items-center">
                  <Building2 className="w-4 h-4 text-blue-800" />
                  <p className="text-sm font-medium text-gray-700">Spécialités</p>
                </div>
                <select 
                  className="p-3 border-2 border-gray-200 rounded-lg w-full focus:outline-none focus:border-blue-500 bg-white transition-colors"
                  value={selectedSpecialite}
                  onChange={(e) => setSelectedSpecialite(e.target.value)}
                >
                  <option value="all">Toutes les spécialités</option>
                  {specialites.map((specialite) => (
                    <option key={specialite} value={specialite}>{specialite}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Laureats Grid */}
        <section className="bg-gray-100 container mx-auto px-4 pb-16">
          {pageError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {pageError}
            </div>
          )}

          {isLoading ? (
            <div className="py-20 text-center text-gray-500">Chargement des lauréats...</div>
          ) : laureats.length === 0 ? (
            <div className="py-20 text-center text-gray-500">Aucun lauréat trouvé pour ces filtres.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {laureats.map((laureat) => (
                <div 
                  key={laureat.id} 
                  className="bg-white rounded-2xl shadow-md p-6 relative transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl overflow-hidden group"
                >
                  <div 
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ background: 'linear-gradient(90deg, #1e40af 0%, #3b82f6 100%)' }}
                  />

                  <span className="absolute top-4 right-4 text-xs bg-gray-100 text-gray-700 font-medium px-3 py-1 rounded-full">
                    {laureat.promotion}
                  </span>

                  <div className="flex justify-center mb-4">
                    {laureat.photo ? (
                      <img 
                        src={laureat.photo}
                        alt={laureat.nom}
                        className="w-24 h-24 rounded-full object-cover border-4 border-gray-200 transition-all duration-300 group-hover:border-blue-500"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white text-2xl font-bold border-4 border-gray-200 transition-all duration-300 group-hover:border-blue-500">
                        {getInitials(laureat.nom)}
                      </div>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-center text-gray-900 mb-4">
                    {laureat.nom}
                  </h3>

                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-center gap-2">
                      <span>{laureat.pays}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-blue-600" />
                      <span>{laureat.specialite}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      <span>{laureat.poste}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold">{laureat.entreprise}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <span>{laureat.ville}</span>
                    </li>
                  </ul>

                  <button
                    type="button"
                    onClick={() => navigate(`/laureats/${laureat.id}`)}
                    className="mt-6 w-full bg-blue-800 text-white py-3 rounded-lg font-semibold transition-all duration-300 hover:bg-blue-900 hover:shadow-lg block text-center"
                  >
                    Voir Profil
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <button
            className="p-2 text-blue-800 transition-all duration-300 hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={20} />
          </button>

          <div className="flex gap-2">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  index === currentPage - 1 
                    ? "bg-blue-800 scale-125" 
                    : "bg-blue-400 opacity-50 hover:opacity-75"
                }`}
                onClick={() => handlePageChange(index + 1)}
              />
            ))}
          </div>

          <button
            className="p-2 text-blue-800 transition-all duration-300 hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Join Section */}
        <section 
          className="py-16 text-center text-white"
          style={{ background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)' }}
        >
          <h2 className="text-4xl font-bold mb-4">Vous êtes lauréat ?</h2>
          <p className="mb-8 max-w-2xl mx-auto text-lg opacity-90 px-4">
            Rejoignez notre annuaire et restez connecté avec la communauté CEEAM
          </p>
          <button
            type="button"
            onClick={handleJoinClick}
            className="bg-white text-blue-800 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 hover:bg-gray-100 hover:shadow-xl hover:-translate-y-1"
          >
            Rejoindre l'annuaire
          </button>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Laureats;