import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CalendarDays, CheckCircle, Filter, GraduationCap, LayoutGrid, Sparkles, X } from 'lucide-react';
import { HeaderConnected } from '@/components/layout/HeaderConnected';
import Footer from '@/components/layout/Footer';
import { Calendar } from '@/components/activity/Calendar';
import { ActivityCard, Activity } from '@/components/activity/ActivityCard';
import { ActivityTabs, ActivityTab } from '@/components/activity/ActivityTabs';
import { ActivityService } from '@/services/activityService';
import { Activity as ApiActivity } from '@/types/activity';
import { AuthService } from '@/services/authService';

export const ListesActiviteConnected: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ActivityTab>('tous');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [rawActivities, setRawActivities] = useState<ApiActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackCard, setFeedbackCard] = useState<{
    type: 'success' | 'error';
    title: string;
    message: string;
  } | null>(null);

  const mapCategoryToTab = (category: string): 'tous' | 'formations' | 'evenements' => {
    if (category === 'formation') return 'formations';
    return 'evenements';
  };

  const parseActivityDate = (value?: string) => {
    if (!value) return null;

    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      return {
        year: Number(year),
        month: Number(month) - 1,
        day: Number(day),
      };
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
      return null;
    }

    return {
      year: parsedDate.getFullYear(),
      month: parsedDate.getMonth(),
      day: parsedDate.getDate(),
    };
  };

  const isSameCalendarDay = (value: string | undefined, date: Date) => {
    const parsedDate = parseActivityDate(value);
    if (!parsedDate) return false;

    return (
      parsedDate.year === date.getFullYear() &&
      parsedDate.month === date.getMonth() &&
      parsedDate.day === date.getDate()
    );
  };

  const mapToUrgency = (eventDate: string | undefined): 'urgent' | 'normal' => {
    if (!eventDate) return 'normal';
    const date = new Date(eventDate);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7 ? 'urgent' : 'normal';
  };

  const formatActivity = (a: ApiActivity): Activity => ({
    id: String(a.id),
    title: a.title,
    date: a.event_date
      ? new Date(a.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
      : 'Date à définir',
    location: a.location || 'Lieu à définir',
    category: mapCategoryToTab(a.category),
    urgency: mapToUrgency(a.event_date),
    image: a.image_url || a.imageUrl,
    registrations: a.registrations_count || 0,
  });

  useEffect(() => {
    const fetchActivities = async () => {
      setIsLoading(true);
      try {
        const apiActivities = await ActivityService.getAllActivities();
        setRawActivities(apiActivities);
        setActivities(apiActivities.map(formatActivity));
      } catch (error) {
        console.error('Erreur lors du chargement des activités:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchActivities();
  }, []);

  // Dates ISO de toutes les activités pour le calendrier
  const activityDates = rawActivities
    .filter(a => a.event_date)
    .map(a => a.event_date as string);

  // Filtrage : onglet + date sélectionnée
  const getFilteredActivities = (): Activity[] => {
    let filtered = activities;

    // Filtre par onglet
    if (activeTab !== 'tous') {
      filtered = filtered.filter(a => a.category === activeTab);
    }

    // Filtre par date sélectionnée
    if (selectedDate) {
      filtered = filtered.filter(a => {
        const raw = rawActivities.find(r => String(r.id) === a.id);
        return isSameCalendarDay(raw?.event_date, selectedDate);
      });
    }

    return filtered;
  };

  const handleDateSelect = (date: Date) => {
    // Cliquer sur la même date désélectionne
    if (
      selectedDate &&
      selectedDate.getDate() === date.getDate() &&
      selectedDate.getMonth() === date.getMonth() &&
      selectedDate.getFullYear() === date.getFullYear()
    ) {
      setSelectedDate(undefined);
    } else {
      setSelectedDate(date);
    }
  };

  const handleJoinActivity = async (activityId: string) => {
    const isAuth = await AuthService.checkAuth();
    if (!isAuth) {
      setFeedbackCard({
        type: 'error',
        title: 'Connexion requise',
        message: 'Veuillez vous connecter pour vous inscrire à une activité.',
      });
      navigate('/connexion', { state: { from: '/activities' } });
      return;
    }

    try {
      await ActivityService.registerToActivity(Number(activityId));
      setActivities(prev => prev.map(a =>
        a.id === activityId
          ? { ...a, registrations: (a.registrations || 0) + 1 }
          : a
      ));
      setFeedbackCard({
        type: 'success',
        title: 'Inscription réussie',
        message: 'Vous participez maintenant à cette activité.',
      });
    } catch (error: any) {
      console.error('Erreur lors de l\'inscription:', error);
      if (error.status === 409) {
        setFeedbackCard({
          type: 'error',
          title: 'Déjà inscrit',
          message: 'Vous êtes déjà inscrit à cette activité.',
        });
      } else if (error.status === 410) {
        setFeedbackCard({
          type: 'error',
          title: 'Activité complète',
          message: 'Cette activité est complète.',
        });
      } else if (error.status === 422) {
        const backendMessage = error?.data?.message || error?.detail;
        setFeedbackCard({
          type: 'error',
          title: 'Inscription indisponible',
          message: backendMessage || 'Les inscriptions sont fermées pour cette activité.',
        });
      } else {
        setFeedbackCard({
          type: 'error',
          title: 'Erreur d\'inscription',
          message: 'Erreur lors de l\'inscription. Veuillez réessayer.',
        });
      }
    }
  };

  const handleViewDetails = (activityId: string) => {
    navigate(`/activity/${activityId}`);
  };

  const filteredActivities = useMemo(() => getFilteredActivities(), [activities, rawActivities, activeTab, selectedDate]);

  const selectedDayActivities = useMemo(() => {
    if (!selectedDate) return [];
    return filteredActivities.filter((activity) => {
      const raw = rawActivities.find((entry) => String(entry.id) === activity.id);
      return isSameCalendarDay(raw?.event_date, selectedDate);
    });
  }, [filteredActivities, rawActivities, selectedDate]);

  const totalActivities = activities.length;
  const formationsCount = activities.filter((activity) => activity.category === 'formations').length;
  const evenementsCount = activities.filter((activity) => activity.category === 'evenements').length;

  const selectedDateLabel = selectedDate
    ? selectedDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  const closeSelectedDayModal = () => {
    setSelectedDate(undefined);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <HeaderConnected />
        <header className="bg-[#172d45] px-4 py-8 text-white sm:px-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">Activités</h1>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8 flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HeaderConnected />

      <header className="relative overflow-hidden bg-[#172d45] px-4 py-10 text-white sm:px-6 sm:py-14">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(245,159,36,0.28),_transparent_32%),radial-gradient(circle_at_left,_rgba(59,130,246,0.18),_transparent_28%)]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.8fr)_minmax(280px,1fr)] lg:items-end">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/80">
                <Sparkles className="h-4 w-4 text-[#f59f24]" />
                Vie étudiante connectée
              </span>
              <div className="space-y-3">
                <h1 className="max-w-3xl text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">
                  Vos activités, vos inscriptions, vos prochains temps forts.
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-white/78 sm:text-base">
                  Suivez les événements et formations de la CEEAM dans une interface plus claire, avec un accès direct au calendrier, aux détails et à l'inscription.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-white/65">Total</p>
                <p className="mt-2 text-3xl font-bold">{totalActivities}</p>
                <p className="mt-1 text-sm text-white/75">activités publiées</p>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-white/65">Formations</p>
                <p className="mt-2 text-3xl font-bold">{formationsCount}</p>
                <p className="mt-1 text-sm text-white/75">parcours à suivre</p>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-white/65">Événements</p>
                <p className="mt-2 text-3xl font-bold">{evenementsCount}</p>
                <p className="mt-1 text-sm text-white/75">moments à venir</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex-1 w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {feedbackCard && (
          <div className="mb-6">
            <div
              className={`rounded-2xl border p-4 shadow-sm ${
                feedbackCard.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50'
                  : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0">
                  {feedbackCard.type === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-semibold ${
                      feedbackCard.type === 'success' ? 'text-emerald-900' : 'text-red-900'
                    }`}
                  >
                    {feedbackCard.title}
                  </p>
                  <p
                    className={`mt-1 text-sm ${
                      feedbackCard.type === 'success' ? 'text-emerald-800' : 'text-red-800'
                    }`}
                  >
                    {feedbackCard.message}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFeedbackCard(null)}
                  className="rounded-full p-1 text-gray-500 transition-colors hover:bg-white/60 hover:text-gray-700"
                  aria-label="Fermer la notification"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

              <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)] xl:items-start">
                <aside className="space-y-6 xl:sticky xl:top-24">
                  <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_20px_60px_rgba(23,45,69,0.08)] sm:p-5">
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Calendrier</p>
                        <h2 className="mt-1 text-xl font-bold text-[#172d45]">Repérez vos dates clés</h2>
                      </div>
                      <div className="rounded-2xl bg-[#172d45]/6 p-3 text-[#172d45]">
                        <CalendarDays className="h-5 w-5" />
                      </div>
                    </div>

                    <Calendar
                      onDateSelect={handleDateSelect}
                      selectedDate={selectedDate}
                      activityDates={activityDates}
                    />

                    <div className="mt-4 rounded-2xl border border-dashed border-[#f59f24]/35 bg-[#fff7ed] p-4">
                      <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-[#f59f24]/15 p-2 text-[#c46b10]">
                          <Filter className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-900">Filtre actif</p>
                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            {selectedDateLabel ? (
                              <>
                                Activités du <strong>{selectedDateLabel}</strong>
                              </>
                            ) : (
                              'Aucune date précise sélectionnée. Le calendrier vous aide à cibler rapidement une journée.'
                            )}
                          </p>
                          {selectedDate && (
                            <button
                              onClick={() => setSelectedDate(undefined)}
                              className="mt-3 text-sm font-semibold text-[#c46b10] transition-colors hover:text-[#a7570f]"
                            >
                              Réinitialiser le filtre
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                  </section>

                  <section
                    className="rounded-[28px] border border-orange-200 p-6 text-left"
                    style={{
                      background: 'linear-gradient(135deg, #fff1df 0%, #ffd8a8 100%)',
                      boxShadow: '0 18px 48px rgba(194, 101, 19, 0.14)',
                    }}
                  >
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">
                      <Sparkles className="h-4 w-4" />
                      Initiative
                    </span>
                    <h2 className="mt-4 text-2xl font-bold text-orange-800">
                      Une idée d'activité à lancer ?
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-orange-950/75 sm:text-base">
                      Proposez un atelier, une rencontre ou un événement et contribuez directement à la vie étudiante de la CEEAM.
                    </p>
                    <Link
                      to="/proposer-activite-connected"
                      className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 px-5 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-orange-700 sm:text-base"
                      style={{ boxShadow: '0 10px 30px rgba(194, 65, 12, 0.25)' }}
                    >
                      <Sparkles className="h-5 w-5" />
                      Proposer une activité
                    </Link>
                  </section>
                </aside>

                <section className="rounded-[32px] border border-slate-200 bg-[linear-gradient(180deg,_rgba(255,255,255,1)_0%,_rgba(248,250,252,1)_100%)] p-4 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:p-6 lg:p-8">
                  <div className="flex flex-col gap-5 border-b border-slate-200 pb-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                      <div className="space-y-2">
                        <span className="inline-flex items-center gap-2 rounded-full bg-[#172d45]/6 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#172d45]">
                          <LayoutGrid className="h-4 w-4" />
                          Catalogue des activités
                        </span>
                        <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">Explorez les activités disponibles</h2>
                        <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                          Alternez entre formations et événements, ouvrez les détails utiles et inscrivez-vous sans quitter la page.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Résultats</p>
                          <p className="mt-2 text-2xl font-bold text-slate-950">{filteredActivities.length}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Formations</p>
                          <p className="mt-2 text-2xl font-bold text-slate-950">{formationsCount}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 col-span-2 sm:col-span-1">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Événements</p>
                          <p className="mt-2 text-2xl font-bold text-slate-950">{evenementsCount}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <ActivityTabs activeTab={activeTab} onTabChange={setActiveTab} />

                      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 font-medium text-slate-700">
                          <GraduationCap className="h-4 w-4 text-[#f59f24]" />
                          {activeTab === 'tous' ? 'Toutes les catégories' : activeTab === 'formations' ? 'Formations' : 'Événements'}
                        </span>
                        {selectedDateLabel && (
                          <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-2 font-medium text-orange-700">
                            <CalendarDays className="h-4 w-4" />
                            {selectedDateLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-5">
                    {filteredActivities.length > 0 ? (
                      filteredActivities.map((activity) => (
                        <ActivityCard
                          key={activity.id}
                          activity={activity}
                          onJoin={handleJoinActivity}
                          onViewDetails={handleViewDetails}
                        />
                      ))
                    ) : (
                      <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
                        <p className="text-lg font-semibold text-slate-800">Aucune activité trouvée</p>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          Essayez une autre catégorie ou retirez le filtre de date pour retrouver l'ensemble des activités publiées.
                        </p>
                      </div>
                    )}
                  </div>
                </section>
        </div>
      </main>

      {selectedDate && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-3 sm:items-center sm:p-6"
          onClick={closeSelectedDayModal}
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.28)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Jour sélectionné</p>
                <h3 className="mt-1 text-lg font-bold text-slate-950">{selectedDateLabel}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedDayActivities.length} activité{selectedDayActivities.length > 1 ? 's' : ''} trouvée{selectedDayActivities.length > 1 ? 's' : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={closeSelectedDayModal}
                className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label="Fermer le panneau du jour"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[56vh] space-y-3 overflow-y-auto px-5 py-5 sm:px-6">
              {selectedDayActivities.length > 0 ? (
                selectedDayActivities.map((activity) => (
                  <button
                    key={activity.id}
                    type="button"
                    onClick={() => handleViewDetails(activity.id)}
                    className="flex w-full items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white hover:shadow-md"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900">{activity.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{activity.location}</p>
                      <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-blue-700">{activity.category}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      Ouvrir
                    </span>
                  </button>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                  Aucune activité ne correspond aux filtres pour cette date.
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                onClick={closeSelectedDayModal}
                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(undefined)}
                className="rounded-2xl bg-[#172d45] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0f2236]"
              >
                Retirer le filtre
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default ListesActiviteConnected;