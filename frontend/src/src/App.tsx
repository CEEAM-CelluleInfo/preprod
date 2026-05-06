import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Connexion from "./pages/Visitors/connexion/Connexion";
import Inscription from "./pages/Visitors/connexion/Inscription";
import VerifyEmail from "./pages/Visitors/connexion/VerifyEmail";
import ResendVerification from "./pages/Visitors/connexion/ResendVerification";
import ForgotPassword from "./pages/Visitors/connexion/ForgotPassword";
import ResetPassword from "./pages/Visitors/connexion/ResetPassword";
import NotFound from "./pages/NotFound";
import ActivitiesPage from "./pages/Visitors/AccessPages/ActivitiesPage";
import ActivityDetailVisitorPage from "./pages/Visitors/AccessPages/ActivityDetailPage";
import ProposeActivityPage from "./pages/Visitors/AccessPages/ProposeActivityPage";
import APropos from "./pages/Visitors/AccessPages/APropos";
import Ecole from "./pages/Visitors/AccessPages/Ecole";
import Laureats from "./pages/Visitors/AccessPages/Laureats";
import RejoindreLaureats from "./pages/Visitors/AccessPages/RejoindreLaureats";
import Inscractivite from "./pages/Visitors/AccessPages/inscriteactivite";
import VotePageWrapper from "./pages/ConnectedUsers/pagedevote";
import LaureatDetail from "./pages/ConnectedUsers/laureatDetails";
import ViewProfilUser from "./pages/ConnectedUsers/ViewProfilUser";
import Notifications from "./pages/ConnectedUsers/Notifications";
import ListesActiviteConnected from "./pages/ConnectedUsers/listesactiviteconnected";
import ActivityDetailPage from "./pages/ConnectedUsers/ActivityDetailPage";
import EditProfilePage from "./pages/ConnectedUsers/EditProfilePage";
import LaureatsUserConnected from "./pages/ConnectedUsers/LaureatsUserConnected";
import EditProfileLaureat from "./pages/laureats/EditProfileLaureat";
import ViewProfilLaureat from "./pages/laureats/ViewProfilLaureat";
import DashUserConnected from "./pages/ConnectedUsers/DashUserConnected";
import ConnectedProposeActivity from "./pages/ConnectedUsers/ProposeActivityPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>

          {/* LES ROUTES POUR LES VISITEURS */}
          <Route path="/" element={<Index />} />
          <Route path="/connexion" element={<Connexion />} />
          <Route path="/visiteur/inscription" element={<Inscription />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/resend-verification" element={<ResendVerification />} />
          <Route path="/mot-de-passe-oublie" element={<ForgotPassword />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reinitialiser-mot-de-passe" element={<ResetPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/activites" element={<ActivitiesPage />} />
          <Route path="/activites/:id" element={<ActivityDetailVisitorPage />} />
          <Route path="/proposer-activite" element={<ProposeActivityPage />} />
          <Route path="/ecole" element={<Ecole />} />
          <Route path="/a-propos" element={<APropos />} />
          <Route path="/laureats" element={<Laureats />} />
          <Route path="/laureats/rejoindre" element={<RejoindreLaureats />} />
          <Route path="/laureats/:id" element={<ProtectedRoute><LaureatDetail /></ProtectedRoute>} />
          <Route path="/inscription-activity" element={<Inscractivite />} />

          {/* ESPACE MEMBRE */}
          <Route path="/dashboard" element={<ProtectedRoute><DashUserConnected /></ProtectedRoute>} />
          <Route path="/profil" element={<ProtectedRoute><ViewProfilUser /></ProtectedRoute>} />
          <Route path="/dashboard-connected" element={<ProtectedRoute><DashUserConnected /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/activities" element={<ProtectedRoute><ListesActiviteConnected /></ProtectedRoute>} />
          <Route path="/activity/:id" element={<ProtectedRoute><ActivityDetailPage /></ProtectedRoute>} />
          <Route path="/edit-profile" element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>} />
          <Route path="/laureats-connected" element={<ProtectedRoute><LaureatsUserConnected /></ProtectedRoute>} />
          <Route path="/vote" element={<ProtectedRoute><VotePageWrapper /></ProtectedRoute>} />
          <Route path="/laureat-details/:id" element={<ProtectedRoute><LaureatDetail /></ProtectedRoute>} />
          <Route path="/proposer-activite-connected" element={<ProtectedRoute><ConnectedProposeActivity /></ProtectedRoute>} />

          {/* ESPACE LAURÉAT */}
          <Route path="/laureats/edit-profile" element={<ProtectedRoute requiredRole="laureat"><EditProfileLaureat /></ProtectedRoute>} />
          <Route path="/laureats/profil" element={<ProtectedRoute requiredRole="laureat"><ViewProfilLaureat /></ProtectedRoute>} />

          {/* Route 404 générale */}
          <Route path="/*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
