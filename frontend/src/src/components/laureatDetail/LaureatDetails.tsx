import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { X, GraduationCap, MapPin, Mail, Linkedin, Quote, Phone, Globe } from "lucide-react";

// Types
interface AcademicEntry {
  title: string;
  subtitle: string;
  badges: string[];
  startDate?: string;
  endDate?: string | null;
  isCurrent?: boolean;
  year: string;
}

interface ExperienceEntry {
  title: string;
  company: string;
  description: string;
  badges: string[];
  startDate?: string;
  endDate?: string | null;
  isCurrent?: boolean;
  year: string;
}

interface Competence {
  id: number;
  name: string;
  level: string;
  levelDisplay: string;
}

interface CompetenceCategory {
  categoryId: number;
  categorie: string;
  icon: string;
  competences: Competence[];
}

interface LaureatDetailProfile {
  id: number;
  profileImage: string | null;
  quote: string | null;
  promotion: string;
  currentTitle: string | null;
  currentCompany: string | null;
  location: string | null;
  email: string;
  linkedin: string;
  biography: string;
  academicData: AcademicEntry[];
  experienceData: ExperienceEntry[];
  fullName: string;
  phone: string | null;
  nationality: string | null;
  competences: CompetenceCategory[];
}

// Composants
const YearBadge = ({ year }: { year: string }) => (
  <span className="inline-block rounded-full bg-[#172d45] px-3 py-1 text-xs font-semibold text-[#f59f24]">
    {year}
  </span>
);

const SkillBadge = ({ label }: { label: string }) => (
  <span className="inline-block rounded-md bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm">
    {label}
  </span>
);
// nouvelle mise a jour
const getYear = (date?: string | null) => {
  if (!date) return null;

  // Si format "2026"
  if (/^\d{4}$/.test(date)) {
    return date;
  }

  const d = new Date(date);
  if (isNaN(d.getTime())) return null;

  return d.getFullYear().toString();
};
// nouvelle mise a jour
const PeriodBadge = ({
  startDate,
  endDate,
  isCurrent,
}: {
  startDate?: string;
  endDate?: string | null;
  isCurrent?: boolean;
}) => {
  const startYear = getYear(startDate);
  const endYear = getYear(endDate);

  if (!startYear) return null;

  if (isCurrent) {
    return (
      <span className="inline-block rounded-full bg-[#172d45] px-3 py-1 text-xs font-semibold text-[#f59f24]">
        {startYear} – Présent
      </span>
    );
  }

  if (endYear) {
    if (startYear === endYear) {
      return (
        <span className="inline-block rounded-full bg-[#172d45] px-3 py-1 text-xs font-semibold text-[#f59f24]">
          {startYear}
        </span>
      );
    }
    return (
      <span className="inline-block rounded-full bg-[#172d45] px-3 py-1 text-xs font-semibold text-[#f59f24]">
        {startYear} – {endYear}
      </span>
    );
  }

  return (
    <span className="inline-block rounded-full bg-[#172d45] px-3 py-1 text-xs font-semibold text-[#f59f24]">
      {startYear}
    </span>
  );
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-4 flex items-center gap-3">
    <div className="h-7 w-1.5 rounded-full bg-[#f59f24]" />
    <h2 className="text-lg font-bold text-gray-900">{children}</h2>
  </div>
);

