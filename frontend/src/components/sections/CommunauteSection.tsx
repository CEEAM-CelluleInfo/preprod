import { ChevronLeft, ChevronRight, Globe2, GraduationCap, Users } from "lucide-react";
import { useState } from "react";
import { HomeCommunity } from "@/types/home";

interface CommunauteSectionProps {
  community?: HomeCommunity;
}

const CommunauteSection = ({ community }: CommunauteSectionProps) => {
  const [currentPage, setCurrentPage] = useState(0);

  const fallbackCountries = [
    { name: "BENIN", flag: "🇧🇯", members: 10, laureats: 10 },
    { name: "TOGO", flag: "🇹🇬", members: 8, laureats: 5 },
    { name: "SENEGAL", flag: "🇸🇳", members: 12, laureats: 8 },
    { name: "COTE D'IVOIRE", flag: "🇨🇮", members: 6, laureats: 4 },
    { name: "MAROC", flag: "🇲🇦", members: 9, laureats: 6 },
    { name: "CAMEROUN", flag: "🇨🇲", members: 7, laureats: 4 },
  ];

  const countries = community?.countries?.length ? community.countries : fallbackCountries;

  const highlights = [
    { icon: <Globe2 className="h-5 w-5" />, value: String(community?.represented_countries ?? 18), label: "pays représentés" },
    { icon: <Users className="h-5 w-5" />, value: String(community?.total_members ?? 60), label: "étudiants accompagnés" },
    { icon: <GraduationCap className="h-5 w-5" />, value: String(community?.total_laureats ?? 25), label: "lauréats valorisés" },
  ];

  const itemsPerPage = 4;
  const totalPages = Math.ceil(countries.length / itemsPerPage);

  const currentCountries = countries.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  return (
    <section className="px-4 pb-16 sm:px-6 lg:pb-24">
      <div className="mx-auto max-w-7xl rounded-[36px] bg-[linear-gradient(135deg,_#fff8eb_0%,_#ffffff_42%,_#edf4ff_100%)] p-6 shadow-[0_25px_80px_rgba(15,23,42,0.08)] sm:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(280px,0.82fr)_minmax(0,1.18fr)] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Communauté internationale</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-950 sm:text-4xl">Une diversité visible, organisée et portée par un vrai réseau.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
              Derrière les chiffres, il y a un maillage de parcours, de campus et d'histoires qui enrichit l'expérience CEEAM.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {highlights.map((highlight) => (
                <div key={highlight.label} className="rounded-[24px] border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur-sm">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#10263d] text-white">
                    {highlight.icon}
                  </div>
                  <p className="mt-4 text-3xl font-bold text-slate-950">{highlight.value}</p>
                  <p className="mt-2 text-sm text-slate-500">{highlight.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-6">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Pays en lumière</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-950">Des communautés ancrées dans plusieurs campus</h3>
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

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {currentCountries.map((country, index) => (
                <article
                  key={index}
                  className="rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)] p-5 transition-all hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Origine</p>
                      <h4 className="mt-2 text-lg font-bold text-slate-950">{country.name}</h4>
                    </div>
                    <span className="text-3xl">{country.flag}</span>
                  </div>

                  <div className="mt-6 space-y-3 rounded-[20px] bg-slate-50 p-4 text-sm text-slate-600">
                    <div className="flex items-center justify-between gap-3">
                      <span>Membres</span>
                      <span className="font-semibold text-slate-950">{country.members}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Lauréats</span>
                      <span className="font-semibold text-slate-950">{country.laureats}</span>
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

export default CommunauteSection;
