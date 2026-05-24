import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, LogOut, User, ChevronDown, CalendarDays, CheckCircle2 } from 'lucide-react';
import { AuthService } from '../../services/authService';
import { getAbsoluteMediaUrl } from '@/lib/utils';
import { useNotifications } from '@/hooks/useNotifications';

/**
 * Header avec Navbar pour les pages connectées
 * Affiche le logo, les liens de navigation avec indicateur actif, l'icône de notification et l'avatar utilisateur
 */
export const HeaderConnected: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const notificationDropdownRef = useRef<HTMLDivElement | null>(null);
  
  // État utilisateur depuis le service d'auth
  const [user, setUser] = useState<{
    firstName: string;
    lastName: string;
    initials: string;
    role: string;
    notificationCount: number;
    avatarUrl: string;
  } | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const {
    unreadCount,
    notificationsForUi,
    loading: notificationsLoading,
    markAsRead,
  } = useNotifications();

  const latestNotifications = useMemo(
    () => notificationsForUi.slice(0, 5),
    [notificationsForUi]
  );

  // Fonction pour charger les infos utilisateur (depuis cache mémoire)
  // Note: La vérification d'auth est faite par ProtectedRoute, ici on lit juste le cache
  const loadUserData = () => {
    const currentUser = AuthService.getCurrentUser();
    
    if (currentUser) {
      const firstName = currentUser.first_name || '';
      const lastName = currentUser.last_name || '';
      const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || 'U';
      
      setUser({
        firstName,
        lastName,
        initials,
        role: currentUser.role || 'student',
        notificationCount: unreadCount,
        avatarUrl: getAbsoluteMediaUrl(currentUser.avatar_url),
      });
    }
    setIsLoading(false);
  };

  // Charger les infos utilisateur et écouter les changements
  useEffect(() => {
    loadUserData();
    
    // Écouter les événements de mise à jour du profil
    const handleProfileUpdate = () => {
      loadUserData();
    };
    
    window.addEventListener('profile-updated', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('profile-updated', handleProfileUpdate);
    };
  }, [unreadCount]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationDropdownRef.current &&
        !notificationDropdownRef.current.contains(event.target as Node)
      ) {
        setShowNotificationsDropdown(false);
      }
    };

    if (showNotificationsDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotificationsDropdown]);

  // Liste des liens de navigation (adapté selon le rôle)
  const getNavLinks = () => {
    const baseLinks = [
      { name: 'Dashboard', path: '/dashboard-connected' },
      { name: 'Classroom', path: '/classroom' },
      { name: 'Activités', path: '/activities' },
      { name: 'Lauréats', path: '/laureats-connected' },
      { name: 'Utilisateurs', path: '/utilisateurs' },
    ];
    
    // Ajouter les liens spécifiques aux rôles
    if (user?.role === 'admin' || user?.role === 'bureau') {
      baseLinks.push({ name: 'CPanel', path: '/cpanel' });
    }
    
    return baseLinks;
  };

  const navLinks = getNavLinks();

  // Vérifier si un lien est actif
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Gestion de la déconnexion
  const handleLogout = async () => {
    setShowDropdown(false);
    setShowNotificationsDropdown(false);
    setShowMobileNav(false);
    await AuthService.logout();
    navigate('/connexion', { replace: true });
  };

  const handleNotificationClick = async (notification: (typeof latestNotifications)[number]) => {
    const parsedId = Number(notification.id);
    if (!Number.isNaN(parsedId) && !notification.isRead) {
      await markAsRead(parsedId);
    }

    setShowNotificationsDropdown(false);
    navigate(notification.linkUrl || '/notifications');
  };

  const getNotificationAccent = (type: string) => {
    switch (type) {
      case 'activity':
        return 'bg-blue-50 text-blue-700';
      case 'vote':
        return 'bg-emerald-50 text-emerald-700';
      case 'message':
        return 'bg-orange-50 text-orange-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  // Lien vers le profil selon le rôle
  const getProfilePath = () => {
    if (user?.role === 'laureat') {
      return '/laureats/profil';
    }
    return '/profil';
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img src="/log.jpeg" alt="CEEAM" className="h-9 w-auto object-contain sm:h-11" />
            </Link>
          </div>

          {/* Navigation centrale */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="relative py-2 text-gray-700 hover:text-[#172d45] font-medium text-sm transition-colors"
              >
                {link.name}
                {/* Barre orange pour le lien actif */}
                {isActive(link.path) && (
                  <span className="absolute bottom-0 left-0 right-0 h-1 bg-[#f59f24] rounded-t-sm"></span>
                )}
              </Link>
            ))}
          </nav>

          {/* Actions à droite */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Icône de notification avec badge */}
            <div className="relative" ref={notificationDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setShowNotificationsDropdown((prev) => !prev);
                  setShowDropdown(false);
                }}
                className="relative rounded-lg p-2 transition-colors hover:bg-gray-100"
                aria-label="Afficher les notifications"
              >
                <Bell className="h-5 w-5 text-[#f59f24] sm:h-6 sm:w-6" />
                {user && user.notificationCount > 0 && (
                  <span className="absolute right-0 top-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                    {user.notificationCount > 9 ? '9+' : user.notificationCount}
                  </span>
                )}
              </button>

              {showNotificationsDropdown && (
                <div className="fixed left-3 right-3 top-[72px] z-50 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.18)] sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-3 sm:w-[380px]">
                  <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-[#172d45]">Notifications</p>
                      <p className="text-xs text-gray-500">Les 5 plus récentes</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNotificationsDropdown(false);
                        navigate('/notifications');
                      }}
                      className="text-xs font-semibold text-[#f59f24] transition-colors hover:text-[#cc810d]"
                    >
                      Voir tout
                    </button>
                  </div>

                  <div className="max-h-[min(60vh,420px)] overflow-y-auto p-2 sm:max-h-[420px]">
                    {notificationsLoading ? (
                      <div className="px-3 py-8 text-center text-sm text-gray-500">Chargement des notifications...</div>
                    ) : latestNotifications.length > 0 ? (
                      latestNotifications.map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() => handleNotificationClick(notification)}
                          className={`mb-2 flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left transition-colors last:mb-0 ${
                            notification.isRead
                              ? 'border-gray-200 bg-white hover:bg-gray-50'
                              : 'border-[#f59f24]/30 bg-[#fff8ee] hover:bg-[#fff3df]'
                          }`}
                        >
                          <div className={`mt-0.5 rounded-xl p-2 ${getNotificationAccent(notification.type)}`}>
                            {notification.isRead ? <CalendarDays className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <p className="line-clamp-1 text-sm font-semibold text-slate-900">{notification.title}</p>
                              {!notification.isRead && <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#f59f24]"></span>}
                            </div>
                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{notification.description}</p>
                            <p className="mt-2 text-xs font-medium text-slate-400">{notification.timestamp}</p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-8 text-center text-sm text-gray-500">Aucune notification pour le moment.</div>
                    )}
                  </div>

                  <div className="border-t border-gray-100 px-4 py-3">
                    <Link
                      to="/notifications"
                      onClick={() => setShowNotificationsDropdown(false)}
                      className="block rounded-xl bg-[#172d45] px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-[#0f2236]"
                    >
                      Ouvrir le centre de notifications
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Avatar utilisateur avec menu déroulant */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-1 rounded-lg p-1 transition-colors hover:bg-gray-100 sm:gap-2"
              >
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#9ca33f] text-sm font-semibold text-white sm:h-10 sm:w-10">
                  {user?.avatarUrl ? (
                    <img 
                      src={user.avatarUrl} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    user?.initials || 'U'
                  )}
                </div>
                <ChevronDown className="hidden h-4 w-4 text-gray-500 sm:block" />
              </button>

              {/* Menu déroulant */}
              {showDropdown && (
                <div className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-gray-200 bg-white py-2 shadow-lg sm:w-48">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="font-semibold text-gray-800">{user?.firstName} {user?.lastName}</p>
                    <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
                  </div>
                  
                  <Link
                    to={getProfilePath()}
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Mon Profil
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowMobileNav((prev) => !prev)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-[#172d45] transition-colors hover:bg-gray-50 md:hidden"
            >
              Menu
            </button>
          </div>
        </div>

        {/* Navigation mobile */}
        {showMobileNav && (
          <nav className="mt-4 grid gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-3 md:hidden">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setShowMobileNav(false)}
                className={`rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? 'bg-[#172d45] text-white'
                    : 'text-gray-700 hover:bg-white hover:text-[#172d45]'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
};

export default HeaderConnected;