const CompetenceSection = ({ competences }: { competences: CompetenceCategory[] }) => {
  if (!competences || competences.length === 0) return null;
  
  return (
    <section>
      <SectionTitle>Compétences</SectionTitle>
      <div className="space-y-4">
        {competences.map((category) => (
          <div key={category.categoryId} className="rounded-2xl bg-[#d1d5db] p-5 shadow-sm">
            <h3 className="mb-3 text-base font-bold text-gray-900">{category.categorie}</h3>
            <div className="flex flex-wrap gap-2">
              {category.competences.map((skill) => (
                <SkillBadge key={skill.id} label={`${skill.name} - ${skill.levelDisplay}`} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const LaureatDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<LaureatDetailProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mapHistoriqueEntryToAcademic = (entry: any): AcademicEntry => ({
    title: entry.title,
    subtitle: [entry.organization, entry.location].filter(Boolean).join(' • '),
    badges: entry.description ? [entry.description] : [],
    startDate: entry.startDate,
    endDate: entry.endDate,
    isCurrent: entry.isCurrent,
    year: getYear(entry.startDate) || '',
  });

  const mapHistoriqueEntryToExperience = (entry: any): ExperienceEntry => ({
    title: entry.title,
    company: entry.organization || '',
    description: entry.description || '',
    badges: [entry.location].filter(Boolean),
    startDate: entry.startDate,
    endDate: entry.endDate,
    isCurrent: entry.isCurrent,
    year: getYear(entry.startDate) || '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) return;
      try {
        const res = await fetch(`/api/laureats/${id}/details/`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Erreur de chargement");
        const data = await res.json();

        const rawHistorique = data.historique || data.history || [];
        const academicDataFromHistorique = Array.isArray(rawHistorique)
          ? rawHistorique.filter((entry: any) => entry.entryType === 'academic').map(mapHistoriqueEntryToAcademic)
          : [];
        const experienceDataFromHistorique = Array.isArray(rawHistorique)
          ? rawHistorique.filter((entry: any) => entry.entryType === 'professional').map(mapHistoriqueEntryToExperience)
          : [];

        setProfile({
          id: data.id,
          profileImage: data.profileImage || data.image || null,
          quote: data.quote || data.citation || null,
          promotion: data.promotion || '',
          currentTitle: data.currentTitle || data.job?.title || null,
          currentCompany: data.currentCompany || data.job?.company || null,
          location: data.location || data.job?.location || null,
          email: data.email || data.personalInfo?.email || data.job?.email || '',
          linkedin: data.linkedin || data.academicInfo?.linkedin || '',
          biography: data.biography || data.bio || data.biographie || '',
          academicData: Array.isArray(data.academicData) && data.academicData.length > 0
            ? data.academicData
            : academicDataFromHistorique,
          experienceData: Array.isArray(data.experienceData) && data.experienceData.length > 0
            ? data.experienceData
            : experienceDataFromHistorique,
          fullName: data.fullName || data.name || '',
          phone: data.phone || '',
          nationality: data.nationality || '',
          competences: Array.isArray(data.competences) ? data.competences : [],
        });
      } catch (err) {
        setError("Impossible de charger le profil.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#e5e7eb] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#e5e7eb] flex items-center justify-center">
        <p className="text-red-600">{error || "Profil non trouvé"}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e5e7eb]">
      {/* Header */}
      <header className="relative flex flex-col items-center bg-[#172d45] px-6 pb-10 pt-6">
        <button
          onClick={() => navigate(-1)}
          className="absolute right-4 top-4 rounded-full p-1 text-white transition hover:bg-white/10"
        >
          <X size={28} />
        </button>

        {/* Profile photo */}
        <div className="mb-4 h-24 w-24 overflow-hidden rounded-full border-4 border-white/20 shadow-xl">
          {profile.profileImage ? (
            <img
              src={profile.profileImage}
              alt="Photo de profil"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gray-400 flex items-center justify-center text-white text-2xl">
              {profile.promotion.slice(0, 2)}
            </div>
          )}
        </div>

        {/* Nom complet */}
        <h1 className="mb-2 text-2xl font-bold text-white">{profile.fullName}</h1>

        {/* Quote avec guillemets */}
        <div className="mb-3 flex items-center gap-2 text-center">
          <span className="text-2xl text-white/40 font-serif">"</span>
          <p className="text-lg font-light text-white">{profile.quote || "—"}</p>
          <span className="text-2xl text-white/40 font-serif">"</span>
        </div>

        {/* Badge promotion */}
        <span className="mb-4 rounded-full bg-[#f59f24] px-6 py-2 text-sm font-bold text-white shadow-md">
          {profile.promotion}
        </span>

        {/* Info card */}
        <div className="w-full max-w-xs rounded-2xl bg-[#1e3a52] px-6 py-5 shadow-lg border border-white/10">
          <div className="mb-3 flex items-start gap-3">
            <GraduationCap size={20} className="text-white mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-base font-semibold text-white leading-tight">
                {profile.currentTitle || "—"}
              </p>
              <p className="text-sm text-white/70 mt-0.5">
                {profile.currentCompany || "—"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin size={20} className="text-white flex-shrink-0" />
            <p className="text-sm text-white">{profile.location || "—"}</p>
          </div>
        </div>

        {/* Email et LinkedIn icons */}
        <div className="mt-3 flex gap-4">
          <a
            href={`mailto:${profile.email}`}
            className="rounded-full bg-white/10 p-2.5 text-white transition hover:bg-white/20"
          >
            <Mail size={20} />
          </a>
          {profile.linkedin && (
            <a
              href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://${profile.linkedin}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-white/10 p-2.5 text-white transition hover:bg-white/20"
            >
              <Linkedin size={20} />
            </a>
          )}
        </div>
      </header>

      {/* Scrollable content */}
      <main className="mx-auto max-w-lg space-y-8 px-5 py-8">
        {/* Biographie */}
        <section>
          <SectionTitle>Biographie</SectionTitle>
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm leading-relaxed text-gray-700">
              {profile.biography || "Aucune biographie renseignée."}
            </p>
          </div>
        </section>

        {/* Informations personnelles */}
        <section>
          <SectionTitle>Informations personnelles</SectionTitle>
          <div className="rounded-2xl bg-white p-5 shadow-sm space-y-2">
            <p className="text-sm text-gray-700">
              <strong>Téléphone :</strong> {profile.phone || "Non renseigné"}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Nationalité :</strong> {profile.nationality || "Non renseignée"}
            </p>
          </div>
        </section>

        {/* Parcours académique */}
        <section>
          <SectionTitle>Parcours académique</SectionTitle>
          <div className="space-y-4">
            {profile.academicData.map((item, i) => (
              <div key={i} className="rounded-2xl bg-[#d1d5db] p-5 shadow-sm">
                <h3 className="text-center text-base font-bold text-gray-900">
                  {item.title}
                </h3>
                <p className="mb-4 text-center text-sm text-gray-600">
                  {item.subtitle}
                </p>
                <div className="mb-4 flex flex-wrap justify-center gap-2">
                  {item.badges.map((b, j) => (
                    <SkillBadge key={j} label={b} />
                  ))}
                </div>
                <PeriodBadge 
                  startDate={item.startDate} 
                  endDate={item.endDate} 
                  isCurrent={item.isCurrent} 
                />
              </div>
            ))}
          </div>
        </section>

        {/* Experiences Professionnelles */}
        <section>
          <SectionTitle>Experiences Professionnelles</SectionTitle>
          <div className="space-y-4">
            {profile.experienceData.map((item, i) => (
              <div key={i} className="rounded-2xl bg-[#d1d5db] p-5 shadow-sm">
                <h3 className="text-center text-base font-bold text-gray-900">
                  {item.title}
                </h3>
                <p className="mb-1 text-center text-sm font-medium text-gray-700">
                  {item.company}
                </p>
                <p className="mb-4 text-center text-sm text-gray-600">
                  {item.description}
                </p>
                <div className="mb-4 flex flex-wrap justify-center gap-2">
                  {item.badges.map((b, j) => (
                    <SkillBadge key={j} label={b} />
                  ))}
                </div>
                <PeriodBadge 
                  startDate={item.startDate} 
                  endDate={item.endDate} 
                  isCurrent={item.isCurrent} 
                />
              </div>
            ))}
          </div>
        </section>

        {/* Compétences */}
        <CompetenceSection competences={profile.competences} />
      </main>
    </div>
  );
};

export default LaureatDetails;