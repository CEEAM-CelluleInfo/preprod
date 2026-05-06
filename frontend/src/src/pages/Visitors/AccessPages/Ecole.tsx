import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

// Types pour les données API
interface Club {
  id: number;
  name: string;
  interest: string;
  logo_url?: string;
}

interface AcademicDate {
  label: string;
  date: string;
  semester: 1 | 2;
}

interface AcademicCalendar {
  academicYear: string;
  exportUrl?: string;
  dates: AcademicDate[];
}

interface PracticalInfo {
  id: number;
  title: string;
  description: string;
  link_label: string;
  link_url: string;
  color: string;
  order: number;
}

interface SchoolMedia {
  id: number;
  url: string;
  alt: string;
  position: 1 | 2 | 3;
}

interface StudentGuide {
  url: string;
  filename: string;
  updatedAt: string;
}

export const Ecole: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // États
  const [clubs, setClubs] = useState<Club[]>([]);
  const [calendar, setCalendar] = useState<AcademicCalendar | null>(null);
  const [practicalInfos, setPracticalInfos] = useState<PracticalInfo[]>([]);
  const [media, setMedia] = useState<SchoolMedia[]>([]);
  const [guide, setGuide] = useState<StudentGuide | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination clubs
  const clubsPerPage = 4;
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = Math.ceil(clubs.length / clubsPerPage);
  const currentClubs = clubs.slice(
    currentPage * clubsPerPage,
    (currentPage + 1) * clubsPerPage
  );

  const handlePrevPage = () => {
    setCurrentPage((prev) => (prev > 0 ? prev - 1 : totalPages - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => (prev < totalPages - 1 ? prev + 1 : 0));
  };

  // Chargement des données
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Clubs
        const clubsRes = await fetch('/api/school/clubs/');
        if (!clubsRes.ok) throw new Error('Erreur chargement clubs');
        const clubsData = await clubsRes.json();
        setClubs(clubsData.data || []);

        // 2. Calendrier académique
        const calendarRes = await fetch('/api/school/academic-calendar/');
        if (!calendarRes.ok) throw new Error('Erreur chargement calendrier');
        const calendarData = await calendarRes.json();
        setCalendar(calendarData);

        // 3. Informations pratiques (optionnel)
        try {
          const infoRes = await fetch('/api/school/practical-info/');
          if (infoRes.ok) {
            const infoData = await infoRes.json();
            setPracticalInfos(infoData.data || []);
          }
        } catch (err) {
          console.warn('Info pratiques non disponibles');
        }

        // 4. Médias (images hero)
        const mediaRes = await fetch('/api/school/media/');
        if (!mediaRes.ok) throw new Error('Erreur chargement médias');
        const mediaData = await mediaRes.json();
        setMedia(mediaData.data || []);

        // 5. Guide étudiant
        try {
          const guideRes = await fetch('/api/school/student-guide/');
          if (guideRes.ok) {
            const guideData = await guideRes.json();
            setGuide(guideData);
          }
        } catch (err) {
          console.warn('Guide étudiant non disponible');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Affichage du chargement
  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Affichage d'erreur (si critique)
  if (error && !clubs.length && !calendar) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center text-red-600">
            <p>Erreur de chargement des données</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg"
            >
              Réessayer
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Organisation des images hero par position
  const heroMedia = {
    pos1: media.find(m => m.position === 1),
    pos2: media.find(m => m.position === 2),
    pos3: media.find(m => m.position === 3),
  };

  return (
    <>
      <Header />

      <div className="bg-gray-50">
        
        {/* Hero Section */}
        <section className="text-center px-6 py-14 text-white" style={{ backgroundColor: '#172d45' }}>
          <h1 className="text-5xl font-extrabold mb-2.5 tracking-tight">
            École Nationale Supérieure <span style={{ color: '#f59f24' }}>Arts & Métiers</span>
          </h1>
          <p className="text-lg opacity-85 max-w-lg mx-auto font-normal">
            Une institution d'excellence au cœur de l'innovation et de la formation d'ingénieurs
          </p>
          
          {/* Media Grid - Images dynamiques */}
          <div className="grid grid-cols-2 gap-4 max-w-3xl mx-auto mt-7 px-5">
            {heroMedia.pos1 && (
              <div className="bg-white rounded-xl border border-gray-300 overflow-hidden" style={{ aspectRatio: '16/9' }}>
                <img src={heroMedia.pos1.url} alt={heroMedia.pos1.alt} className="w-full h-full object-cover" />
              </div>
            )}
            {heroMedia.pos2 && (
              <div className="bg-white rounded-xl border border-gray-300 overflow-hidden" style={{ aspectRatio: '16/9' }}>
                <img src={heroMedia.pos2.url} alt={heroMedia.pos2.alt} className="w-full h-full object-cover" />
              </div>
            )}
            {heroMedia.pos3 && (
              <div className="col-span-2 bg-white rounded-xl border border-gray-300 overflow-hidden" style={{ aspectRatio: '16/9' }}>
                <img src={heroMedia.pos3.url} alt={heroMedia.pos3.alt} className="w-full h-full object-cover" />
              </div>
            )}
            {/* Si certaines images manquent, on peut afficher des placeholders, mais on laisse vide */}
          </div>
        </section>

        {/* Informations Pratiques */}
        <section className="bg-gray-100 px-6 py-13">
          <h2 className="text-center text-3xl font-bold mb-1.5" style={{ color: '#172d45' }}>
            Informations Pratiques
          </h2>
          <p className="text-center text-gray-500 text-sm mb-7">
            Tout ce que vous devez savoir pour votre vie étudiante
          </p>

          <div className="grid grid-cols-2 gap-4 max-w-3xl mx-auto">
            {practicalInfos.length > 0 ? (
              practicalInfos.map((info) => (
                <div 
                  key={info.id}
                  className="rounded-2xl p-6 text-white flex flex-col min-h-[140px] relative overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
                  style={{ backgroundColor: info.color }}
                >
                  <h3 className="text-lg font-bold mb-2">{info.title}</h3>
                  <p className="text-sm opacity-90 flex-grow leading-snug">
                    {info.description}
                  </p>
                  <a 
                    href={info.link_url} 
                    className="inline-flex items-center gap-1.5 text-sm font-semibold mt-3 opacity-90 hover:opacity-100 transition-opacity"
                    target={info.link_url.startsWith('http') ? '_blank' : '_self'}
                    rel="noopener noreferrer"
                  >
                    {info.link_label}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))
            ) : (
              // Fallback : afficher les cartes par défaut (comme avant)
              <>
                {/* Card 1 - Navy */}
                <div className="rounded-2xl p-6 text-white flex flex-col min-h-[140px] relative overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl" style={{ backgroundColor: '#172d45' }}>
                  <h3 className="text-lg font-bold mb-2">Logement Étudiant</h3>
                  <p className="text-sm opacity-90 flex-grow leading-snug">Découvrez les options de logement disponibles sur le campus et à proximité</p>
                  <a href="#" className="inline-flex items-center gap-1.5 text-sm font-semibold mt-3 opacity-90 hover:opacity-100 transition-opacity">En savoir plus <ExternalLink className="w-3.5 h-3.5" /></a>
                </div>
                {/* Card 2 - Green */}
                <div className="rounded-2xl p-6 text-white flex flex-col min-h-[140px] relative overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl" style={{ backgroundColor: '#28a745' }}>
                  <h3 className="text-lg font-bold mb-2">Restauration</h3>
                  <p className="text-sm opacity-90 flex-grow leading-snug">Restaurants universitaires, cafétérias et options de restauration</p>
                  <a href="#" className="inline-flex items-center gap-1.5 text-sm font-semibold mt-3 opacity-90 hover:opacity-100 transition-opacity">Voir les menus <ExternalLink className="w-3.5 h-3.5" /></a>
                </div>
                {/* Card 3 - Blue */}
                <div className="rounded-2xl p-6 text-white flex flex-col min-h-[140px] relative overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl" style={{ backgroundColor: '#2563eb' }}>
                  <h3 className="text-lg font-bold mb-2">Bibliothèque</h3>
                  <p className="text-sm opacity-90 flex-grow leading-snug">Accédez aux ressources documentaires et espaces de travail</p>
                  <a href="#" className="inline-flex items-center gap-1.5 text-sm font-semibold mt-3 opacity-90 hover:opacity-100 transition-opacity">Horaires & Services <ExternalLink className="w-3.5 h-3.5" /></a>
                </div>
                {/* Card 4 - Navy */}
                <div className="rounded-2xl p-6 text-white flex flex-col min-h-[140px] relative overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl" style={{ backgroundColor: '#172d45' }}>
                  <h3 className="text-lg font-bold mb-2">Services Administratifs</h3>
                  <p className="text-sm opacity-90 flex-grow leading-snug">Scolarité, inscriptions, certificats et démarches administratives</p>
                  <a href="#" className="inline-flex items-center gap-1.5 text-sm font-semibold mt-3 opacity-90 hover:opacity-100 transition-opacity">Contacts <ExternalLink className="w-3.5 h-3.5" /></a>
                </div>
              </>
            )}
          </div>

          {/* Guide Button - Floating */}
          <div className="text-center -mt-6 relative z-10">
            {guide ? (
              <a 
                href={guide.url}
                download={guide.filename}
                className="inline-flex items-center gap-2 text-white px-7 py-3 rounded-3xl font-bold text-sm border-none cursor-pointer transition-all duration-200 hover:-translate-y-1"
                style={{ 
                  backgroundColor: '#f59f24',
                  boxShadow: '0 4px 14px rgba(245, 159, 36, 0.35)'
                }}
              >
                <Download className="w-4 h-4" />
                Télécharger le guide étudiant
              </a>
            ) : (
              <button 
                className="inline-flex items-center gap-2 text-white px-7 py-3 rounded-3xl font-bold text-sm border-none cursor-pointer transition-all duration-200 hover:-translate-y-1"
                style={{ 
                  backgroundColor: '#f59f24',
                  boxShadow: '0 4px 14px rgba(245, 159, 36, 0.35)'
                }}
                disabled
              >
                <Download className="w-4 h-4" />
                Guide bientôt disponible
              </button>
            )}
          </div>
        </section>

        {/* Clubs Section */}
        <section className="bg-white px-6 py-13">
          <h2 className="text-center text-3xl font-bold mb-1.5" style={{ color: '#172d45' }}>
            Clubs de l'École
          </h2>
          <p className="text-center text-gray-500 text-sm mb-7">
            Rejoignez nos clubs et associations étudiantes
          </p>

          <div className="grid grid-cols-2 gap-5 max-w-3xl mx-auto">
            {currentClubs.map((club) => (
              <div 
                key={club.id}
                className="bg-white border border-gray-300 rounded-2xl p-5 flex flex-col gap-3 shadow-sm transition-all duration-200 cursor-pointer hover:shadow-lg hover:-translate-y-1"
              >
                <div className="flex items-center gap-3.5">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: '#f59f24' }}
                  >
                    {club.logo_url ? (
                      <img src={club.logo_url} alt={club.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      club.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold" style={{ color: '#172d45' }}>
                      {club.name}
                    </h3>
                    <p className="text-sm text-gray-500">{club.interest}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <>
              <div className="flex items-center justify-center gap-5 mt-7">
                <button
                  onClick={handlePrevPage}
                  className="w-9 h-9 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95"
                  style={{ color: '#172d45' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#f59f24';
                    e.currentTarget.style.backgroundColor = '#f59f24';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#d1d5db';
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.color = '#172d45';
                  }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex justify-center gap-2.5">
                  {Array.from({ length: totalPages }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPage(index)}
                      className={`rounded-full border-none cursor-pointer transition-all duration-200 hover:scale-110 ${
                        index === currentPage
                          ? 'w-6 h-3'
                          : 'w-3 h-3'
                      }`}
                      style={{
                        backgroundColor: index === currentPage ? '#f59f24' : '#d1d5db',
                        borderRadius: index === currentPage ? '6px' : '50%'
                      }}
                    />
                  ))}
                </div>

                <button
                  onClick={handleNextPage}
                  className="w-9 h-9 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95"
                  style={{ color: '#172d45' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#f59f24';
                    e.currentTarget.style.backgroundColor = '#f59f24';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#d1d5db';
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.color = '#172d45';
                  }}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <p className="text-center mt-4 text-sm text-gray-500 font-medium">
                Page {currentPage + 1} / {totalPages}
              </p>
            </>
          )}
        </section>

        {/* Dates Utiles */}
        {calendar && calendar.dates.length > 0 && (
          <section className="text-white px-6 py-13" style={{ backgroundColor: '#172d45' }}>
            <h2 className="text-center text-3xl font-bold mb-1.5 text-white">
              Dates Utiles
            </h2>
            <p className="text-center text-sm mb-5" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Calendrier académique et événements importants
            </p>

            <div className="flex items-center justify-between max-w-3xl mx-auto mb-5 px-5 py-3 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
              <span className="font-bold text-sm">Année Académique {calendar.academicYear}</span>
              {calendar.exportUrl && (
                <a 
                  href={calendar.exportUrl}
                  download
                  className="inline-flex items-center gap-1.5 text-white px-4 py-1.5 rounded-md text-sm font-semibold border-none cursor-pointer transition-colors duration-200"
                  style={{ backgroundColor: '#f59f24' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d98a1a'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f59f24'}
                >
                  <Download className="w-3.5 h-3.5" />
                  Exporter
                </a>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* Semestre 1 */}
              <div>
                <p className="text-sm mb-1.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  Semestre 1
                </p>
                {calendar.dates.filter(d => d.semester === 1).map((date, idx) => (
                  <div key={idx} className="flex justify-between py-1 text-sm border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                    <span>{date.label}</span>
                    <span>{date.date}</span>
                  </div>
                ))}
              </div>

              {/* Semestre 2 */}
              <div>
                <p className="text-sm mb-1.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  Semestre 2
                </p>
                {calendar.dates.filter(d => d.semester === 2).map((date, idx) => (
                  <div key={idx} className="flex justify-between py-1 text-sm border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                    <span>{date.label}</span>
                    <span>{date.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>

      <Footer />

      <style>{`
        @keyframes footer-fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes section-title-underline {
          from { width: 0; left: 50%; }
          to { width: 40px; left: 0; }
        }
        @keyframes copyright-glow {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default Ecole;