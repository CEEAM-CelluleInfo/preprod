import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  GraduationCap,
  LibraryBig,
  MapPinned,
  Shapes,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { API_BASE_URL } from '@/services/api.config';

interface Club {
  id: number;
  name: string;
  interest: string;
  logo_url?: string;
}

interface AcademicDate {
  label: string;
  date: string;
  semester: 1 | 2;
}

interface AcademicCalendar {
  academicYear: string;
  exportUrl?: string;
  dates: AcademicDate[];
}

interface PracticalInfo {
  id: number;
  title: string;
  description: string;
  link_label: string;
  link_url: string;
  color: string;
  order: number;
}

interface SchoolMedia {
  id: number;
  url: string;
  alt: string;
  position: 1 | 2 | 3;
}

interface StudentGuide {
  url: string;
  filename: string;
  updatedAt: string;
}

const defaultPracticalCards: PracticalInfo[] = [
  {
    id: 1,
    title: 'Logement étudiant',
    description: 'Découvrez les options de logement disponibles sur le campus et à proximité.',
    link_label: 'En savoir plus',
    link_url: '#',
    color: '#10263d',
    order: 1,
  },
  {
    id: 2,
    title: 'Restauration',
    description: 'Restaurants universitaires, cafétérias et repères utiles pour le quotidien.',
    link_label: 'Voir les services',
    link_url: '#',
    color: '#1d8348',
    order: 2,
  },
  {
    id: 3,
    title: 'Bibliothèque',
    description: 'Accédez aux ressources documentaires, salles de travail et horaires utiles.',
    link_label: 'Horaires & services',
    link_url: '#',
    color: '#2563eb',
    order: 3,
  },
  {
    id: 4,
    title: 'Services administratifs',
    description: 'Retrouvez les démarches de scolarité, attestations, inscriptions et contacts.',
    link_label: 'Voir les contacts',
    link_url: '#',
    color: '#7c3aed',
    order: 4,
  },
];

