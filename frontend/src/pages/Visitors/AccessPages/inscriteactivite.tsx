import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import HeaderConnected from "@/components/layout/HeaderConnected";
import Footer from "@/components/layout/Footer";
import Inscriptionactivite from "@/components/activity/inscriptionActivite";
import { AuthService } from "@/services/authService";

const Inscractivite = () => {
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      const cachedUser = AuthService.getCurrentUser();
      if (cachedUser) {
        if (isMounted) {
          setIsAuthenticated(true);
          setIsCheckingSession(false);
        }
        return;
      }

      const user = await AuthService.fetchCurrentUser();
      if (!isMounted) {
        return;
      }

      setIsAuthenticated(!!user);
      setIsCheckingSession(false);
    };

    void checkSession();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Chargement de la session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {isAuthenticated ? <HeaderConnected /> : <Header />}
      
      <main className="flex-1">
        <Inscriptionactivite />
      </main>
      
      <Footer />
    </div>
  );
};

export default Inscractivite;
