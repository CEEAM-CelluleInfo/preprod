import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
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

  const mapCategoryToTab = (category: string): 'tous' | 'formations' | 'evenements' => {
    if (category === 'formation') return 'formations';
    return 'evenements';
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
        if (!raw?.event_date) return false;
        const d = new Date(raw.event_date);
        return (
          d.getFullYear() === selectedDate.getFullYear() &&
          d.getMonth() === selectedDate.getMonth() &&
          d.getDate() === selectedDate.getDate()
        );
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
      alert('Veuillez vous connecter pour vous inscrire à une activité.');
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
      alert('Inscription réussie ! Vous participez maintenant à cette activité.');
    } catch (error: any) {
      console.error('Erreur lors de l\'inscription:', error);
      if (error.status === 409) {
        alert('Vous êtes déjà inscrit à cette activité.');
      } else if (error.status === 410) {
        alert('Cette activité est complète.');
      } else if (error.status === 422) {
        const backendMessage = error?.data?.message || error?.detail;
        alert(backendMessage || 'Les inscriptions sont fermées pour cette activité.');
      } else {
        alert('Erreur lors de l\'inscription. Veuillez réessayer.');
      }
    }
  };

  const handleViewDetails = (activityId: string) => {
    navigate(`/activity/${activityId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <HeaderConnected />
        <header className="bg-[#172d45] text-white py-8 px-6">
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
      {/* Header */}
      <HeaderConnected />

      {/* Section Hero avec fond bleu marine */}
      <header className="bg-[#172d45] text-white py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Activités</h1>
          <p className="text-white/80 text-sm">
            Ayez les informations sur les activités précédentes et à venir  
          </p>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="container mx-auto px-4 py-8 flex-1">
        {/* Calendrier */}
        <div className="mb-8">
          <Calendar 
            onDateSelect={handleDateSelect} 
            selectedDate={selectedDate}
            activityDates={activityDates}
          />
          {selectedDate && (
            <div className="mt-3 flex items-center gap-3 text-sm text-gray-600">
              <span>
                Activités du{' '}
                <strong>
                  {selectedDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </strong>
              </span>
              <button
                onClick={() => setSelectedDate(undefined)}
                className="text-[#f59f24] hover:underline font-medium"
              >
                Voir tout
              </button>
            </div>
          )}
        </div>

        {/* Section des activités */}
        <div className="bg-gray-100 rounded-2xl p-6 md:p-8">
          {/* Onglets de filtrage */}
          <ActivityTabs activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Liste des activités */}
          <div className="space-y-4">
            {getFilteredActivities().length > 0 ? (
              getFilteredActivities().map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  onJoin={handleJoinActivity}
                  onViewDetails={handleViewDetails}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">Aucune activité dans cette catégorie</p>
              </div>
            )}
          </div>

          {/* Boutons de pagination */}
          <div className="flex items-center justify-between mt-8 gap-4">
            <button className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
              Précédent
            </button>
            <button className="px-6 py-3 bg-[#172d45] text-white rounded-lg font-medium hover:bg-[#172d45]/90 transition-colors">
              Suivant
            </button>
          </div>
        </div>

        {/* Section Proposition d'activite (copiee depuis la page visiteurs) */}
        <div className="max-w-7xl mx-auto px-6 py-12 my-16">
          <div
            className="text-center p-12 rounded-2xl border-2 border-orange-300"
            style={{
              background: 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)',
              boxShadow: '0 8px 24px rgba(249, 115, 22, 0.15)',
            }}
          >
            <h2 className="text-4xl font-bold text-orange-700 mb-4">
              Une Idee d'activite ?
            </h2>
            <p className="text-gray-600 mb-8 leading-relaxed text-lg max-w-2xl mx-auto">
              Vous avez une idee d'activite ou d'evenement que vous aimeriez organiser ?
              Partagez-la avec nous et contribuez a enrichir la vie etudiante de la CEEAM !
            </p>
            <Link
              to="/proposer-activite-connected"
              className="px-10 py-4 bg-orange-600 text-white rounded-lg text-lg font-semibold transition-all duration-300 hover:bg-orange-700 hover:-translate-y-0.5 inline-flex items-center gap-2"
              style={{ boxShadow: '0 4px 12px rgba(194, 65, 12, 0.3)' }}
            >
              <Sparkles className="w-5 h-5" />
              Proposer une activite
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default ListesActiviteConnected;