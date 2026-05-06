/**
 * ProtectedRoute - Protection des routes nécessitant une authentification
 * =======================================================================
 * 
 * Ce composant vérifie l'authentification via les cookies HttpOnly.
 * Si l'utilisateur n'est pas connecté, il est redirigé vers /connexion.
 * 
 * Flux de reconnexion automatique :
 * 1. Au chargement, le cache mémoire est vide
 * 2. On appelle /api/auth/me/ pour vérifier si le cookie JWT est valide
 * 3. Si oui, l'utilisateur est mis en cache et la page s'affiche
 * 4. Si non (cookie expiré/invalide), redirection vers /connexion
 */

import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthService } from '@/services/authService';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'student' | 'bureau' | 'admin' | 'laureat';
  allowedRoles?: Array<'student' | 'bureau' | 'admin' | 'laureat'>;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole, allowedRoles }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasRequiredRole, setHasRequiredRole] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAuthentication = async () => {
      setIsChecking(true);
      
      // Essayer d'abord le cache mémoire
      let user = AuthService.getCurrentUser();
      
      // Si pas en cache, tenter de récupérer via l'API (reconnexion automatique)
      if (!user) {
        user = await AuthService.fetchCurrentUser();
      }
      
      if (user) {
        setIsAuthenticated(true);
        
        // Vérifier le rôle si requis
        if (allowedRoles && allowedRoles.length > 0) {
          setHasRequiredRole(allowedRoles.includes(user.role));
        } else if (requiredRole) {
          setHasRequiredRole(user.role === requiredRole || user.role === 'admin');
        }
      } else {
        setIsAuthenticated(false);
      }
      
      setIsChecking(false);
    };

    checkAuthentication();
  }, [requiredRole, allowedRoles]);

  // Afficher un loader pendant la vérification
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification de la session...</p>
        </div>
      </div>
    );
  }

  // Si pas authentifié, rediriger vers la connexion
  if (!isAuthenticated) {
    // Sauvegarder l'URL actuelle pour rediriger après connexion
    return <Navigate to="/connexion" state={{ from: location.pathname }} replace />;
  }

  // Si rôle requis mais pas autorisé
  if (!hasRequiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Accès refusé</h1>
          <p className="text-gray-600 mb-4">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
          <a href="/dashboard-connected" className="text-blue-600 hover:underline">
            Retour au tableau de bord
          </a>
        </div>
      </div>
    );
  }

  // Authentifié et autorisé
  return <>{children}</>;
};

export default ProtectedRoute;
