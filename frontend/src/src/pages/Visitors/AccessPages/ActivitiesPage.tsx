import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Star,
  Sparkles,
  Download
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ActivityService } from '@/services/activityService';
import { Activity as ApiActivity } from '@/types/activity';
import { AuthService } from '@/services/authService';

interface Activity {
  id: number;
  title: string;
  category: string;
  description: string;
  longDescription: string;
  date: string;
  location: string;
  participants: number;
  duration: string;
  image: string;
  stars: number;
  isUpcoming?: boolean;
}

interface UpcomingEvent {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
}

// Mapping des catégories backend vers frontend
const categoryMapping: { [key: string]: string } = {
  'integration': 'Social',
  'formation': 'Académique',
  'culture': 'Culture',
  'networking': 'Social',
  'sport': 'Sport',
};

const ACTIVITIES_PAGE_SIZE = 6;
const UPCOMING_EVENTS_DEFAULT_VISIBLE = 4;

const formatActivity = (a: ApiActivity): Activity => ({
  id: a.id,
  title: a.title,
  category: a.categoryLabel || categoryMapping[String(a.category)] || 'Autre',
  description: a.description,
  longDescription: a.long_description || a.longDescription || a.description,
  date: a.date || (
    a.event_date
      ? new Date(a.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      : 'Date à définir'
  ),
  location: a.location || 'Lieu à définir',
  participants: a.currentParticipants || a.registrations_count || a.participants || 0,
  duration: a.duration || '2h',
  image: a.image || a.image_url || a.imageUrl || '',
  stars: a.stars || a.likes_count || a.likes || 0,
  isUpcoming: a.isUpcoming ?? a.is_upcoming ?? a.upcoming,
});

export const ActivitiesPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('Tous');
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [starredActivities, setStarredActivities] = useState<Set<number>>(new Set());
  const [activities, setActivities] = useState<Activity[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [filters, setFilters] = useState<string[]>(['Tous', 'Sport', 'Culture', 'Social', 'Académique', 'Bénévolat']);
  const [activitiesPage, setActivitiesPage] = useState(1);
  const [activitiesTotal, setActivitiesTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [isLoadingMoreActivities, setIsLoadingMoreActivities] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const redirectAuthenticatedUsers = async () => {
      const cachedUser = AuthService.getCurrentUser();
      if (cachedUser) {
        navigate('/activities', { replace: true });
        return;
      }

      const user = await AuthService.fetchCurrentUser();
      if (user && isMounted) {
        navigate('/activities', { replace: true });
      }
    };

    void redirectAuthenticatedUsers();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const mapFilterToApiCategory = (filterValue: string): string | undefined => {
    if (filterValue === 'Tous') {
      return undefined;
    }
    return filterValue;
  };

  const fetchActivitiesPage = useCallback(async (page: number, append: boolean, filterValue: string) => {
    const response = await ActivityService.getActivities({
      category: mapFilterToApiCategory(filterValue),
      page,
      limit: ACTIVITIES_PAGE_SIZE,
    });

    const apiActivities = response.data || [];
    const formattedActivities = apiActivities.map(formatActivity);

    setActivities((prev) => {
      const merged = append ? [...prev, ...formattedActivities] : formattedActivities;
      const seen = new Set<number>();
      const unique: Activity[] = [];

      for (const item of merged) {
        if (seen.has(item.id)) {
          continue;
        }
        seen.add(item.id);
        unique.push(item);
      }

      return unique;
    });

    setActivitiesPage(page);
    setActivitiesTotal(response.total || formattedActivities.length);

    const likedIds = apiActivities
      .filter((activity) => activity.userLiked || activity.user_liked)
      .map((activity) => activity.id);

    setStarredActivities((prev) => {
      const next = append ? new Set(prev) : new Set<number>();
      likedIds.forEach((id) => next.add(id));
      return next;
    });
  }, []);

  // Chargement initial (catégories + événements à venir + première page d'activités)
  useEffect(() => {
    const bootstrap = async () => {
      setIsLoading(true);
      try {
        const [upcomingEventsResponse, categories] = await Promise.all([
          ActivityService.getUpcomingEvents(8),
          ActivityService.getActivityCategories(),
        ]);

        setUpcomingEvents(upcomingEventsResponse || []);

        if (categories.length > 0) {
          setFilters(categories);
        }

        await fetchActivitiesPage(1, false, 'Tous');
        setBootstrapped(true);
      } catch (error) {
        console.error('Erreur lors du chargement des activités:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void bootstrap();
  }, [fetchActivitiesPage]);

  // Rechargement des activités quand le filtre change
  useEffect(() => {
    if (!bootstrapped) {
      return;
    }

    const reloadForFilter = async () => {
      setIsLoadingActivities(true);
      try {
        await fetchActivitiesPage(1, false, activeFilter);
      } catch (error) {
        console.error('Erreur lors du filtrage des activités:', error);
      } finally {
        setIsLoadingActivities(false);
      }
    };

    void reloadForFilter();
  }, [activeFilter, bootstrapped, fetchActivitiesPage]);

  const hasMoreActivities = activities.length < activitiesTotal;
  const visibleEvents = showAllEvents ? upcomingEvents : upcomingEvents.slice(0, UPCOMING_EVENTS_DEFAULT_VISIBLE);

  const handleLoadMoreActivities = async () => {
    if (isLoadingMoreActivities || !hasMoreActivities) {
      return;
    }

    setIsLoadingMoreActivities(true);
    try {
      await fetchActivitiesPage(activitiesPage + 1, true, activeFilter);
    } catch (error) {
      console.error('Erreur lors du chargement des activités supplémentaires:', error);
    } finally {
      setIsLoadingMoreActivities(false);
    }
  };

  const handleShowLessActivities = async () => {
    setIsLoadingActivities(true);
    try {
      await fetchActivitiesPage(1, false, activeFilter);
    } catch (error) {
      console.error('Erreur lors de la réduction de la liste des activités:', error);
    } finally {
      setIsLoadingActivities(false);
    }
  };

  const toggleStar = async (activityId: number) => {
    const isAuthenticated = await AuthService.checkAuth();
    if (!isAuthenticated) {
      navigate('/connexion', { state: { from: '/activites' } });
      return;
    }

    const response = await ActivityService.toggleStar(activityId);
    if (!response) {
      return;
    }

    setActivities((prev) =>
      prev.map((activity) =>
        activity.id === activityId ? { ...activity, stars: response.stars } : activity
      )
    );

    setStarredActivities((prev) => {
      const next = new Set(prev);
      if (response.isStarred) {
        next.add(activityId);
      } else {
        next.delete(activityId);
      }
      return next;
    });
  };

  const handleMoreInfo = (activityId: number) => {
    navigate(`/activites/${activityId}`);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Sport: 'bg-blue-500',
      Culture: 'bg-purple-500',
      Social: 'bg-pink-500',
      Académique: 'bg-green-500',
      Bénévolat: 'bg-yellow-500'
    };
    return colors[category] || 'bg-gray-500';
  };

  return (
    <>
      <Header />
      
      <div className="min-h-screen bg-gray-50">
        {/* Header Section - Orange Gradient */}
        <header className="text-white px-6 py-16 text-center" style={{ background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)' }}>
          <h1 className="text-5xl font-extrabold mb-4" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
            Nos Activités
          </h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Découvrez toutes les activités organisées par la CEEAM et rejoignez-nous pour des moments inoubliables
          </p>
        </header>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            <span className="ml-3 text-gray-600">Chargement des activités...</span>
          </div>
        )}

        {!isLoading && (
          <>
            {/* Upcoming Events Section */}
            <div className="max-w-7xl mx-auto px-6 py-12">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-4xl font-bold text-gray-900 relative pb-4">
                  Événements à Venir
                  <span className="absolute bottom-0 left-0 w-24 h-1 bg-orange-500 rounded"></span>
                </h2>
                <button
                  onClick={() => setShowAllEvents(!showAllEvents)}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 border border-orange-300 rounded-lg font-semibold transition-all duration-300 hover:bg-orange-200 hover:-translate-y-0.5"
                >
                  {showAllEvents ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Voir moins
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Voir plus
                    </>
                  )}
                </button>
              </div>

              {visibleEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {visibleEvents.map((event, index) => (
                    <div
                      key={event.id}
                      className="bg-white rounded-xl p-6 border-2 border-orange-500 transition-all duration-300 hover:-translate-y-1 flex flex-col gap-3"
                      style={{
                        boxShadow: '0 4px 12px rgba(249, 115, 22, 0.1)',
                        animation: 'fadeInUp 0.5s ease forwards',
                        animationDelay: `${index * 0.1}s`,
                        opacity: 0
                      }}
                    >
                      <div className="text-lg font-bold text-orange-700 pb-2 border-b-2 border-orange-200">
                        {event.date}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {event.title}
                      </h3>
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <Clock className="w-4 h-4" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <MapPin className="w-4 h-4" />
                        <span>{event.location}</span>
                      </div>
                      <Link to={`/inscription-activity?eventId=${event.id}`} className="mt-4 px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold transition-colors duration-300 hover:bg-orange-600 inline-block text-center">
                        S'inscrire
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl p-8 text-center text-gray-500">
                  Aucun événement à venir pour le moment.
                </div>
              )}

              {/* View More/Less Button - Bottom */}
              {upcomingEvents.length > UPCOMING_EVENTS_DEFAULT_VISIBLE && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={() => setShowAllEvents(!showAllEvents)}
                    className="flex items-center gap-3 px-6 py-3 bg-white text-orange-500 border-2 border-orange-500 rounded-lg font-semibold transition-all duration-300 hover:bg-orange-50 hover:-translate-y-0.5"
                    style={{ boxShadow: '0 4px 12px rgba(249, 115, 22, 0.2)' }}
                  >
                    {showAllEvents ? (
                      <>
                        <ChevronUp className="w-5 h-5" />
                        Voir moins
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-5 h-5" />
                        Voir plus d'événements
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Activities Title */}
            <div className="max-w-7xl mx-auto px-6 pt-2 pb-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <h2 className="text-4xl font-bold text-gray-900 relative pb-4">
                  Liste des Activités
                  <span className="absolute bottom-0 left-0 w-24 h-1 bg-orange-500 rounded"></span>
                </h2>

                <div className="flex items-center gap-3">
                  {activitiesPage > 1 && (
                    <button
                      onClick={() => void handleShowLessActivities()}
                      className="flex items-center gap-2 px-4 py-2 bg-white text-orange-700 border border-orange-300 rounded-lg font-semibold transition-all duration-300 hover:bg-orange-50"
                    >
                      <ChevronUp className="w-4 h-4" />
                      Voir moins
                    </button>
                  )}

                  {hasMoreActivities && (
                    <button
                      onClick={() => void handleLoadMoreActivities()}
                      disabled={isLoadingMoreActivities}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 border border-orange-300 rounded-lg font-semibold transition-all duration-300 hover:bg-orange-200 disabled:opacity-60"
                    >
                      <ChevronDown className="w-4 h-4" />
                      {isLoadingMoreActivities ? 'Chargement...' : 'Charger encore'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap justify-center gap-3 p-4 bg-white shadow-sm">
              {filters.map((filter) => (
                <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-6 py-3 rounded-full border-2 font-semibold transition-all duration-300 ${
                activeFilter === filter
                  ? 'bg-orange-500 text-white border-orange-500 shadow-lg'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-orange-500 hover:text-orange-500 hover:-translate-y-0.5'
              }`}
              style={activeFilter === filter ? { boxShadow: '0 4px 6px rgba(249, 115, 22, 0.3)' } : {}}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Activities Grid */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          {isLoadingActivities ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
              <span className="ml-3 text-gray-600">Filtrage des activités...</span>
            </div>
          ) : activities.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {activities.map((activity, index) => (
                  <div
                    key={activity.id}
                    className="bg-white rounded-2xl overflow-hidden shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl relative group"
                    style={{
                      animation: 'fadeIn 0.6s ease forwards',
                      animationDelay: `${index * 0.1}s`,
                      opacity: 0
                    }}
                  >
                    {/* Image Container */}
                    <div className="relative h-48 overflow-hidden">
                      {activity.image ? (
                        <img
                          src={activity.image}
                          alt={activity.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 transition-transform duration-500 group-hover:scale-105" />
                      )}

                      {/* Category Badge */}
                      <div className="absolute top-4 left-4 z-10 max-w-[calc(100%-5rem)]">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${getCategoryColor(activity.category)}`}>
                          {activity.category}
                        </span>
                      </div>

                      {/* Star Button */}
                      <div className="absolute top-4 right-4 z-20">
                        <button
                          onClick={() => void toggleStar(activity.id)}
                          className={`flex items-center gap-1 px-3 py-2 rounded-full border-2 transition-all duration-300 backdrop-blur-sm ${
                            starredActivities.has(activity.id)
                              ? 'bg-yellow-100/95 border-yellow-600 shadow-lg'
                              : 'bg-white/95 border-yellow-400 hover:bg-white hover:border-yellow-600 hover:scale-110'
                          }`}
                          style={starredActivities.has(activity.id) ? { boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)' } : { boxShadow: '0 2px 8px rgba(251, 191, 36, 0.2)' }}
                        >
                          <Star
                            className={`w-4 h-4 transition-all duration-300 ${
                              starredActivities.has(activity.id)
                                ? 'text-yellow-600 fill-yellow-600'
                                : 'text-yellow-400'
                            }`}
                          />
                          <span className="text-sm font-bold text-yellow-900 min-w-[1.5rem] text-center">
                            {activity.stars}
                          </span>
                        </button>
                      </div>

                      {/* Upcoming Badge */}
                      {activity.isUpcoming && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 rounded-full text-white text-sm font-semibold" style={{ background: 'rgba(234, 88, 12, 0.9)' }}>
                          <Sparkles className="w-3.5 h-3.5" />
                          À venir
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        {activity.title}
                      </h3>
                      <p className="text-gray-600 mb-4 leading-relaxed">
                        {activity.description}
                      </p>

                      {/* Details */}
                      <div className="flex flex-wrap gap-4 mb-4 py-3 border-t border-b border-gray-200">
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                          <Calendar className="w-4 h-4" />
                          <span>{activity.date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                          <MapPin className="w-4 h-4" />
                          <span>{activity.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                          <Users className="w-4 h-4" />
                          <span>{activity.participants}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                          <Clock className="w-4 h-4" />
                          <span>{activity.duration}</span>
                        </div>
                      </div>

                      {/* Long Description - Shows on hover */}
                      <div className="max-h-0 overflow-hidden transition-all duration-500 group-hover:max-h-[150px] text-gray-700 leading-relaxed mb-4">
                        {activity.longDescription}
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => handleMoreInfo(activity.id)}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold transition-colors duration-300 hover:bg-orange-600"
                      >
                        Plus d'infos
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {(hasMoreActivities || activitiesPage > 1) && (
                <div className="flex justify-center mt-8 gap-3 flex-wrap">
                  {activitiesPage > 1 && (
                    <button
                      onClick={() => void handleShowLessActivities()}
                      className="flex items-center gap-2 px-6 py-3 bg-white text-orange-700 border border-orange-300 rounded-lg font-semibold transition-all duration-300 hover:bg-orange-50"
                    >
                      <ChevronUp className="w-5 h-5" />
                      Voir moins
                    </button>
                  )}

                  {hasMoreActivities && (
                    <button
                      onClick={() => void handleLoadMoreActivities()}
                      disabled={isLoadingMoreActivities}
                      className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold transition-all duration-300 hover:bg-orange-600 disabled:opacity-60"
                    >
                      <ChevronDown className="w-5 h-5" />
                      {isLoadingMoreActivities ? 'Chargement...' : 'Charger encore des activités'}
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-xl p-8 text-center text-gray-500">
              Aucune activité trouvée pour ce filtre.
            </div>
          )}
        </div>

        {/* Proposal Section */}
        <div className="max-w-7xl mx-auto px-6 py-12 my-16">
          <div className="text-center p-12 rounded-2xl border-2 border-orange-300" 
            style={{ 
              background: 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)',
              boxShadow: '0 8px 24px rgba(249, 115, 22, 0.15)'
            }}
          >
            <h2 className="text-4xl font-bold text-orange-700 mb-4">
              Une Idée d'Activité ?
            </h2>
            <p className="text-gray-600 mb-8 leading-relaxed text-lg max-w-2xl mx-auto">
              Vous avez une idée d'activité ou d'événement que vous aimeriez organiser ? 
              Partagez-la avec nous et contribuez à enrichir la vie étudiante de la CEEAM !
            </p>
            <Link to="/proposer-activite" className="px-10 py-4 bg-orange-600 text-white rounded-lg text-lg font-semibold transition-all duration-300 hover:bg-orange-700 hover:-translate-y-0.5 inline-flex items-center gap-2"
              style={{ boxShadow: '0 4px 12px rgba(194, 65, 12, 0.3)' }}
            >
              <Sparkles className="w-5 h-5" />
              Proposer une activité
            </Link>
          </div>
        </div>
          </>
        )}
      </div>

      <Footer />

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes starPop {
          0% { transform: scale(1); }
          50% { transform: scale(1.5) rotate(15deg); }
          100% { transform: scale(1) rotate(0); }
        }

        @keyframes starSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default ActivitiesPage;