export const Ecole: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [clubs, setClubs] = useState<Club[]>([]);
  const [calendar, setCalendar] = useState<AcademicCalendar | null>(null);
  const [practicalInfos, setPracticalInfos] = useState<PracticalInfo[]>([]);
  const [media, setMedia] = useState<SchoolMedia[]>([]);
  const [guide, setGuide] = useState<StudentGuide | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clubsPerPage = 4;
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = Math.ceil(clubs.length / clubsPerPage);
  const currentClubs = clubs.slice(currentPage * clubsPerPage, (currentPage + 1) * clubsPerPage);

  const handlePrevPage = () => {
    setCurrentPage((prev) => (prev > 0 ? prev - 1 : Math.max(totalPages - 1, 0)));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => (prev < totalPages - 1 ? prev + 1 : 0));
  };

  useEffect(() => {
    const fetchData = async () => {
      const loadJson = async <T,>(url: string, errorMessage: string): Promise<T> => {
        const response = await fetch(url, {
          headers: {
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(errorMessage);
        }

        return response.json() as Promise<T>;
      };

      try {
        const [clubsResult, calendarResult, infoResult, mediaResult, guideResult] = await Promise.allSettled([
          loadJson<{ data?: Club[] }>(`${API_BASE_URL}/school/clubs/`, 'Erreur chargement clubs'),
          loadJson<AcademicCalendar>(`${API_BASE_URL}/school/academic-calendar/`, 'Erreur chargement calendrier'),
          loadJson<{ data?: PracticalInfo[] }>(`${API_BASE_URL}/school/practical-info/`, 'Erreur chargement informations pratiques'),
          loadJson<{ data?: SchoolMedia[] }>(`${API_BASE_URL}/school/media/`, 'Erreur chargement médias'),
          loadJson<StudentGuide>(`${API_BASE_URL}/school/student-guide/`, 'Erreur chargement guide étudiant'),
        ]);

        if (clubsResult.status === 'fulfilled') {
          setClubs(clubsResult.value.data || []);
        }

        if (calendarResult.status === 'fulfilled') {
          setCalendar(calendarResult.value);
        }

        if (infoResult.status === 'fulfilled') {
          setPracticalInfos(infoResult.value.data || []);
        } else {
          console.warn('Info pratiques non disponibles');
        }

        if (mediaResult.status === 'fulfilled') {
          setMedia(mediaResult.value.data || []);
        }

        if (guideResult.status === 'fulfilled') {
          setGuide(guideResult.value);
        } else {
          console.warn('Guide étudiant non disponible');
        }

        if (
          clubsResult.status === 'rejected' &&
          calendarResult.status === 'rejected' &&
          mediaResult.status === 'rejected'
        ) {
          throw clubsResult.reason;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const heroMedia = {
    pos1: media.find((item) => item.position === 1),
    pos2: media.find((item) => item.position === 2),
    pos3: media.find((item) => item.position === 3),
  };

  const displayedPracticalInfos = useMemo(
    () => (practicalInfos.length > 0 ? practicalInfos : defaultPracticalCards),
    [practicalInfos]
  );

  const semesterOneDates = calendar?.dates.filter((date) => date.semester === 1) || [];
  const semesterTwoDates = calendar?.dates.filter((date) => date.semester === 2) || [];

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

  if (error && !clubs.length && !calendar) {
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

      <div className="bg-[#f5f7fb]">
        <section className="relative overflow-hidden bg-[#10263d] text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(245,159,36,0.28),_transparent_28%),radial-gradient(circle_at_left,_rgba(59,130,246,0.18),_transparent_24%)]" />
          <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.9fr)] lg:items-center">
              <div className="space-y-5">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/80">
                  <GraduationCap className="h-4 w-4 text-[#f59f24]" />
                  ENSAM Meknès
                </span>
                <div className="space-y-4">
                  <h1 className="max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
                    Une école d'ingénieurs pensée pour l'excellence, le terrain et la vie de campus.
                  </h1>
                  <p className="max-w-2xl text-sm leading-7 text-white/78 sm:text-base">
                    Explorez les ressources utiles, les clubs, les repères académiques et les services qui structurent l'expérience étudiante à l'École Nationale Supérieure Arts & Métiers.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <div className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/10 px-4 py-3 text-sm text-white/85">
                    <LibraryBig className="h-4 w-4 text-[#f59f24]" />
                    Institution d'excellence et d'innovation
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/10 px-4 py-3 text-sm text-white/85">
                    <Shapes className="h-4 w-4 text-[#f59f24]" />
                    Vie académique et associative structurée
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
                {heroMedia.pos1 && (
                  <div className="overflow-hidden rounded-[26px] border border-white/12 bg-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.16)]">
                    <img src={heroMedia.pos1.url} alt={heroMedia.pos1.alt} className="h-44 w-full object-cover sm:h-52" />
                  </div>
                )}
                {heroMedia.pos2 && (
                  <div className="overflow-hidden rounded-[26px] border border-white/12 bg-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.16)]">
                    <img src={heroMedia.pos2.url} alt={heroMedia.pos2.alt} className="h-44 w-full object-cover sm:h-52" />
                  </div>
                )}
                {heroMedia.pos3 && (
                  <div className="col-span-2 overflow-hidden rounded-[30px] border border-white/12 bg-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.16)]">
                    <img src={heroMedia.pos3.url} alt={heroMedia.pos3.alt} className="h-52 w-full object-cover sm:h-64" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="relative -mt-8 px-4 pb-8 sm:px-6 sm:-mt-10 sm:pb-10">
          <div className="mx-auto max-w-7xl rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_25px_80px_rgba(15,23,42,0.08)] sm:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Repères utiles</p>
                <h2 className="mt-2 text-3xl font-bold text-slate-950">Informations pratiques</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Les bons points d'entrée pour le logement, la restauration, la bibliothèque et les démarches du quotidien.
                </p>
              </div>
              {guide ? (
                <a
                  href={guide.url}
                  download={guide.filename}
                  className="inline-flex items-center gap-2 self-start rounded-2xl bg-[#f59f24] px-5 py-3 text-sm font-semibold text-[#10263d] transition-all hover:-translate-y-0.5 hover:bg-[#ffb74f] lg:self-auto"
                >
                  <Download className="h-4 w-4" />
                  Télécharger le guide étudiant
                </a>
              ) : (
                <button
                  className="inline-flex items-center gap-2 self-start rounded-2xl bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-500 lg:self-auto"
                  disabled
                >
                  <Download className="h-4 w-4" />
                  Guide bientôt disponible
                </button>
              )}
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {displayedPracticalInfos.map((info) => (
                <article
                  key={info.id}
                  className="group relative overflow-hidden rounded-[28px] p-5 text-white shadow-[0_18px_48px_rgba(15,23,42,0.10)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_60px_rgba(15,23,42,0.14)]"
                  style={{ backgroundColor: info.color }}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.12),transparent_52%)]" />
                  <div className="relative flex h-full flex-col">
                    <h3 className="text-lg font-bold">{info.title}</h3>
                    <p className="mt-3 flex-1 text-sm leading-6 text-white/88">{info.description}</p>
                    <a
                      href={info.link_url}
                      target={info.link_url.startsWith('http') ? '_blank' : '_self'}
                      rel="noopener noreferrer"
                      className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    >
                      {info.link_label}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-8 sm:px-6 sm:py-10">
          <div className="mx-auto max-w-7xl rounded-[32px] border border-slate-200 bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)] p-6 shadow-[0_25px_80px_rgba(15,23,42,0.06)] sm:p-8">
            <div className="flex flex-col gap-6 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Vie associative</p>
                <h2 className="mt-2 text-3xl font-bold text-slate-950">Clubs de l'école</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Des espaces pour expérimenter, créer, organiser, rencontrer et prolonger la formation au-delà des cours.
                </p>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-3 self-start lg:self-auto">
                  <button
                    onClick={handlePrevPage}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-[#10263d] transition-all hover:border-[#f59f24] hover:bg-[#f59f24] hover:text-white"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600">
                    Page {currentPage + 1} / {Math.max(totalPages, 1)}
                  </div>
                  <button
                    onClick={handleNextPage}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-[#10263d] transition-all hover:border-[#f59f24] hover:bg-[#f59f24] hover:text-white"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {currentClubs.length > 0 ? (
                currentClubs.map((club) => (
                  <article
                    key={club.id}
                    className="group rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_60px_rgba(15,23,42,0.10)]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#f59f24] text-base font-bold text-white">
                        {club.logo_url ? (
                          <img src={club.logo_url} alt={club.name} className="h-full w-full object-cover" />
                        ) : (
                          club.name.charAt(0)
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="break-words text-lg font-bold text-slate-950">{club.name}</h3>
                        <p className="mt-1 text-sm text-slate-500">{club.interest}</p>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="md:col-span-2 xl:col-span-4 rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  Les clubs sont temporairement indisponibles. Les autres informations de l'ecole restent accessibles.
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex justify-center gap-2">
                {Array.from({ length: totalPages }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPage(index)}
                    className={`rounded-full transition-all ${
                      index === currentPage ? 'h-3 w-8 bg-[#f59f24]' : 'h-3 w-3 bg-slate-300 hover:bg-slate-400'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {calendar && calendar.dates.length > 0 && (
          <section className="px-4 pb-16 sm:px-6">
            <div className="mx-auto max-w-7xl overflow-hidden rounded-[36px] border border-slate-200 bg-[#10263d] text-white shadow-[0_30px_90px_rgba(16,38,61,0.20)]">
              <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:px-10 lg:py-10">
                <div className="space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/55">Calendrier académique</p>
                  <h2 className="text-3xl font-bold text-white">Dates utiles</h2>
                  <p className="text-sm leading-6 text-white/72">
                    Retrouvez les repères essentiels de l'année académique, semestre par semestre, avec un accès rapide à l'export du calendrier.
                  </p>
                  <div className="rounded-[28px] border border-white/10 bg-white/8 p-5">
                    <div className="flex items-start gap-3">
                      <div className="rounded-2xl bg-white/10 p-3 text-[#f59f24]">
                        <CalendarDays className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Année académique {calendar.academicYear}</p>
                        <p className="mt-1 text-sm text-white/65">Un repère synthétique pour mieux planifier le semestre et les échéances importantes.</p>
                      </div>
                    </div>
                    {calendar.exportUrl && (
                      <a
                        href={calendar.exportUrl}
                        download
                        className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#f59f24] px-5 py-3 text-sm font-semibold text-[#10263d] transition-all hover:-translate-y-0.5 hover:bg-[#ffb74f]"
                      >
                        <Download className="h-4 w-4" />
                        Exporter le calendrier
                      </a>
                    )}
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="rounded-[28px] border border-white/10 bg-white/8 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">Semestre 1</p>
                    <div className="mt-4 space-y-3">
                      {semesterOneDates.map((date, index) => (
                        <div key={`${date.label}-${index}`} className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                          <p className="text-sm font-semibold text-white">{date.label}</p>
                          <p className="mt-1 text-sm text-white/65">{date.date}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-white/10 bg-white/8 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">Semestre 2</p>
                    <div className="mt-4 space-y-3">
                      {semesterTwoDates.map((date, index) => (
                        <div key={`${date.label}-${index}`} className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                          <p className="text-sm font-semibold text-white">{date.label}</p>
                          <p className="mt-1 text-sm text-white/65">{date.date}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="px-4 pb-16 sm:px-6">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-[36px] border border-slate-200 bg-[linear-gradient(135deg,_#ffffff_0%,_#eef4ff_62%,_#fff4df_140%)] p-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_auto] lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Accès rapide</p>
                <h2 className="mt-3 text-3xl font-bold text-slate-950 sm:text-4xl">
                  Besoin d'explorer davantage la vie du campus ?
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
                  Naviguez vers les autres espaces de la plateforme CEEAM pour découvrir les activités, la communauté des lauréats et les ressources utiles à votre intégration.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                <Link
                  to="/activites"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#10263d] px-5 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[#0c1d2e]"
                >
                  <Shapes className="h-4 w-4" />
                  Voir les activités
                </Link>
                <Link
                  to="/laureats"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-all hover:border-[#10263d] hover:text-[#10263d]"
                >
                  <MapPinned className="h-4 w-4" />
                  Explorer les lauréats
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
};

export default Ecole;
