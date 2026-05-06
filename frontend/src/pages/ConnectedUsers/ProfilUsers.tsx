import { useState, useEffect } from "react";
import Header from "@/components/layout/HeaderConnected";
import Footer from "@/components/layout/Footer";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileStats from "@/components/profile/ProfileStats";
import JobInfo from "@/components/profile/JobInfo";
import MentoringSection from "@/components/profile/MentoringSection";
import SkillsSection from "@/components/profile/SkillsSection";
import PersonalInfo from "@/components/profile/PersonnalInfo";
import AcademicInfo from "@/components/profile/AcademicInfo";
import { ProfileService } from "@/services/profileService";
import { AuthService } from "@/services/authService";
import { ProfileApiResponse, LaureatViewProfile } from "@/types/laureats-connected";
import { User } from "@/types/auth";

// ─── Helpers ───────────────────────────────────────────────────────────────
const getInitials = (firstName: string, lastName: string) =>
  `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();

const getRoleDisplay = (role: string) => {
  const map: Record<string, string> = {
    student: "Étudiant",
    bureau: "Bureau",
    admin: "Administrateur",
    laureat: "Lauréat",
  };
  return map[role] ?? role;
};

const formatMemberSince = (dateStr: string) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    month: "short",
    year: "numeric",
  });
};
// ───────────────────────────────────────────────────────────────────────────

const ProfilUsers = () => {
  const [profile, setProfile] = useState<ProfileApiResponse | null>(null);
  const [laureatProfile, setLaureatProfile] = useState<LaureatViewProfile | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMentoringAvailable, setIsMentoringAvailable] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. Récupère l'utilisateur (fresh > cache)
        const freshUser = await AuthService.fetchCurrentUser();
        const currentUser = freshUser ?? AuthService.getCurrentUser();
        setUser(currentUser);

        // 2. Récupère le profil de base (tous rôles)
        const profileData = await ProfileService.getMyProfile();
        setProfile(profileData);

        // 3. Si lauréat, récupère les données étendues (job, mentoring…)
        if (currentUser?.role === "laureat" && currentUser.id) {
          try {
            const lp = await ProfileService.getLaureatProfile(currentUser.id);
            setLaureatProfile(lp);
          } catch {
            // Pas bloquant : les sections lauréat seront simplement masquées
          }
        }
      } catch (err) {
        console.error("Erreur chargement profil :", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleMentoringToggle = async () => {
    if (!user) return;
    try {
      const result = await ProfileService.updateMentoringAvailability(
        user.id,
        !isMentoringAvailable
      );
      setIsMentoringAvailable(result.isMentorAvailable);
    } catch (err) {
      console.error("Erreur mise à jour mentorat :", err);
    }
  };

  // ─── États intermédiaires ──────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background font-sans">
        <Header />
        <main className="container mx-auto px-4 py-8 flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          <span className="ml-3 text-muted-foreground">Chargement du profil…</span>
        </main>
        <Footer />
      </div>
    );
  }

  if (!profile || !user) {
    return (
      <div className="min-h-screen bg-background font-sans">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">
            Impossible de charger le profil.
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  // ─── Données construites depuis l'API (plus aucun mock) ────────────────
  const isLaureat = user.role === "laureat";

  const profileHeaderData = {
    name: `${profile.firstName} ${profile.lastName}`,
    initials: getInitials(profile.firstName, profile.lastName),
    status: getRoleDisplay(user.role),
    promotion: profile.promotion,
    speciality: profile.specialite_intitule || profile.field,
    nationality: profile.nationality || profile.country_name,
    memberSince: formatMemberSince(profile.date_joined),
    bio: profile.biography || profile.biographie || "",
    avatar_url: profile.avatar_url || profile.photoUrl,
  };

  // getMyStats est commenté côté service → on passe des zéros en attendant
  const statsData = { activities: 0, votes: 0, connections: 0, contributions: 0 };

  const personalInfoData = {
    email: profile.email,
    phone: profile.phone,
    nationality: profile.nationality || profile.country_name,
    language: profile.preferred_language || profile.language,
  };

  const academicInfoData = {
    promotion: profile.promotion,
    field: profile.specialite_intitule || profile.field,
    linkedin: profile.linkedin || profile.linkedin_url,
  };

  const skills = profile.interests ?? [];
  const job = laureatProfile?.job;   // undefined pour les non-lauréats

  return (
    <div className="min-h-screen bg-background font-sans">
      <Header />

      <main className="container mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Votre Profil</h1>
          <p className="text-muted-foreground mt-2">
            Votre profil que vous pouvez modifier
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-8">
            <ProfileHeader profile={profileHeaderData} />
            <ProfileStats stats={statsData} />
            {/* JobInfo uniquement si lauréat ET données disponibles */}
            {isLaureat && job && <JobInfo job={job} />}
          </div>

          {/* Colonne latérale */}
          <div className="space-y-8">
            {isLaureat && (
              <MentoringSection
                isAvailable={isMentoringAvailable}
                onToggle={handleMentoringToggle}
              />
            )}
            {skills.length > 0 && <SkillsSection skills={skills} />}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <PersonalInfo info={personalInfoData} />
          <AcademicInfo info={academicInfoData} />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProfilUsers;