import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  Globe,
  GraduationCap,
  Heart,
  Linkedin,
  Mail,
  MapPin,
  Medal,
  ShieldCheck,
  Target,
  Users,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { apiGet } from '@/services/api.config';

interface Leader {
  id: number;
  nom: string;
  prenom: string;
  position: string;
  executive: string;
  email: string;
  nationality: string;
  flag: string;
  filiere: string;
  campus: string;
  mandat: string;
  mission: string;
  linkedin?: string;
  image?: string;
}

interface Stat {
  value: string;
  label: string;
}

interface AboutContent {
  mission_paragraphs: string[];
  vision_paragraphs: string[];
  valeurs_list: { title: string; desc: string }[];
}

interface FormerSecretaryGeneral {
  id: number;
  nom_complet: string;
  mandat: string;
  poste: string;
  campus: string;
  filiere: string;
  promotion: string;
  image?: string;
}

interface AboutStatsResponse {
  data?: Stat[];
}

interface AboutLeadersResponse {
  data?: Leader[];
  top_secretaires_generaux?: FormerSecretaryGeneral[];
}

export const APropos: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'mission' | 'vision' | 'valeurs'>('mission');
  const [currentLeaderIndex, setCurrentLeaderIndex] = useState(0);
  const [stats, setStats] = useState<Stat[]>([]);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [formerSecretaries, setFormerSecretaries] = useState<FormerSecretaryGeneral[]>([]);
  const [aboutContent, setAboutContent] = useState<AboutContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsData = await apiGet<AboutStatsResponse>('/about/stats/');
        setStats(statsData.data || []);

        const leadersData = await apiGet<AboutLeadersResponse>('/about/leaders/');
        setLeaders(leadersData.data || []);
        setFormerSecretaries(leadersData.top_secretaires_generaux || []);

        const contentData = await apiGet<AboutContent>('/about/content/');
        setAboutContent(contentData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePrevLeader = () => {
    setCurrentLeaderIndex((prev) => (prev > 0 ? prev - 1 : leaders.length - 1));
  };

  const handleNextLeader = () => {
    setCurrentLeaderIndex((prev) => (prev < leaders.length - 1 ? prev + 1 : 0));
  };

  const currentLeader = leaders[currentLeaderIndex];

  const tabs = [
    { id: 'mission' as const, label: 'Mission', icon: Target },
    { id: 'vision' as const, label: 'Vision', icon: Eye },
    { id: 'valeurs' as const, label: 'Valeurs', icon: Heart },
  ];

  const fallbackValues = [
    { title: 'Solidarité', desc: "Nous créons un réseau d'entraide fort entre tous nos membres." },
    { title: 'Excellence', desc: "Nous visons l'excellence dans toutes nos actions et initiatives." },
    { title: 'Diversité', desc: 'Nous célébrons et valorisons la richesse de nos différences culturelles.' },
    { title: 'Inclusion', desc: 'Nous garantissons un environnement accueillant pour tous.' },
    { title: 'Innovation', desc: 'Nous encourageons la créativité et les nouvelles idées.' },
  ];

  const activeContent = useMemo(() => {
    if (activeTab === 'mission') {
      return {
        title: 'Notre mission',
        intro: 'Créer un environnement de confiance, d’excellence et d’entraide pour les étudiants internationaux des Arts & Métiers.',
        paragraphs:
          aboutContent?.mission_paragraphs && aboutContent.mission_paragraphs.length > 0
            ? aboutContent.mission_paragraphs
            : [
                "La CEEAM a pour mission de créer un environnement inclusif et solidaire pour tous les étudiants internationaux de l'ENSAM.",
                "Nous facilitons l'intégration académique, sociale et humaine de nos membres tout en valorisant la richesse de nos cultures.",
              ],
      };
    }

    if (activeTab === 'vision') {
      return {
        title: 'Notre vision',
        intro: 'Construire un réseau durable, visible et inspirant entre les étudiants, les promotions et les cultures.',
        paragraphs:
          aboutContent?.vision_paragraphs && aboutContent.vision_paragraphs.length > 0
            ? aboutContent.vision_paragraphs
            : [
                "Nous aspirons à faire de la CEEAM une référence en matière d'excellence académique et d'intégration culturelle au sein de l'ENSAM.",
                "Notre vision est de construire un pont entre les cultures, favorisant l'échange, l'appui mutuel et l'enrichissement collectif.",
              ],
      };
    }

    return {
      title: 'Nos valeurs',
      intro: 'Des repères concrets qui structurent notre manière d’agir, de nous organiser et d’accompagner la communauté.',
      values:
        aboutContent?.valeurs_list && aboutContent.valeurs_list.length > 0
          ? aboutContent.valeurs_list
          : fallbackValues,
    };
  }, [activeTab, aboutContent]);

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-[#f5f7fb] flex items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-[#f59f24]"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error && !stats.length && !leaders.length) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-[#f5f7fb] flex items-center justify-center px-4">
          <div className="max-w-md rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <p className="text-base font-semibold text-red-600">Erreur de chargement des données</p>
            <p className="mt-2 text-sm text-gray-500">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-5 rounded-2xl bg-[#10263d] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0c1d2e]"
            >
              Réessayer
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <div className="min-h-screen bg-[#f5f7fb]">
        <section className="relative overflow-hidden bg-[#10263d] text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(245,159,36,0.28),_transparent_28%),radial-gradient(circle_at_left,_rgba(59,130,246,0.18),_transparent_26%)]" />
          <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.85fr)] lg:items-center">
              <div className="space-y-6">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/80">
                  <ShieldCheck className="h-4 w-4 text-[#f59f24]" />
                  Communauté CEEAM
                </span>
                <div className="space-y-4">
                  <h1 className="max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
                    Une communauté construite autour de l’intégration, de l’excellence et de l’impact collectif.
                  </h1>
                  <p className="max-w-2xl text-sm leading-7 text-white/78 sm:text-base">
                    Découvrez ce qui guide la CEEAM, les principes qui structurent nos actions et les personnes qui portent la vision de la communauté au quotidien.
                  </p>
                </div>
              </div>

              {stats.length > 0 && (
                <div className="rounded-[32px] border border-white/10 bg-white/10 p-5 shadow-[0_25px_80px_rgba(0,0,0,0.18)] backdrop-blur-sm sm:p-6">
                  <div className="rounded-[26px] bg-white p-5 text-[#10263d] sm:p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Quelques repères</p>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      {stats.map((stat, index) => (
                        <div key={`${stat.label}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-3xl font-bold text-slate-950 sm:text-4xl">{stat.value}</p>
                          <p className="mt-2 text-sm text-slate-500">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="relative -mt-8 px-4 pb-10 sm:px-6 sm:-mt-10">
          <div className="mx-auto max-w-7xl rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_25px_80px_rgba(15,23,42,0.08)] sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Fondements</p>
                <h2 className="mt-2 text-3xl font-bold text-slate-950">Mission, vision et valeurs</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Trois angles pour comprendre la CEEAM : ce que nous faisons, ce que nous voulons construire et la manière dont nous avançons.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-all ${
                        active
                          ? 'bg-[#f59f24] text-[#10263d] shadow-[0_10px_30px_rgba(245,159,36,0.3)]'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
              <div className="rounded-[28px] bg-[linear-gradient(135deg,_#10263d_0%,_#1c4271_100%)] p-6 text-white shadow-[0_22px_55px_rgba(16,38,61,0.16)]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">Cap collectif</p>
                <h3 className="mt-3 text-3xl font-bold">{activeContent.title}</h3>
                <p className="mt-4 text-sm leading-7 text-white/75">{activeContent.intro}</p>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
                {activeTab !== 'valeurs' ? (
                  <div className="space-y-5 text-sm font-medium leading-7 text-slate-700 sm:text-base">
                    {activeContent.paragraphs?.map((paragraph, index) => (
                      <p key={index} className="text-justify">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {activeContent.values?.map((value, index) => (
                      <div key={`${value.title}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-base font-bold text-slate-950">{value.title}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{value.desc}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {formerSecretaries.length > 0 && (
          <section className="px-4 pb-10 sm:px-6">
            <div className="mx-auto max-w-7xl rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_25px_80px_rgba(15,23,42,0.08)] sm:p-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Mémoire du bureau</p>
                  <h2 className="mt-2 text-3xl font-bold text-slate-950">Top 5 des anciens secrétaires généraux</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    Un aperçu des figures qui ont porté la coordination générale de la communauté au fil des mandats.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#fff3df] px-4 py-2 text-sm font-semibold text-[#b45309]">
                  <Medal className="h-4 w-4" />
                  Héritage CEEAM
                </div>
              </div>

              <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
                {formerSecretaries.map((secretary, index) => (
                  <article
                    key={secretary.id}
                    className="overflow-hidden rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)] p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_48px_rgba(15,23,42,0.10)]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#10263d] text-sm font-bold text-white">
                        {index + 1}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {secretary.mandat}
                      </span>
                    </div>

                    <div className="mt-5 flex justify-center">
                      {secretary.image ? (
                        <img
                          src={secretary.image}
                          alt={secretary.nom_complet}
                          className="h-20 w-20 rounded-full border-4 border-slate-200 object-cover"
                        />
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[linear-gradient(135deg,_#10263d_0%,_#1c4271_100%)] text-xl font-bold text-white">
                          {secretary.nom_complet
                            .split(/\s+/)
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((part) => part[0])
                            .join('')
                            .toUpperCase() || 'SG'}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 text-center">
                      <h3 className="text-lg font-bold text-slate-950">{secretary.nom_complet}</h3>
                      <p className="mt-1 text-sm font-medium text-[#1e40af]">{secretary.poste}</p>
                    </div>

                    <div className="mt-4 space-y-2 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                      {secretary.filiere && (
                        <p>
                          <span className="font-semibold text-slate-800">Filière:</span> {secretary.filiere}
                        </p>
                      )}
                      {secretary.promotion && (
                        <p>
                          <span className="font-semibold text-slate-800">Promotion:</span> {secretary.promotion}
                        </p>
                      )}
                      {secretary.campus && (
                        <p>
                          <span className="font-semibold text-slate-800">Campus:</span> {secretary.campus}
                        </p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {leaders.length > 0 && currentLeader && (
          <section className="px-4 pb-16 sm:px-6">
            <div className="mx-auto max-w-7xl rounded-[36px] border border-slate-200 bg-white p-6 shadow-[0_25px_80px_rgba(15,23,42,0.08)] sm:p-8">
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Leadership</p>
                <h2 className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">Les personnes qui portent la vision</h2>
                <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                  Une équipe engagée qui anime la communauté, structure les initiatives et donne une direction claire au projet collectif.
                </p>
              </div>

              <div className="mt-10 overflow-hidden rounded-[30px] border border-slate-200 bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)] shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
                <div className="grid gap-0 lg:grid-cols-[minmax(320px,0.78fr)_minmax(0,1fr)]">
                  <div className="min-h-[320px] bg-[#10263d] lg:min-h-full">
                    {currentLeader.image ? (
                      <img
                        src={currentLeader.image}
                        alt={`${currentLeader.prenom} ${currentLeader.nom}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full min-h-[320px] items-center justify-center bg-[linear-gradient(135deg,_#10263d_0%,_#1c4271_100%)] text-white">
                        <span className="text-7xl font-bold">
                          {currentLeader.prenom[0]}
                          {currentLeader.nom[0]}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-6 sm:p-8 lg:p-10">
                    <div className="border-b border-slate-200 pb-6">
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Profil du moment</p>
                      <h3 className="mt-3 break-words text-3xl font-bold text-slate-950 sm:text-4xl">
                        {currentLeader.prenom} {currentLeader.nom}
                      </h3>
                      <p className="mt-3 text-xl font-semibold text-[#1e40af]">{currentLeader.position}</p>
                      <div className="mt-4 inline-flex rounded-full bg-[#fff3df] px-4 py-2 text-sm font-semibold text-[#b45309]">
                        Mandat: {currentLeader.executive}
                      </div>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-start gap-3">
                          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#1e40af]" />
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Email</p>
                            <a href={`mailto:${currentLeader.email}`} className="mt-1 block break-all text-sm font-medium text-slate-700 hover:text-[#1e40af]">
                              {currentLeader.email}
                            </a>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-start gap-3">
                          <Globe className="mt-0.5 h-4 w-4 shrink-0 text-[#1e40af]" />
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Nationalité</p>
                            <p className="mt-1 text-sm font-medium text-slate-700">
                              {currentLeader.nationality} {currentLeader.flag}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-start gap-3">
                          <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-[#1e40af]" />
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Filière</p>
                            <p className="mt-1 text-sm font-medium text-slate-700">{currentLeader.filiere}</p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-start gap-3">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#1e40af]" />
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Campus</p>
                            <p className="mt-1 text-sm font-medium text-slate-700">{currentLeader.campus}</p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
                        <div className="flex items-start gap-3">
                          <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-[#1e40af]" />
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Mandat</p>
                            <p className="mt-1 text-sm font-medium text-slate-700">{currentLeader.mandat}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 rounded-[24px] bg-[linear-gradient(135deg,_#10263d_0%,_#1c4271_100%)] p-5 text-white">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">Mission personnelle</p>
                      <p className="mt-3 text-sm leading-7 text-white/85">{currentLeader.mission}</p>
                    </div>

                    {currentLeader.linkedin && (
                      <div className="mt-6 flex gap-3 border-t border-slate-200 pt-6">
                        <a
                          href={currentLeader.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#edf4ff] text-[#1e40af] transition-all hover:-translate-y-0.5 hover:bg-[#0077b5] hover:text-white"
                        >
                          <Linkedin className="h-5 w-5" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-center gap-4">
                <button
                  onClick={handlePrevLeader}
                  disabled={leaders.length <= 1}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-[#10263d] transition-all hover:border-[#f59f24] hover:bg-[#f59f24] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <div className="flex flex-wrap gap-2">
                  {leaders.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentLeaderIndex(index)}
                      className={`rounded-full transition-all ${
                        index === currentLeaderIndex ? 'h-3 w-8 bg-[#f59f24]' : 'h-3 w-3 bg-slate-300 hover:bg-slate-400'
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={handleNextLeader}
                  disabled={leaders.length <= 1}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-[#10263d] transition-all hover:border-[#f59f24] hover:bg-[#f59f24] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </section>
        )}
      </div>

      <Footer />
    </>
  );
};

export default APropos;
