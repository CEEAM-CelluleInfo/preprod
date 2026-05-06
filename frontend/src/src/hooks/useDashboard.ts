/**
 * Hook pour gérer les données du dashboard
 * Utilisé par DashUserConnected
 */

import { useState, useEffect } from 'react';
import { DashboardService, DashboardStats, DashboardActivity, Guide, Annonce } from '@/services/dashboardService';
import { AuthService } from '@/services/authService';

interface UseDashboardReturn {
  user: { firstName: string; lastName: string } | null;
  stats: {
    id: number;
    title: string;
    value: number;
    change: string;
    trend: 'up' | 'down';
  }[];
  activities: DashboardActivity[];
  guides: Guide[];
  annonces: Annonce[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDashboard(): UseDashboardReturn {
  const [user, setUser] = useState<{ firstName: string; lastName: string } | null>(null);
  const [stats, setStats] = useState<UseDashboardReturn['stats']>([]);
  const [activities, setActivities] = useState<DashboardActivity[]>([]);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Récupérer les infos utilisateur
      const currentUser = AuthService.getCurrentUser();
      if (currentUser) {
        setUser({
          firstName: currentUser.first_name || '',
          lastName: currentUser.last_name || ''
        });
      }

      // Récupérer toutes les données du dashboard
      const dashboardData = await DashboardService.getDashboardData();

      // Transformer les stats en format attendu par le composant
      const formattedStats = [
        { 
          id: 1, 
          title: 'Guides consultés', 
          value: dashboardData.stats.guides_consultes, 
          change: dashboardData.stats.guides_change,
          trend: dashboardData.stats.guides_change.startsWith('+') ? 'up' as const : 'down' as const
        },
        { 
          id: 2, 
          title: 'Activités participées', 
          value: dashboardData.stats.activites_participees, 
          change: dashboardData.stats.activites_change,
          trend: dashboardData.stats.activites_change.startsWith('+') ? 'up' as const : 'down' as const
        },
        { 
          id: 3, 
          title: 'Contacts lauréats', 
          value: dashboardData.stats.contacts_laureats, 
          change: dashboardData.stats.contacts_change,
          trend: dashboardData.stats.contacts_change.startsWith('+') ? 'up' as const : 'down' as const
        },
        { 
          id: 4, 
          title: 'Événements ce mois', 
          value: dashboardData.stats.evenements_ce_mois, 
          change: dashboardData.stats.evenements_change,
          trend: dashboardData.stats.evenements_change.startsWith('+') ? 'up' as const : 'down' as const
        },
      ];

      setStats(formattedStats);
      setActivities(dashboardData.activities);
      setGuides(dashboardData.guides);
      setAnnonces(dashboardData.annonces);

    } catch (err) {
      console.error('Erreur chargement dashboard:', err);
      setError('Impossible de charger les données du dashboard');
      
      // Utiliser des valeurs par défaut en cas d'erreur
      setStats([
        { id: 1, title: 'Guides consultés', value: 24, change: '+12%', trend: 'up' },
        { id: 2, title: 'Activités participées', value: 12, change: '+8%', trend: 'up' },
        { id: 3, title: 'Contacts lauréats', value: 18, change: '+5', trend: 'up' },
        { id: 4, title: 'Événements ce mois', value: 5, change: '+2', trend: 'up' },
      ]);
      setGuides([
        { id: 1, titre: 'Guide Logement' },
        { id: 2, titre: 'Transport & Mobilité' },
        { id: 3, titre: 'Restauration' },
        { id: 4, titre: 'Bibliothèque & Ressources' },
      ]);
      setAnnonces([
        { id: 1, titre: 'Ouverture inscriptions pédagogiques', temps_relatif: 'Il y a 2h' },
        { id: 2, titre: 'Nouveau guide logement disponible', temps_relatif: 'Il y a 1h' },
        { id: 3, titre: 'Réunion bureau CEEAM', temps_relatif: 'Il y a 30min' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return {
    user,
    stats,
    activities,
    guides,
    annonces,
    isLoading,
    error,
    refetch: fetchDashboardData
  };
}
