import { ChevronLeft, ChevronRight, ArrowRight, Mail, MapPin } from "lucide-react";
import { useState } from "react";
import { HomeBureauMember } from "@/types/home";

interface BureauExecutifProps {
  members?: HomeBureauMember[];
}

const BureauExecutif = ({ members }: BureauExecutifProps) => {
  const [currentPage, setCurrentPage] = useState(0);

  const fallbackMembers: HomeBureauMember[] = [
    {
      id: 1,
      name: "Nadia Mensah",
      role: "Secrétaire Générale",
      filiere: "Génie Industriel",
      country: "🇹🇬",
      campus: "Campus de Metz",
      mission: "Coordonner les actions du bureau et garantir une expérience claire pour toute la communauté.",
      image: "/images/sg1.jpg",
      mandate_year: "2025-2026",
    },
    {
      id: 2,
      name: "Yao Koffi",
      role: "Vice-président",
      filiere: "Génie Mécanique",
      country: "🇨🇮",
      campus: "Campus d'Aix-en-Provence",
      mission: "Renforcer les liens entre les nouveaux arrivants, les promotions et les anciens membres.",
      image: "/images/sg5.jpg",
      mandate_year: "2025-2026",
    },
    {
      id: 3,
      name: "Aïcha Ndiaye",
      role: "Responsable Intégration",
      filiere: "Génie Civil",
      country: "🇸🇳",
      campus: "Campus de Cluny",
      mission: "Créer des repères concrets dès l'arrivée et faciliter l'intégration académique et sociale.",
      image: "/images/sg4.avif",
      mandate_year: "2025-2026",
    },
    {
      id: 4,
      name: "Prince Ahouansou",
      role: "Responsable Partenariats",
      filiere: "Systèmes Énergétiques",
      country: "🇧🇯",
      campus: "Campus de Lille",
      mission: "Développer des opportunités utiles pour les étudiants et valoriser les initiatives du réseau.",
      image: "/images/sg6.jpg",
      mandate_year: "2025-2026",
    },
  ];

  const data = members && members.length > 0 ? members : fallbackMembers;

  const itemsPerPage = 2;
  const totalPages = Math.ceil(data.length / itemsPerPage);

  const currentMembers = data.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  return (
    <section className="px-4 py-16 sm:px-6 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[minmax(280px,0.78fr)_minmax(0,1.22fr)] lg:items-start">
          <div className="rounded-[32px] bg-[linear-gradient(145deg,_#10263d_0%,_#19395f_100%)] p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.16)] sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/55">Bureau exécutif</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Une équipe qui donne du rythme à la communauté.</h2>
            <p className="mt-4 text-sm leading-7 text-white/75 sm:text-base">
              Des profils complémentaires, ancrés dans les campus et tournés vers l'accueil, la coordination et l'impact collectif.
            </p>

            <div className="mt-8 rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-sm font-semibold text-white">Ce qui structure le mandat</p>
              <div className="mt-4 space-y-3 text-sm text-white/72">
                <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                  <span>Accompagnement</span>
                  <span className="font-semibold text-white">Nouveaux arrivants</span>
                </div>
                <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                  <span>Coordination</span>
                  <span className="font-semibold text-white">Activités et relais</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Visibilité</span>
                  <span className="font-semibold text-white">Réseau CEEAM</span>
                </div>
              </div>
            </div>

            <a
              href="/a-propos"
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#f8c471] transition-colors hover:text-white"
            >
              Voir la vision complète
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-6">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Équipe mise en avant</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-950">Les visages du mandat</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                  disabled={currentPage === 0}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-all hover:border-[#f59f24] hover:text-[#f59f24] disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-all hover:border-[#f59f24] hover:text-[#f59f24] disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {currentMembers.map((member, index) => (
                <article key={index} className="overflow-hidden rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)] shadow-sm transition-all hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(15,23,42,0.10)]">
                  <div className="relative aspect-[4/4.2] bg-[#10263d]">
                    <img src={member.image} alt={member.name} className="h-full w-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,_transparent_0%,_rgba(15,23,42,0.8)_100%)] p-5">
                      <div className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                        {member.country} {member.role}
                      </div>
                    </div>
                  </div>

                  <div className="p-5">
                    <h4 className="text-xl font-bold text-slate-950">{member.name}</h4>
                    <p className="mt-1 text-sm font-medium text-[#1e40af]">{member.filiere}</p>
                    <p className="mt-4 text-sm leading-6 text-slate-600">{member.mission}</p>

                    <div className="mt-5 space-y-3 rounded-[22px] bg-slate-50 p-4 text-sm text-slate-600">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-[#f59f24]" />
                        <span>{member.campus}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-[#f59f24]" />
                        <span>{member.role}</span>
                      </div>
                    </div>
                  </div>
                </article>
          ))}
            </div>

            <div className="mt-6 flex items-center justify-center gap-2">
              {Array.from({ length: totalPages }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPage(index)}
                  className={index === currentPage ? "dot-indicator-active" : "dot-indicator"}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BureauExecutif;
