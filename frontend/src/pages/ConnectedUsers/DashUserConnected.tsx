import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../../components/layout/HeaderConnected';
import Footer from '../../components/layout/Footer';
import { useDashboard } from '../../hooks/useDashboard';
import { AuthService } from '../../services/authService';

const DashUserconnected: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = AuthService.getCurrentUser();
  const { user, activities, guides, annonces, isLoading, error } = useDashboard();

  const getEditProfilePath = () => {
    if (currentUser?.role === 'laureat') {
      return '/laureats/edit-profile';
    }
    return '/edit-profile';
  };

  const [activeQuickAccess, setActiveQuickAccess] = useState<number | null>(null);
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [showDateSelector, setShowDateSelector] = useState<boolean>(false);

  const quickAccessItems = [
    { id: 1, title: 'Voter', path: '/vote' },
    { id: 2, title: 'Modifier profil', path: getEditProfilePath() },
    { id: 3, title: 'Chercher lauréats', path: '/laureats-connected' },
    { id: 4, title: 'Calendrier', path: '#calendrier' },
  ];

  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
  ];

  const firstName = useMemo(() => {
    if (user?.firstName) {
      return user.firstName[0].toLocaleUpperCase() + user.firstName.slice(1);
    }
    return 'Utilisateur';
  }, [user?.firstName]);

  const parseActivityDate = (value: string) => {
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
    return {
      year: parsedDate.getFullYear(),
      month: parsedDate.getMonth(),
      day: parsedDate.getDate(),
    };
  };

  const getActivityInitial = (title?: string) => {
    const normalizedTitle = title?.trim();
    return normalizedTitle ? normalizedTitle.charAt(0).toLocaleUpperCase() : 'A';
  };

  const generateCalendarDays = (monthIndex: number, year: number) => {
    const currentMonthName = months[monthIndex];
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, monthIndex, 1).getDay();
    const days = [];

    const prevMonthDays = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    const prevMonthDaysCount = new Date(year, monthIndex, 0).getDate();

    for (let i = prevMonthDays; i > 0; i--) {
      days.push({ date: prevMonthDaysCount - i + 1, isCurrentMonth: false, isToday: false });
    }

    const today = new Date();
    const isCurrentMonthYear = year === today.getFullYear() && monthIndex === today.getMonth();

    const activityDays = activities
      .map((activity) => {
        const activityDate = parseActivityDate(activity.date);
        if (activityDate.month === monthIndex && activityDate.year === year) {
          return activityDate.day;
        }
        return null;
      })
      .filter(Boolean) as number[];

    for (let i = 1; i <= daysInMonth; i++) {
      const isToday = isCurrentMonthYear && i === today.getDate();
      const hasActivity = activityDays.includes(i);
      days.push({ date: i, isCurrentMonth: true, isToday, hasActivity });
    }

    const totalCells = 42;
    const remainingDays = totalCells - days.length;

    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: i, isCurrentMonth: false, isToday: false });
    }

    return { monthName: currentMonthName, days };
  };

  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const handleDateSelection = () => {
    setCurrentMonth(selectedMonth);
    setCurrentYear(selectedYear);
    setShowDateSelector(false);
  };

  const { monthName, days: calendarDays } = generateCalendarDays(currentMonth, currentYear);

  const handleQuickAccessClick = (id: number, path: string) => {
    setActiveQuickAccess(id);
    if (path.startsWith('#')) {
      const element = document.getElementById(path.slice(1));
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(path);
    }
  };

  const monthActivities = activities.filter((activity) => {
    const activityDate = parseActivityDate(activity.date);
    return activityDate.month === currentMonth && activityDate.year === currentYear;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="border-t border-border bg-secondary text-white">
          <div className="container mx-auto px-4 py-4 sm:px-6">
            <h2 className="text-2xl font-semibold sm:text-3xl">Chargement...</h2>
          </div>
        </div>
        <main className="container mx-auto p-4 sm:p-6">
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-center sm:flex-row">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Chargement du dashboard...</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="border-t border-border bg-secondary text-white">
        <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Dashboard</p>
              <h2 className="text-2xl font-semibold leading-tight sm:text-3xl">Bienvenue, {firstName}</h2>
              <p className="max-w-2xl text-sm leading-6 text-white/75 sm:text-base">
                Retrouvez l'essentiel en un coup d'oeil: activités à venir, calendrier, guides utiles et annonces récentes.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:w-[28rem]">
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <div className="text-xs uppercase tracking-[0.18em] text-white/60">Activités</div>
                <div className="mt-1 text-2xl font-semibold text-white">{activities.length}</div>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <div className="text-xs uppercase tracking-[0.18em] text-white/60">Guides</div>
                <div className="mt-1 text-2xl font-semibold text-white">{guides.length}</div>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <div className="text-xs uppercase tracking-[0.18em] text-white/60">Annonces</div>
                <div className="mt-1 text-2xl font-semibold text-white">{annonces.length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto p-4 sm:p-6">
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-4 border-b border-gray-200 pb-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Agenda</p>
                  <h3 className="text-xl font-bold text-gray-800">Activités à venir</h3>
                </div>
                <Link to="/activities" className="text-sm font-medium text-blue-700 hover:text-blue-800">
                  Voir tout
                </Link>
              </div>

              <div className="space-y-4">
                {activities.length > 0 ? (
                  activities.map((activity) => (
                    <div key={activity.id} className="flex flex-col gap-4 rounded-xl border border-gray-200 p-4 transition-colors hover:border-blue-300 sm:flex-row sm:items-start">
                      {activity.imageUrl ? (
                        <img
                          src={activity.imageUrl}
                          alt={activity.title}
                          className="h-[84px] w-full rounded-xl object-cover sm:mr-4 sm:w-[84px]"
                        />
                      ) : (
                        <div className="flex min-h-[84px] w-full items-center justify-center rounded-xl bg-gradient-to-br from-[#172d45] via-[#215b8f] to-[#f59f24] p-3 text-white sm:mr-4 sm:min-w-[84px] sm:w-auto">
                          <div className="text-2xl font-bold">{getActivityInitial(activity.title)}</div>
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <h4 className="break-words font-bold text-gray-800">{activity.title}</h4>
                        <div className="mt-1 flex flex-wrap gap-3 text-sm text-gray-600">
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
                        <div className="mt-2 text-sm font-medium text-blue-700">{activity.registered} inscrits</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl bg-gray-50 py-8 text-center text-gray-500">
                    Aucune activité à venir pour le moment
                  </div>
                )}
              </div>
            </div>

            <div id="calendrier" className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex flex-col gap-3 border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Planning</p>
                  <h3 className="text-xl font-bold text-gray-800">Calendrier des activités</h3>
                </div>

                <div className="flex space-x-2 self-end sm:self-auto">
                  <button onClick={handlePrevMonth} className="rounded-lg p-2 transition-colors hover:bg-gray-100" title="Mois précédent">
                    <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button onClick={handleNextMonth} className="rounded-lg p-2 transition-colors hover:bg-gray-100" title="Mois suivant">
                    <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                    <div className="break-words text-lg font-semibold text-blue-900">{monthName} {currentYear}</div>
                    <button
                      onClick={() => setShowDateSelector(!showDateSelector)}
                      className="flex items-center rounded-md bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-200"
                    >
                      <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Changer la date
                    </button>
                  </div>
                </div>

                {showDateSelector && (
                  <div className="mt-3 rounded-lg border border-gray-300 bg-white p-4 shadow-sm">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Mois</label>
                        <select
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {months.map((month, index) => (
                            <option key={month} value={index}>{month}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Année</label>
                        <select
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {[2023, 2024, 2025, 2026].map((year) => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
                      <button
                        onClick={() => setShowDateSelector(false)}
                        className="rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleDateSelection}
                        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                      >
                        Valider
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-2 grid grid-cols-7 gap-1">
                {weekDays.map((day) => (
                  <div key={day} className="py-2 text-center text-xs font-medium text-gray-500 sm:text-sm">{day}</div>
                ))}
              </div>

              <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-full bg-blue-500"></span>
                  Jour avec activité
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-full border-2 border-blue-500 bg-white"></span>
                  Aujourd'hui
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => (
                  <div
                    key={index}
                    className={`flex h-10 items-center justify-center rounded border text-center text-sm transition-all sm:h-12 ${
                      !day.isCurrentMonth
                        ? 'border-gray-100 bg-gray-50 text-gray-400'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    } ${day.isToday ? 'border-2 border-blue-500' : ''} ${day.hasActivity ? 'border-blue-400 bg-blue-50 shadow-sm ring-1 ring-blue-100' : ''}`}
                  >
                    <div className={`relative min-w-[1.6rem] ${day.hasActivity ? 'font-bold text-blue-700' : 'font-medium'} ${day.isToday ? 'text-blue-600' : ''}`}>
                      {day.date}
                      {day.hasActivity && (
                        <>
                          <div className="absolute -bottom-1.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-blue-600"></div>
                          <div className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_0_2px_white]"></div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 border-t border-gray-200 pt-4">
                <div className="space-y-2 text-sm text-gray-700">
                  {monthActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start">
                      <div className="mr-2 mt-1 h-2 w-2 rounded-full bg-blue-500"></div>
                      <div>
                        <span className="font-semibold">{activity.title}</span> - {activity.day} {activity.month} • {activity.time}
                      </div>
                    </div>
                  ))}
                  {monthActivities.length === 0 && <div className="italic text-gray-500">Aucun événement ce mois-ci</div>}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-xl font-bold text-gray-800">Accès rapides</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {quickAccessItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleQuickAccessClick(item.id, item.path)}
                    className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all duration-200 ${
                      activeQuickAccess === item.id
                        ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    {item.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-2 text-xl font-bold text-gray-800">Guides d'intégration</h3>
              <p className="mb-4 text-sm text-gray-500">Tout ce dont vous avez besoin pour réussir votre arrivée</p>
              <div className="space-y-3">
                {guides.map((guide) => (
                  <div
                    key={guide.id}
                    className="group flex cursor-pointer flex-col gap-3 rounded-xl border border-gray-200 p-3 transition-colors hover:border-blue-300 hover:bg-blue-50 sm:flex-row sm:items-center sm:justify-between"
                    onClick={() => guide.url_pdf && window.open(guide.url_pdf, '_blank')}
                  >
                    <div className="break-words font-medium text-gray-800">{guide.titre}</div>
                    <div className="flex items-center text-blue-700 transition-colors group-hover:text-blue-800">
                      <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs font-medium">Voir</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 border-b border-gray-200 pb-2 text-xl font-bold text-gray-800">Annonces</h3>
              <div className="space-y-4">
                {annonces.map((annonce) => (
                  <div key={annonce.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <div className="font-medium text-gray-800">{annonce.titre}</div>
                    <div className="mt-1 text-sm text-gray-500">{annonce.temps_relatif}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DashUserconnected;
