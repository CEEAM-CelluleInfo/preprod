import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ActivityService } from '@/services/activityService';
import { Activity } from '@/types/activity';
import { AuthService } from '@/services/authService';
import { getRegistrationClosureReason } from '@/lib/registrationGuard';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  Heart,
  MapPin,
  Share2,
  Users,
} from 'lucide-react';

const ActivityDetailVisitorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<'idle' | 'success' | 'error' | 'already'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(AuthService.getCurrentUser());

  useEffect(() => {
    if (!id) return;

    let isMounted = true;

    const redirectAuthenticatedUsers = async () => {
      const cachedUser = AuthService.getCurrentUser();
      if (cachedUser) {
        navigate(`/activity/${id}`, { replace: true });
        return;
      }

      const user = await AuthService.fetchCurrentUser();
      if (user && isMounted) {
        navigate(`/activity/${id}`, { replace: true });
      }
    };

    void redirectAuthenticatedUsers();

    return () => {
      isMounted = false;
    };
  }, [id, navigate]);

  useEffect(() => {
    const fetchActivity = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        const activityData = await ActivityService.getActivityById(Number(id));
        setActivity(activityData);
      } catch (error) {
        console.error('Erreur lors du chargement de l\'activité:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const restoreUser = async () => {
      if (!AuthService.getCurrentUser()) {
        const user = await AuthService.fetchCurrentUser();
        setCurrentUser(user);
      }
    };

    fetchActivity();
    restoreUser();
  }, [id]);

  const handleRegister = async () => {
    if (!currentUser) {
      if (activity) {
        navigate(`/inscription-activity?eventId=${activity.id}`);
      }
      return;
    }

    if (!activity) return;

    const closureReason = getRegistrationClosureReason(activity);
    if (closureReason) {
      setRegistrationStatus('error');
      setErrorMessage(closureReason);
      return;
    }

    setIsRegistering(true);
    setRegistrationStatus('idle');
    setErrorMessage('');

    try {
      await ActivityService.registerToActivity(activity.id);
      setRegistrationStatus('success');
      const updated = await ActivityService.getActivityById(activity.id);
      if (updated) setActivity(updated);
    } catch (error: any) {
      console.error('Erreur inscription:', error);
      if (error.status === 409) {
        setRegistrationStatus('already');
        setErrorMessage('Vous êtes déjà inscrit à cette activité.');
      } else if (error.status === 410) {
        setRegistrationStatus('error');
        setErrorMessage('Cette activité est complète.');
      } else if (error.status === 422) {
        setRegistrationStatus('error');
        const backendMessage = error?.data?.message || error?.detail;
        setErrorMessage(backendMessage || 'Les inscriptions sont fermées pour cette activité.');
      } else {
        setRegistrationStatus('error');
        setErrorMessage('Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const handleGuestRegistration = () => {
    const closureReason = getRegistrationClosureReason(activity);
    if (closureReason) {
      setRegistrationStatus('error');
      setErrorMessage(closureReason);
      return;
    }

    if (activity) {
      navigate(`/inscription-activity?eventId=${activity.id}`);
    }
  };

  const handleLoginForRegistration = () => {
    const closureReason = getRegistrationClosureReason(activity);
    if (closureReason) {
      setRegistrationStatus('error');
      setErrorMessage(closureReason);
      return;
    }

    navigate('/connexion', { state: { from: `/activity/${id}` } });
  };

  const handleLike = async () => {
    if (!currentUser) {
      navigate('/connexion', { state: { from: `/activity/${id}` } });
      return;
    }
    if (!activity) return;

    try {
      if (activity.user_liked) {
        const response = await ActivityService.unlikeActivity(activity.id);
        setActivity((prev) =>
          prev
            ? {
                ...prev,
                user_liked: response?.userLiked ?? false,
                likes_count: response?.likesCount ?? Math.max(0, (prev.likes_count || 1) - 1),
              }
            : null
        );
      } else {
        const response = await ActivityService.likeActivity(activity.id);
        setActivity((prev) =>
          prev
            ? {
                ...prev,
                user_liked: response?.userLiked ?? true,
                likes_count: response?.likesCount ?? (prev.likes_count || 0) + 1,
              }
            : null
        );
      }
    } catch (error) {
      console.error('Erreur like:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      integration: 'Intégration',
      formation: 'Formation',
      culture: 'Culture',
      networking: 'Networking',
      sport: 'Sport',
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      integration: 'bg-green-500',
      formation: 'bg-blue-500',
      culture: 'bg-purple-500',
      networking: 'bg-orange-500',
      sport: 'bg-red-500',
    };
    return colors[category] || 'bg-gray-500';
  };

  const registrationClosureReason = getRegistrationClosureReason(activity);
  const isRegistrationClosed = Boolean(registrationClosureReason);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-6">
          <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Activité non trouvée</h2>
          <p className="text-gray-500 mb-4">L'activité demandée n'existe pas ou a été supprimée.</p>
          <Link to="/activites" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Retour aux activités
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <div className="relative h-64 md:h-80 bg-gray-200">
        {activity.image_url ? (
          <img src={activity.image_url} alt={activity.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white text-4xl sm:text-5xl md:text-6xl font-bold">{activity.title.charAt(0)}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/30"></div>

        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 p-2 bg-white/90 hover:bg-white rounded-full shadow-md transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>

        <span
          className={`absolute top-4 right-4 px-4 py-1.5 text-white text-sm font-medium rounded-full ${getCategoryColor(activity.category)}`}
        >
          {getCategoryLabel(activity.category)}
        </span>
      </div>

      <main className="flex-1 container mx-auto px-4 py-6 -mt-8 relative z-10">
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{activity.title}</h1>

            <div className="flex items-center gap-3">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  activity.user_liked
                    ? 'bg-red-50 border-red-200 text-red-600'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Heart className={`w-5 h-5 ${activity.user_liked ? 'fill-current' : ''}`} />
                <span>{activity.likes_count || 0}</span>
              </button>

              <button
                onClick={() => navigator.clipboard.writeText(window.location.href)}
                className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium text-gray-800">{activity.event_date ? formatDate(activity.event_date) : 'À définir'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <Clock className="w-6 h-6 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">Heure</p>
                <p className="font-medium text-gray-800">{activity.event_time || 'À définir'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg">
              <MapPin className="w-6 h-6 text-orange-600" />
              <div>
                <p className="text-sm text-gray-500">Lieu</p>
                <p className="font-medium text-gray-800">{activity.location || 'À définir'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
              <div>
                <p className="text-sm text-gray-500">Participants</p>
                <p className="font-medium text-gray-800">
                  {activity.registrations_count || 0}
                  {activity.max_participants ? ` / ${activity.max_participants}` : ''}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Description</h2>
            <p className="text-gray-600 leading-relaxed">{activity.description}</p>

            {activity.long_description && (
              <div className="mt-4 text-gray-600 leading-relaxed whitespace-pre-line">{activity.long_description}</div>
            )}
          </div>

          <div className="border-t border-gray-200 pt-6">
            {registrationStatus === 'success' ? (
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Inscription réussie !</p>
                  <p className="text-sm text-green-600">Vous êtes inscrit à cette activité.</p>
                </div>
              </div>
            ) : registrationStatus === 'already' ? (
              <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <CheckCircle className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-800">Déjà inscrit</p>
                  <p className="text-sm text-blue-600">Vous participez déjà à cette activité.</p>
                </div>
              </div>
            ) : registrationStatus === 'error' ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                  <div>
                    <p className="font-medium text-red-800">Erreur</p>
                    <p className="text-sm text-red-600">{errorMessage}</p>
                  </div>
                </div>
                <button
                  onClick={handleRegister}
                  disabled={isRegistering || isRegistrationClosed}
                  className="w-full md:w-auto px-8 py-3 bg-[#f59f24] hover:bg-[#e08f1f] text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {isRegistrationClosed ? 'Inscriptions fermées' : 'Réessayer'}
                </button>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-gray-600">
                    {activity.user_registered
                      ? 'Vous êtes déjà inscrit à cette activité.'
                      : isRegistrationClosed
                        ? registrationClosureReason
                        : currentUser
                          ? 'Cliquez sur le bouton pour vous inscrire à cette activité.'
                          : 'Choisissez votre mode d\'inscription : invité ou avec connexion.'}
                  </p>
                </div>
                {!activity.user_registered && (
                  currentUser ? (
                    <button
                      onClick={handleRegister}
                      disabled={isRegistering || isRegistrationClosed}
                      className="w-full md:w-auto px-8 py-3 bg-[#f59f24] hover:bg-[#e08f1f] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isRegistering ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Inscription...
                        </>
                      ) : (
                        isRegistrationClosed ? 'Inscriptions fermées' : "S'inscrire à l'activité"
                      )}
                    </button>
                  ) : (
                    <div className="w-full md:w-auto flex flex-col md:flex-row gap-3">
                      <button
                        onClick={handleGuestRegistration}
                        disabled={isRegistrationClosed}
                        className="w-full md:w-auto px-6 py-3 bg-[#f59f24] hover:bg-[#e08f1f] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isRegistrationClosed ? 'Inscriptions fermées' : "S'inscrire en tant qu'invité"}
                      </button>
                      <button
                        onClick={handleLoginForRegistration}
                        disabled={isRegistrationClosed}
                        className="w-full md:w-auto px-6 py-3 border border-[#f59f24] text-[#f59f24] font-semibold rounded-lg transition-colors hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isRegistrationClosed ? 'Inscriptions fermées' : "Se connecter pour s'inscrire"}
                      </button>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ActivityDetailVisitorPage;