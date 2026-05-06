import { useNavigate } from "react-router-dom";
import { ICONS } from "@/constants/icons.ts";
import { AuthService } from "@/services/authService";

const ProfileHeader = ({ profile }) => {
  const { Award, Calendar, BookOpen, Building, Globe, Edit3, Share2, Eye } = ICONS;
  const navigate = useNavigate();
  const currentUser = AuthService.getCurrentUser();

  // Déterminer le chemin d'édition selon le rôle
  const getEditProfilePath = () => {
    if (currentUser?.role === 'laureat') {
      return '/laureats/edit-profile';
    }
    return '/edit-profile';
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: profile.name,
        text: `Découvrez le profil de ${profile.name}`,
        url: window.location.href,
      });
    } else {
      alert(`Partager le profil de ${profile.name}\n${window.location.href}`);
    }
  };

  const handleViewPublicProfile = () => {
    navigate("/profil-laureat");
  };
  
  return (
    <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          {/* Avatar et initiales */}
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-navy flex items-center justify-center text-white text-2xl font-bold">
              {profile.initials}
            </div>
            <div className="md:hidden">
              <div className="flex items-center gap-2 mb-1">
                <Award className="h-4 w-4 text-orange" />
                <span className="text-sm font-medium text-orange">{profile.status}</span>
              </div>
            </div>
          </div>
          
          {/* Informations */}
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">{profile.name}</h2>
                <div className="flex flex-wrap items-center gap-4 mt-2">
                  <div className="hidden md:flex items-center gap-2">
                    <Award className="h-4 w-4 text-orange" />
                    <span className="text-sm font-medium text-orange">{profile.status}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Promotion {profile.promotion}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{profile.speciality}</span>
                  </div>
                </div>
              </div>
              {/* Avant — supprime la ligne campus */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                {/* ❌ <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{profile.campus}</span>
                </div> */}
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{profile.nationality}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Membre depuis {profile.memberSince}</span>
                </div>
              </div>
              {/* Boutons d'action */}
              <div className="flex gap-2">
                <button 
                  onClick={() => navigate(getEditProfilePath())}
                  className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                  <Edit3 className="h-4 w-4" />
                  Modifier
                </button>
                {/* <button 
                  onClick={handleShare}
                  className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                  <Share2 className="h-4 w-4" />
                  Partager
                </button> */}
              </div>
            </div>
            
            {/* Bio */}
            <div className="mt-6">
              <p className="text-muted-foreground">{profile.bio}</p>
            </div>
            
            {/* Informations additionnelles */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
              {/* <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{profile.campus}</span>
              </div> */}
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{profile.nationality}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Membre depuis {profile.memberSince}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bouton Profil Public */}
      <div className="border-t px-6 py-4 bg-muted/50">
        <button 
          onClick={handleViewPublicProfile}
          className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full md:w-auto">
          <Eye className="h-4 w-4" />
          Voir Profil Public
        </button>
      </div>
    </div>
  );
};

export default ProfileHeader;