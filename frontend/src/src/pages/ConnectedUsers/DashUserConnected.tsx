// frontend/src/pages/Userconnected/DashUserconnected.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../../components/layout/HeaderConnected';
import Footer from '../../components/layout/Footer';
import { useDashboard } from '../../hooks/useDashboard';
import { AuthService } from '../../services/authService';

const DashUserconnected: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = AuthService.getCurrentUser();
  
  // Hook pour charger les données depuis l'API
  const { user, stats, activities, guides, annonces, isLoading, error } = useDashboard();
  
  // Déterminer le chemin d'édition selon le rôle
  const getEditProfilePath = () => {
    if (currentUser?.role === 'laureat') {
      return '/laureats/edit-profile';
    }
    return '/edit-profile';
  };
  
  // État pour suivre le bouton cliqué
  const [activeQuickAccess, setActiveQuickAccess] = useState<number | null>(null);
  // État pour le mois du calendrier
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  // État pour le sélecteur de mois/année
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [showDateSelector, setShowDateSelector] = useState<boolean>(false);

  // Données des accès rapides
  const quickAccessItems = [
    { id: 1, title: 'Voter', path: '/vote' },
    { id: 2, title: 'Modifier Profil', path: getEditProfilePath() },
    { id: 3, title: 'Chercher Lauréats', path: '/laureats-connected' },
    { id: 4, title: 'Calendrier', path: '#calendrier' },
  ];

  // Liste des mois
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  // Fonction pour générer les jours du calendrier selon le mois
  const generateCalendarDays = (monthIndex: number, year: number) => {
    const currentMonthName = months[monthIndex];
    
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, monthIndex, 1).getDay(); // 0 = Dimanche, 1 = Lundi, etc.
    
    const days = [];
    
    // Ajouter les jours du mois précédent
    const prevMonthDays = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    const prevMonthDaysCount = new Date(year, monthIndex, 0).getDate();
    
    for (let i = prevMonthDays; i > 0; i--) {
      days.push({ 
        date: prevMonthDaysCount - i + 1, 
        isCurrentMonth: false, 
        isToday: false 
      });
    }
    
    // Ajouter les jours du mois courant
    const today = new Date();
    const isCurrentMonthYear = year === today.getFullYear() && monthIndex === today.getMonth();
    
    // Déterminer les jours avec des activités depuis l'API
    const activityDays = activities.map(a => {
      const actDate = new Date(a.date);
      if (actDate.getMonth() === monthIndex && actDate.getFullYear() === year) {
        return actDate.getDate();
      }
      return null;
    }).filter(Boolean) as number[];
    
    for (let i = 1; i <= daysInMonth; i++) {
      const isToday = isCurrentMonthYear && i === today.getDate();
      const hasActivity = activityDays.includes(i);
      
      days.push({ 
        date: i, 
        isCurrentMonth: true, 
        isToday,
        hasActivity 
      });
    }
    
    // Ajouter les jours du mois suivant pour compléter la grille
    const totalCells = 42; // 6 semaines * 7 jours = 42 cases
    const remainingDays = totalCells - days.length;
    
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ 
        date: i, 
        isCurrentMonth: false, 
        isToday: false 
      });
    }
    
    return { monthName: currentMonthName, days };
  };

  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  // Fonctions pour changer de mois
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Fonction pour valider la sélection de date
  const handleDateSelection = () => {
    setCurrentMonth(selectedMonth);
    setCurrentYear(selectedYear);
    setShowDateSelector(false);
  };

  // Générer les jours du calendrier
  const { monthName, days: calendarDays } = generateCalendarDays(currentMonth, currentYear);

  // Fonction pour gérer le clic sur un accès rapide
  const handleQuickAccessClick = (id: number, path: string) => {
    setActiveQuickAccess(id);
    if (path.startsWith('#')) {
      // Scroll vers l'élément
      const element = document.getElementById(path.slice(1));
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(path);
    }
  };

  // Affichage du chargement
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="bg-secondary border-t border-border text-white">
          <div className="container mx-auto px-6 py-4">
            <h2 className="text-3xl font-semibold">Chargement...</h2>
          </div>
        </div>
        <main className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Chargement du dashboard...</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Utilise le Header component EXISTANT */}
      <Header />

      {/* Message de bienvenue - EXACTEMENT comme Footer avec bg-secondary */}
      <div className="bg-secondary border-t border-border text-white">
        <div className="container mx-auto px-6 py-4">
          <h2 className="text-3xl font-semibold">
            Bienvenu, {user?.firstName
    ? user.firstName[0].toLocaleUpperCase() + user.firstName.slice(1)
    : 'Utilisateur'}!
          </h2>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="text-3xl font-bold text-gray-800">{stat.value}</div>
              <div className="text-gray-600 text-sm mt-1">{stat.title}</div>
              <div className={`text-sm font-medium mt-2 ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {stat.trend === 'up' ? '↑' : '↓'} {stat.change}
              </div>
            </div>
          ))}
        </div>

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Colonne gauche - 2/3 de largeur */}
          <div className="lg:col-span-2 space-y-6">
            {/* Activités à venir */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
                Activités à venir
              </h3>
              <div className="space-y-4">
                {activities.length > 0 ? (
                  activities.map((activity) => (
                    <div key={activity.id} className="flex items-start p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                      {/* Image ou placeholder avec date */}
                      {activity.imageUrl ? (
                        <img 
                          src={activity.imageUrl} 
                          alt={activity.title}
                          className="w-[70px] h-[70px] object-cover rounded-lg mr-4"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center bg-blue-600 text-white rounded-lg p-3 min-w-[70px] min-h-[70px] mr-4">
                          <div className="text-sm font-bold uppercase">{activity.month}</div>
                          <div className="text-2xl font-bold">{activity.day}</div>
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800">{activity.title}</h4>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-600 mt-1">
                          {activity.imageUrl && (
                            <>
                              <span className="font-medium">{activity.day} {activity.month}</span>
                              <span>•</span>
                            </>
                          )}
                          <span>{activity.duration}</span>
                          <span>•</span>
                          <span>{activity.location}</span>
                          <span>•</span>
                          <span>{activity.time}</span>
                        </div>
                        <div className="text-blue-600 font-semibold text-sm mt-2">
                          {activity.registered} inscrits
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    Aucune activité à venir pour le moment
                  </div>
                )}
              </div>
            </div>

            {/* Calendrier - DIRECTEMENT SOUS Activités à venir */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Calendrier des activités</h3>
              
              {/* Sélecteur de date */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-lg font-semibold text-blue-800">
                      {monthName} {currentYear}
                    </div>
                    <button
                      onClick={() => setShowDateSelector(!showDateSelector)}
                      className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm font-medium rounded-md transition-colors flex items-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Changer la date
                    </button>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button 
                      onClick={handlePrevMonth}
                      className="p-2 hover:bg-gray-100 rounded transition-colors"
                      title="Mois précédent"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button 
                      onClick={handleNextMonth}
                      className="p-2 hover:bg-gray-100 rounded transition-colors"
                      title="Mois suivant"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Sélecteur de mois/année */}
                {showDateSelector && (
                  <div className="mt-3 p-4 bg-white border border-gray-300 rounded-lg shadow-sm">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Sélecteur de mois */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Mois</label>
                        <select
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {months.map((month, index) => (
                            <option key={month} value={index}>
                              {month}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Sélecteur d'année */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Année</label>
                        <select
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {[2023, 2024, 2025, 2026].map(year => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    {/* Boutons d'action */}
                    <div className="mt-4 flex justify-end space-x-3">
                      <button
                        onClick={() => setShowDateSelector(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md transition-colors"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleDateSelection}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                      >
                        Valider
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Jours de la semaine */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Grille du calendrier - VRAI CALENDRIER */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => (
                  <div
                    key={index}
                    className={`h-12 flex items-center justify-center border rounded text-center ${
                      !day.isCurrentMonth 
                        ? 'bg-gray-50 text-gray-400 border-gray-100' 
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    } ${day.isToday ? 'border-2 border-blue-500' : ''} ${day.hasActivity ? 'border-blue-300' : ''}`}
                  >
                    <div className={`relative ${day.hasActivity ? 'font-bold text-blue-600' : 'font-medium'} ${day.isToday ? 'text-blue-600' : ''}`}>
                      {day.date}
                      {day.hasActivity && (
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Événements du calendrier */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-700 space-y-2">
                  {activities
                    .filter(a => {
                      const actDate = new Date(a.date);
                      return actDate.getMonth() === currentMonth && actDate.getFullYear() === currentYear;
                    })
                    .map(activity => (
                      <div key={activity.id} className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        <div>
                          <span className="font-semibold">{activity.title}</span> - {activity.day} {activity.month} • {activity.time}
                        </div>
                      </div>
                    ))}
                  {activities.filter(a => {
                    const actDate = new Date(a.date);
                    return actDate.getMonth() === currentMonth && actDate.getFullYear() === currentYear;
                  }).length === 0 && (
                    <div className="text-gray-500 italic">Aucun événement ce mois-ci</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Colonne droite - 1/3 de largeur */}
          <div className="space-y-6">
            {/* Guides d'intégration - RECTANGLE BLEU CLAIR AVEC FLÈCHE INTÉGRÉE REACT */}
            <div className="bg-blue-50 rounded-xl shadow-sm p-6 border border-blue-200">
              <h3 className="text-xl font-bold text-blue-800 mb-2">Guides d'intégration</h3>
              <p className="text-blue-600 text-sm mb-4">Tout ce dont vous avez besoin pour réussir votre arrivée</p>
              <div className="space-y-3">
                {guides.map((guide) => (
                  <div 
                    key={guide.id} 
                    className="flex justify-between items-center p-3 border border-blue-100 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-colors cursor-pointer group"
                    onClick={() => guide.url_pdf && window.open(guide.url_pdf, '_blank')}
                  >
                    <div className="font-medium text-blue-900">{guide.titre}</div>
                    <div className="flex items-center text-blue-700 group-hover:text-blue-800 transition-colors">
                      {/* Flèche intégrée React SVG à la place de la main 👉 */}
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-4 w-4 mr-2" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor" 
                        strokeWidth={2}
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" 
                        />
                      </svg>
                      <span className="text-xs font-medium">Voir</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Grille pour Annonces et Accès rapides côte à côte */}
            <div className="grid grid-cols-1 gap-6">
              {/* Annonces - RECTANGLE BLEU CLAIR */}
              <div className="bg-blue-50 rounded-xl shadow-sm p-6 border border-blue-200 h-full">
                <h3 className="text-xl font-bold text-blue-800 mb-4 pb-2 border-b border-blue-300">
                  Annonces
                </h3>
                <div className="space-y-4 h-[calc(100%-3.5rem)] flex flex-col">
                  <div className="space-y-4 flex-1">
                    {annonces.map((annonce) => (
                      <div key={annonce.id} className="pb-3 border-b border-blue-100 last:border-0 last:pb-0">
                        <div className="font-medium text-blue-900">{annonce.titre}</div>
                        <div className="text-blue-600 text-sm mt-1">{annonce.temps_relatif}</div>
                      </div>
                    ))}
                  </div>
                  {/* Espace vide pour aligner la hauteur */}
                  <div className="flex-1"></div>
                </div>
              </div>

              {/* Accès rapides - RECTANGLE BLEU CLAIR avec changement de couleur */}
              <div className="bg-blue-50 rounded-xl shadow-sm p-6 border border-blue-200 h-full">
                <h3 className="text-xl font-bold text-blue-800 mb-4 pb-2 border-b border-blue-300">
                  Accès rapides
                </h3>
                <div className="h-[calc(100%-3.5rem)] flex flex-col">
                  <div className="grid grid-cols-2 gap-3 flex-1">
                    {quickAccessItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleQuickAccessClick(item.id, item.path)}
                        className={`p-3 border rounded-lg font-medium transition-all duration-200 h-full flex items-center justify-center ${
                          activeQuickAccess === item.id
                            ? 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600 shadow-md' // Couleur jaune-orange active
                            : 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 hover:border-blue-300' // Couleur normale bleu clair
                        }`}
                      >
                        {item.title}
                      </button>
                    ))}
                  </div>
                  {/* Espace vide pour aligner la hauteur */}
                  <div className="flex-1"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Utilise le Footer component EXISTANT */}
      <Footer />
    </div>
  );
};

export default DashUserconnected;