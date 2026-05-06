import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  ChevronLeft,
  ChevronRight,
  Globe2,
  GraduationCap,
  MapPin,
  Search,
  Users,
} from "lucide-react";
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
  const hasActiveFilters = selectedPromo !== "all" || selectedSpecialite !== "all" || debouncedSearch.length > 0;

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
      navigate("/laureats/rejoindre");
      return;
    }

    navigate("/connexion", {
      state: {
        from: "/laureats/rejoindre",
        messageType: "event_register",
      },
    });
  };

  const statCards = [
    {
      label: "Lauréats",
      value: formatStat(stats.totalLaureats),
      icon: Users,
      tint: "bg-[#e8f0ff] text-[#1e40af]",
    },
    {
      label: "Entreprises",
      value: formatStat(stats.totalEntreprises),
      icon: BriefcaseBusiness,
      tint: "bg-[#fff1de] text-[#d97706]",
    },
    {
      label: "Pays",
      value: formatStat(stats.totalPays),
      icon: Globe2,
      tint: "bg-[#ecfdf3] text-[#047857]",
    },
    {
      label: "Taux d'emploi",
      value: `${stats.tauxEmploi}%`,
      icon: GraduationCap,
      tint: "bg-[#f4ecff] text-[#7c3aed]",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f7fb]">
      <Header />

      <main className="flex-1">
        <section className="relative overflow-hidden bg-[#10263d] text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(245,159,36,0.25),_transparent_26%),radial-gradient(circle_at_left,_rgba(59,130,246,0.18),_transparent_30%)]" />
          <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.9fr)] lg:items-center">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/80">
                <GraduationCap className="h-4 w-4 text-[#f59f24]" />
                Réseau CEEAM
              </span>
              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
                  L'annuaire qui relie les parcours, les promotions et les opportunités.
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-white/78 sm:text-base">
                  Explorez les profils de nos lauréats, retrouvez leurs spécialités, leurs villes d'exercice et les entreprises qui prolongent aujourd'hui l'empreinte CEEAM.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={handleJoinClick}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#f59f24] px-6 py-3.5 text-sm font-semibold text-[#10263d] transition-all hover:-translate-y-0.5 hover:bg-[#ffb74f]"
                >
                  Rejoindre l'annuaire
                  <ArrowRight className="h-4 w-4" />
                </button>
                <div className="inline-flex items-center justify-center rounded-2xl border border-white/12 bg-white/10 px-5 py-3 text-sm font-medium text-white/85">
                  {total} profils visibles actuellement
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/10 p-5 shadow-[0_25px_80px_rgba(0,0,0,0.18)] backdrop-blur-sm sm:p-6">
              <div className="rounded-[26px] bg-white p-5 text-[#10263d] sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Instantané du réseau</p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {statCards.map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <div key={stat.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className={`inline-flex rounded-xl p-2 ${stat.tint}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <p className="mt-4 text-3xl font-bold text-slate-950">{stat.value}</p>
                        <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative -mt-8 pb-8 sm:-mt-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-[0_25px_80px_rgba(15,23,42,0.08)] sm:p-6 lg:p-7">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Recherche ciblée</p>
                  <h2 className="text-2xl font-bold text-slate-950">Trouvez le bon profil plus vite</h2>
                  <p className="max-w-2xl text-sm leading-6 text-slate-500">
                    Filtrez par promotion, spécialité ou mot-clé pour naviguer dans l'annuaire sans perdre le contexte du réseau.
                  </p>
                </div>
                <div className="inline-flex items-center rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
                  {hasActiveFilters ? "Filtres actifs" : "Vue complète de l'annuaire"}
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(220px,0.7fr)_minmax(220px,0.7fr)]">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Recherche par nom, spécialité, entreprise ou ville"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm text-slate-900 outline-none transition-all focus:border-[#1e40af] focus:bg-white focus:ring-4 focus:ring-blue-100"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <GraduationCap className="h-4 w-4 text-[#1e40af]" />
                    Promotion
                  </div>
                  <select
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition-all focus:border-[#1e40af] focus:bg-white focus:ring-4 focus:ring-blue-100"
                    value={selectedPromo}
                    onChange={(e) => setSelectedPromo(e.target.value)}
                  >
                    <option value="all">Toutes les promos</option>
                    {promotions.map((promo) => (
                      <option key={promo} value={promo}>{promo}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Building2 className="h-4 w-4 text-[#1e40af]" />
                    Spécialité
                  </div>
                  <select
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition-all focus:border-[#1e40af] focus:bg-white focus:ring-4 focus:ring-blue-100"
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

              <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                <p>
                  {isLoading ? "Actualisation des profils..." : `${total} résultat${total > 1 ? "s" : ""} disponible${total > 1 ? "s" : ""}`}
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setSelectedPromo("all");
                      setSelectedSpecialite("all");
                    }}
                    className="text-left font-semibold text-[#1e40af] transition-colors hover:text-[#10263d] sm:text-right"
                  >
                    Réinitialiser les filtres
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6">
          {pageError && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {pageError}
            </div>
          )}

          {isLoading ? (
            <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-20 text-center text-slate-500 shadow-sm">
              Chargement des lauréats...
            </div>
          ) : laureats.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-20 text-center text-slate-500 shadow-sm">
              Aucun lauréat trouvé pour ces filtres.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {laureats.map((laureat) => (
                <article
                  key={laureat.id}
                  className="group relative overflow-hidden rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.07)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_28px_70px_rgba(15,23,42,0.12)]"
                >
                  <div
                    className="absolute inset-x-0 top-0 h-1.5"
                    style={{ background: "linear-gradient(90deg, #1e40af 0%, #60a5fa 55%, #f59f24 100%)" }}
                  />

                  <div className="absolute right-5 top-5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold tracking-[0.12em] text-slate-600">
                    {laureat.promotion}
                  </div>

                  <div className="mb-5 flex justify-center pt-2">
                    {laureat.photo ? (
                      <img
                        src={laureat.photo}
                        alt={laureat.nom}
                        className="h-24 w-24 rounded-full border-4 border-slate-200 object-cover transition-all duration-300 group-hover:border-[#1e40af]"
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-slate-200 bg-gradient-to-br from-[#1e40af] to-[#10263d] text-2xl font-bold text-white transition-all duration-300 group-hover:border-[#1e40af]">
                        {getInitials(laureat.nom)}
                      </div>
                    )}
                  </div>

                  <div className="text-center">
                    <h3 className="break-words text-xl font-bold text-slate-950">{laureat.nom}</h3>
                    <p className="mt-2 text-sm font-medium text-[#1e40af]">{laureat.poste || "Poste non précisé"}</p>
                  </div>

                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    <span className="rounded-full bg-[#edf4ff] px-3 py-1 text-xs font-semibold text-[#1e40af]">
                      {laureat.specialite}
                    </span>
                    <span className="rounded-full bg-[#fff3df] px-3 py-1 text-xs font-semibold text-[#b45309]">
                      {laureat.entreprise}
                    </span>
                  </div>

                  <ul className="mt-6 space-y-3 rounded-[24px] bg-slate-50 p-4 text-sm text-slate-600">
                    <li className="flex items-start gap-3">
                      <Globe2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1e40af]" />
                      <span className="break-words">{laureat.pays}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-[#1e40af]" />
                      <span className="break-words">{laureat.specialite}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1e40af]" />
                      <span className="break-words">{laureat.entreprise}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#1e40af]" />
                      <span className="break-words">{laureat.ville}</span>
                    </li>
                  </ul>

                  <button
                    type="button"
                    onClick={() => navigate(`/laureats/${laureat.id}`)}
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#10263d] px-4 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#0c1d2e]"
                  >
                    Voir le profil
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        <div className="mb-12 flex items-center justify-center gap-3 px-4 sm:px-6">
          <button
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-[#10263d] transition-all hover:border-[#1e40af] hover:text-[#1e40af] disabled:cursor-not-allowed disabled:opacity-35"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {Array.from({ length: totalPages }).map((_, index) => {
              const page = index + 1;
              const isActivePage = index === currentPage - 1;

              return (
                <button
                  key={index}
                  className={`inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-semibold transition-all ${
                    isActivePage
                      ? "bg-[#10263d] text-white shadow-md"
                      : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                  }`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              );
            })}
          </div>

          <button
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-[#10263d] transition-all hover:border-[#1e40af] hover:text-[#1e40af] disabled:cursor-not-allowed disabled:opacity-35"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <section className="px-4 pb-16 sm:px-6">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-[36px] border border-slate-200 bg-[linear-gradient(135deg,_#10263d_0%,_#1c4271_62%,_#f59f24_145%)] text-white shadow-[0_28px_90px_rgba(16,38,61,0.22)]">
            <div className="grid gap-8 px-6 py-10 sm:px-8 lg:grid-cols-[minmax(0,1.4fr)_auto] lg:items-center lg:px-12 lg:py-14">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/65">Vous êtes lauréat ?</p>
                <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Ajoutez votre parcours à la dynamique du réseau.</h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">
                  Rejoignez l'annuaire, rendez votre profil visible à la communauté et facilitez les prises de contact entre promotions, spécialités et opportunités professionnelles.
                </p>
              </div>
              <button
                type="button"
                onClick={handleJoinClick}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-base font-semibold text-[#10263d] transition-all hover:-translate-y-0.5 hover:bg-slate-100"
              >
                Rejoindre l'annuaire
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Laureats;
