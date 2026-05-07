import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import HeaderConnected from "@/components/layout/HeaderConnected";
import Footer from "@/components/layout/Footer";
import LaureatCard from "@/components/laureatDetail/LaureatCard";
import { Briefcase, ChevronLeft, ChevronRight, Filter, GraduationCap, Search, Sparkles, Users } from "lucide-react";
import { getAbsoluteMediaUrl } from "@/lib/utils";
import { LaureatsService } from "@/services/laureatsService";
import { AuthService } from "@/services/authService";
import { API_BASE_URL } from "@/services/api.config";

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

const getJoinRequestErrorMessage = (error: any) => {
  if (error?.data?.message && error.status !== 400) {
    return error.data.message;
  }

  const details = error?.data?.details;
  if (details && typeof details === "object") {
    const firstDetail = Object.values(details).flat().find(Boolean);
    if (typeof firstDetail === "string") {
      return firstDetail;
    }
  }

  return error?.detail || error?.message || "Impossible de soumettre la demande pour le moment.";
};

const LaureatsUserConnected = () => {
  const navigate = useNavigate();

  const [laureats, setLaureats] = useState<Laureat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [promotions, setPromotions] = useState<string[]>(["Toutes les promos"]);
  const [specialities, setSpecialities] = useState<string[]>(["Toutes les spécialités"]);
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

  const [stats, setStats] = useState({
    totalLaureats: 0,
    totalCompanies: 0,
    totalCountries: 0,
    employmentRate: 95,
  });

  const itemsPerPage = 6;

  useEffect(() => {
    const preloadJoinForm = async () => {
      const user = AuthService.getCurrentUser() || await AuthService.fetchCurrentUser();
      if (!user) return;

      setIsCurrentUserLaureat(user.role === "laureat");

      if (user.role === "laureat") {
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

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const statsRes = await fetch(`${API_BASE_URL}/laureats/stats/`, { credentials: "include" });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats({
            totalLaureats: statsData.totalLaureats,
            totalCompanies: statsData.totalCompanies,
            totalCountries: statsData.totalCountries,
            employmentRate: statsData.employmentRate,
          });
        }

        const filtersRes = await fetch(`${API_BASE_URL}/laureats/filters/`, { credentials: "include" });
        if (filtersRes.ok) {
          const filtersData = await filtersRes.json();
          setPromotions(filtersData.promotions || ["Toutes les promos"]);
          setSpecialities(filtersData.specialities || ["Toutes les spécialités"]);
        }

        const laureatsRes = await fetch(`${API_BASE_URL}/laureats/?limit=1000`, { credentials: "include" });
        if (laureatsRes.ok) {
          const data = await laureatsRes.json();
          const results = data.results || [];
          const mapped = results.map((laureat: any) => ({
            id: laureat.id,
            name: laureat.name || `${laureat.prenom} ${laureat.nom}`,
            speciality: laureat.specialite || "",
            company: laureat.entreprise || "",
            promo: laureat.promotion || "",
            location: laureat.localisation || "",
            country: laureat.country || "",
            position: laureat.position || "",
            photo: getAbsoluteMediaUrl(laureat.photoUrl),
          }));
          setLaureats(mapped);
        } else {
          console.warn("API lauréats non disponible");
          setLaureats([]);
        }
      } catch (err) {
        console.error("Erreur chargement lauréats:", err);
        setError("Impossible de charger les données");
        setLaureats([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const filtered = laureats.filter((laureat) => {
      const matchesSearch =
        searchTerm === "" ||
        laureat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        laureat.speciality.toLowerCase().includes(searchTerm.toLowerCase()) ||
        laureat.company.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesPromotion = selectedPromotion === "Toutes les promos" || laureat.promo === selectedPromotion;
      const matchesSpeciality = selectedSpeciality === "Toutes les spécialités" || laureat.speciality === selectedSpeciality;

      return matchesSearch && matchesPromotion && matchesSpeciality;
    });

    setFilteredLaureats(filtered);
    setCurrentPage(1);
  }, [searchTerm, selectedPromotion, selectedSpeciality, laureats]);

  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedLaureats(filteredLaureats.slice(startIndex, endIndex));
  }, [filteredLaureats, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredLaureats.length / itemsPerPage));

  const visiblePages = useMemo(() => {
    const pages = new Set<number>([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
    return Array.from(pages)
      .filter((page) => page >= 1 && page <= totalPages)
      .sort((a, b) => a - b);
  }, [currentPage, totalPages]);

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
        setJoinError(getJoinRequestErrorMessage(err));
      }
    } finally {
      setJoinLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <HeaderConnected />

      <main className="flex-1">
        <section className="relative overflow-hidden bg-[#172d45] px-4 py-10 text-white sm:px-6 sm:py-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(245,159,36,0.26),_transparent_32%),radial-gradient(circle_at_left,_rgba(59,130,246,0.18),_transparent_28%)]" />
          <div className="relative mx-auto max-w-7xl">
            <div className="grid gap-8 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)] xl:items-end">
              <div className="space-y-4">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/80">
                  <Sparkles className="h-4 w-4 text-[#f59f24]" />
                  Réseau CEEAM
                </span>
                <div className="space-y-3">
                  <h1 className="max-w-3xl text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">Annuaire des lauréats connectés</h1>
                  <p className="max-w-2xl text-sm leading-6 text-white/80 sm:text-base">
                    Retrouvez les anciens étudiants, filtrez rapidement les profils utiles et gardez un lien direct avec la communauté professionnelle de la CEEAM.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-white/80">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
                    <Users className="h-4 w-4 text-[#f59f24]" />
                    {filteredLaureats.length} profil{filteredLaureats.length > 1 ? "s" : ""} visibles
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
                    <Briefcase className="h-4 w-4 text-[#f59f24]" />
                    {stats.totalCompanies}+ entreprises représentées
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-2">
                <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/65">Lauréats</p>
                  <p className="mt-2 text-3xl font-bold">{stats.totalLaureats}+</p>
                </div>
                <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/65">Entreprises</p>
                  <p className="mt-2 text-3xl font-bold">{stats.totalCompanies}+</p>
                </div>
                <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/65">Pays</p>
                  <p className="mt-2 text-3xl font-bold">{stats.totalCountries}+</p>
                </div>
                <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/65">Emploi</p>
                  <p className="mt-2 text-3xl font-bold">{stats.employmentRate}%</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative -mt-8 pb-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="rounded-[32px] border border-slate-200 bg-white p-4 shadow-[0_22px_70px_rgba(15,23,42,0.08)] sm:p-6 lg:p-8">
              <div className="flex flex-col gap-6 border-b border-slate-200 pb-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div className="space-y-2">
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#172d45]/6 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#172d45]">
                      <Filter className="h-4 w-4" />
                      Recherche ciblée
                    </span>
                    <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">Trouvez le bon profil plus vite</h2>
                    <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                      Recherchez par nom, spécialité ou entreprise puis resserrez la liste par promotion et domaine.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Résultats</p>
                      <p className="mt-2 text-2xl font-bold text-slate-950">{filteredLaureats.length}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Page</p>
                      <p className="mt-2 text-2xl font-bold text-slate-950">{currentPage}</p>
                    </div>
                    <div className="col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:col-span-1">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Total pages</p>
                      <p className="mt-2 text-2xl font-bold text-slate-950">{totalPages}</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_repeat(2,minmax(0,1fr))]">
                  <label className="relative block">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Recherche par nom, spécialité ou entreprise"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </label>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <GraduationCap className="h-4 w-4 text-[#172d45]" />
                      Promotion
                    </div>
                    <select
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
                      value={selectedPromotion}
                      onChange={(e) => setSelectedPromotion(e.target.value)}
                    >
                      {promotions.map((promo) => (
                        <option key={promo} value={promo}>{promo}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <Briefcase className="h-4 w-4 text-[#172d45]" />
                      Spécialités
                    </div>
                    <select
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
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

              <div className="mt-6">
                {isLoading ? (
                  <div className="flex h-64 items-center justify-center gap-3 rounded-[28px] border border-slate-200 bg-slate-50 text-slate-500">
                    <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
                    <span>Chargement des lauréats...</span>
                  </div>
                ) : error && laureats.length === 0 ? (
                  <div className="rounded-[28px] border border-red-200 bg-red-50 p-6 text-center text-red-700">
                    <p>{error}</p>
                  </div>
                ) : paginatedLaureats.length === 0 ? (
                  <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
                    <p className="text-lg font-semibold text-slate-800">Aucun lauréat trouvé</p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">Ajustez vos filtres ou élargissez la recherche pour explorer davantage de profils.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {paginatedLaureats.map((laureat) => (
                      <LaureatCard
                        key={laureat.id}
                        laureat={laureat}
                        onViewProfile={handleViewProfile}
                      />
                    ))}
                  </div>
                )}
              </div>

              {filteredLaureats.length > 0 && (
                <div className="mt-8 flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-slate-50 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="text-sm text-slate-600">
                    Page <span className="font-semibold text-slate-900">{currentPage}</span> sur <span className="font-semibold text-slate-900">{totalPages}</span>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ChevronLeft size={18} />
                      Précédent
                    </button>

                    <div className="flex items-center gap-2 px-1">
                      {visiblePages.map((page) => (
                        <button
                          key={page}
                          className={`h-10 min-w-[2.5rem] rounded-2xl px-3 text-sm font-semibold transition ${
                            page === currentPage
                              ? "bg-[#172d45] text-white shadow-[0_10px_25px_rgba(23,45,69,0.16)]"
                              : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                          }`}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="inline-flex items-center gap-2 rounded-2xl bg-[#172d45] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#203c5a] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Suivant
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {!isCurrentUserLaureat && (
          <section className="px-4 py-12 sm:px-6 sm:py-16">
            <div className="mx-auto max-w-7xl rounded-[36px] border border-blue-200 bg-[linear-gradient(135deg,_#172d45_0%,_#244e7a_60%,_#2d679f_100%)] p-6 text-white shadow-[0_28px_80px_rgba(23,45,69,0.2)] sm:p-8 lg:p-10">
              <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.95fr)] xl:items-start">
                <div className="space-y-5">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/85">
                    <Sparkles className="h-4 w-4 text-[#f59f24]" />
                    Rejoindre le réseau
                  </span>
                  <div className="space-y-3">
                    <h2 className="text-3xl font-bold leading-tight sm:text-4xl">Vous êtes lauréat ? Faites partie de l'annuaire.</h2>
                    <p className="max-w-2xl text-sm leading-6 text-white/80 sm:text-base">
                      Les informations de base sont pré-remplies depuis votre compte. Complétez simplement votre profil professionnel pour soumettre votre demande.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
                      <p className="text-sm font-semibold">Validation encadrée</p>
                      <p className="mt-2 text-sm leading-6 text-white/75">Votre demande est relue avant publication dans l'annuaire.</p>
                    </div>
                    <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
                      <p className="text-sm font-semibold">Profil professionnel</p>
                      <p className="mt-2 text-sm leading-6 text-white/75">Ajoutez entreprise, poste et localisation pour mieux vous rendre visible.</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/12 bg-white/95 p-4 text-slate-900 shadow-[0_16px_40px_rgba(15,23,42,0.18)] sm:p-6">
                  {joinSuccess && (
                    <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                      {joinSuccess}
                    </div>
                  )}
                  {joinError && (
                    <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                      {joinError}
                    </div>
                  )}

                  {!showJoinForm ? (
                    <div className="space-y-4 text-center">
                      <h3 className="text-2xl font-bold text-slate-950">Prêt à rejoindre l'annuaire ?</h3>
                      <p className="text-sm leading-6 text-slate-600">
                        Ouvrez le formulaire, vérifiez vos informations et soumettez votre demande en quelques instants.
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowJoinForm(true)}
                        className="inline-flex w-full items-center justify-center rounded-2xl bg-[#172d45] px-6 py-3 font-semibold text-white transition hover:bg-[#203c5a]"
                      >
                        Rejoindre l'annuaire
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleJoinSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <input
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
                        placeholder="Nom complet"
                        value={joinForm.nom}
                        onChange={(e) => handleJoinChange("nom", e.target.value)}
                        required
                        maxLength={100}
                      />
                      <input
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
                        placeholder="Promotion (optionnel)"
                        value={joinForm.promotion}
                        onChange={(e) => handleJoinChange("promotion", e.target.value)}
                        maxLength={20}
                      />
                      <input
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
                        placeholder="Spécialité (optionnel)"
                        value={joinForm.specialite}
                        onChange={(e) => handleJoinChange("specialite", e.target.value)}
                        maxLength={200}
                      />
                      <input
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
                        placeholder="Poste (optionnel)"
                        value={joinForm.poste}
                        onChange={(e) => handleJoinChange("poste", e.target.value)}
                        maxLength={150}
                      />
                      <input
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
                        placeholder="Entreprise (optionnel)"
                        value={joinForm.entreprise}
                        onChange={(e) => handleJoinChange("entreprise", e.target.value)}
                        maxLength={150}
                      />
                      <input
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
                        placeholder="Ville (optionnel)"
                        value={joinForm.ville}
                        onChange={(e) => handleJoinChange("ville", e.target.value)}
                        maxLength={100}
                      />
                      <input
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
                        placeholder="Pays (optionnel)"
                        value={joinForm.pays}
                        onChange={(e) => handleJoinChange("pays", e.target.value)}
                        maxLength={100}
                      />
                      <input
                        type="email"
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
                        placeholder="Email de contact"
                        value={joinForm.contact}
                        onChange={(e) => handleJoinChange("contact", e.target.value)}
                        required
                      />

                      <div className="flex flex-col gap-2 pt-2 md:col-span-2 sm:flex-row sm:justify-end">
                        <button
                          type="button"
                          onClick={() => setShowJoinForm(false)}
                          className="rounded-2xl border border-slate-300 px-4 py-3 text-slate-700 transition hover:bg-slate-50"
                        >
                          Annuler
                        </button>
                        <button
                          type="submit"
                          disabled={joinLoading}
                          className="rounded-2xl bg-[#172d45] px-5 py-3 font-semibold text-white transition hover:bg-[#203c5a] disabled:opacity-60"
                        >
                          {joinLoading ? "Envoi..." : "Soumettre la demande"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default LaureatsUserConnected;
