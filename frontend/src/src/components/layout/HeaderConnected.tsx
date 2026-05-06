import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, LogOut, User, ChevronDown } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState(true);
  const { unreadCount } = useNotifications({ statsOnly: true });

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

  // Liste des liens de navigation (adapté selon le rôle)
  const getNavLinks = () => {
    const baseLinks = [
      { name: 'Dashboard', path: '/dashboard-connected' },
      { name: 'Activités', path: '/activities' },
      { name: 'Lauréats', path: '/laureats-connected' },
    ];
    
    // Ajouter les liens spécifiques aux rôles
    if (user?.role === 'admin' || user?.role === 'bureau') {
      baseLinks.push({ name: 'Admin', path: '/admin' });
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
    await AuthService.logout();
    navigate('/connexion', { replace: true });
  };

  // Lien vers le profil selon le rôle
  const getProfilePath = () => {
    if (user?.role === 'laureat') {
      return '/laureats/profil';
    }
    return '/profil';
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-[#172d45]">
              CEEAM-LOGO
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
          <div className="flex items-center gap-4">
            {/* Icône de notification avec badge */}
            <Link 
              to="/notifications" 
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bell className="w-6 h-6 text-[#f59f24]" />
              {/* Badge de notification */}
              {user && user.notificationCount > 0 && (
                <span className="absolute top-0 right-0 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1">
                  {user.notificationCount > 9 ? '9+' : user.notificationCount}
                </span>
              )}
            </Link>

            {/* Avatar utilisateur avec menu déroulant */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#9ca33f] text-white font-semibold text-sm overflow-hidden">
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
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {/* Menu déroulant */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
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
          </div>
        </div>

        {/* Navigation mobile */}
        <nav className="md:hidden flex items-center gap-4 mt-4 overflow-x-auto pb-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="relative pb-2 text-gray-700 hover:text-[#172d45] font-medium text-sm whitespace-nowrap transition-colors"
            >
              {link.name}
              {/* Barre orange pour le lien actif (mobile) */}
              {isActive(link.path) && (
                <span className="absolute bottom-0 left-0 right-0 h-1 bg-[#f59f24] rounded-t-sm"></span>
              )}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default HeaderConnected;