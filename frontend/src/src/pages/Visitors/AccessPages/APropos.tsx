import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Target, 
  Eye, 
  Heart,
  ChevronLeft,
  ChevronRight,
  Mail,
  MapPin,
  GraduationCap,
  Calendar,
  Linkedin,
  Globe
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

interface Leader {
  id: number;
  nom: string;
  prenom: string;
  position: string;
  executive: string;
  email: string;
  nationality: string;
  flag: string;
  filiere: string;
  campus: string;
  mandat: string;
  mission: string;
  linkedin?: string;
  image?: string;
}

interface Stat {
  value: string;
  label: string;
}

interface AboutContent {
  mission_paragraphs: string[];
  vision_paragraphs: string[];
  valeurs_list: { title: string; desc: string }[];
}

export const APropos: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'mission' | 'vision' | 'valeurs'>('mission');
  const [currentLeaderIndex, setCurrentLeaderIndex] = useState(0);
  
  // États pour les données API
  const [stats, setStats] = useState<Stat[]>([]);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [aboutContent, setAboutContent] = useState<AboutContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chargement des données
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Récupérer les statistiques
        const statsRes = await fetch('/api/about/stats/');
        if (!statsRes.ok) throw new Error('Erreur chargement statistiques');
        const statsData = await statsRes.json();
        setStats(statsData.data || []);

        // 2. Récupérer les leaders
        const leadersRes = await fetch('/api/about/leaders/');
        if (!leadersRes.ok) throw new Error('Erreur chargement leaders');
        const leadersData = await leadersRes.json();
        setLeaders(leadersData.data || []);

        // 3. Récupérer le contenu Mission/Vision/Valeurs (optionnel)
        const contentRes = await fetch('/api/about/content/');
        if (contentRes.ok) {
          const contentData = await contentRes.json();
          setAboutContent(contentData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Gestionnaires de pagination leaders
  const handlePrevLeader = () => {
    setCurrentLeaderIndex((prev) => (prev > 0 ? prev - 1 : leaders.length - 1));
  };

  const handleNextLeader = () => {
    setCurrentLeaderIndex((prev) => (prev < leaders.length - 1 ? prev + 1 : 0));
  };

  // Affichage du chargement
  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Affichage d'erreur (optionnel)
  if (error && !stats.length && !leaders.length) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background flex items-center justify-center">
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

  const currentLeader = leaders[currentLeaderIndex];

  return (
    <>
      <Header />
      
      <div className="min-h-screen bg-background">
        {/* Header Section - Bleu Marine */}
        <header 
          className="text-white px-6 py-16 text-center flex items-center justify-center min-h-[300px]"
          style={{ background: 'linear-gradient(135deg, #172d45 0%, #2a4f73 100%)' }}
        >
          <div className="max-w-3xl mx-auto">
            <h1 className="text-5xl font-extrabold mb-4 tracking-tight">
              À Propos de la CEEAM
            </h1>
            <p className="text-xl leading-relaxed opacity-95">
              Découvrez notre <strong className="font-bold" style={{ color: '#f59f24' }}>mission</strong>, 
              notre <strong className="font-bold" style={{ color: '#f59f24' }}>vision</strong> et 
              les <strong className="font-bold" style={{ color: '#f59f24' }}>valeurs</strong> qui nous animent
            </p>
          </div>
        </header>

        {/* Statistics Section */}
        {stats.length > 0 && (
          <div className="max-w-5xl mx-auto px-6 my-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-6 text-center shadow-lg border-2 border-gray-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="text-5xl font-extrabold mb-2 leading-none" style={{ color: '#172d45' }}>
                    {stat.value}
                  </div>
                  <div className="text-base text-gray-600 font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mission/Vision/Valeurs Section */}
        <div className="max-w-5xl mx-auto px-6 my-16">
          <div 
            className="rounded-3xl p-10 border-2 border-gray-200 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #fef3e2 0%, white 100%)' }}
          >
            <div 
              className="absolute top-0 left-0 w-1.5 h-full"
              style={{ background: 'linear-gradient(to bottom, #f59f24, #fbbf24)' }}
            />

            <div className="flex justify-center gap-4 mb-8 flex-wrap">
              <button
                onClick={() => setActiveTab('mission')}
                className={`px-8 py-3 rounded-full font-semibold transition-all duration-300 flex items-center gap-2 ${
                  activeTab === 'mission'
                    ? 'text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:-translate-y-0.5'
                }`}
                style={activeTab === 'mission' ? { 
                  background: '#f59f24',
                  boxShadow: '0 4px 15px rgba(255, 107, 0, 0.3)'
                } : {}}
              >
                <Target className={`w-5 h-5 ${activeTab === 'mission' ? 'text-white' : 'text-orange-400'}`} />
                Mission
              </button>

              <button
                onClick={() => setActiveTab('vision')}
                className={`px-8 py-3 rounded-full font-semibold transition-all duration-300 flex items-center gap-2 ${
                  activeTab === 'vision'
                    ? 'text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:-translate-y-0.5'
                }`}
                style={activeTab === 'vision' ? { 
                  background: '#f59f24',
                  boxShadow: '0 4px 15px rgba(255, 107, 0, 0.3)'
                } : {}}
              >
                <Eye className={`w-5 h-5 ${activeTab === 'vision' ? 'text-white' : 'text-orange-400'}`} />
                Vision
              </button>

              <button
                onClick={() => setActiveTab('valeurs')}
                className={`px-8 py-3 rounded-full font-semibold transition-all duration-300 flex items-center gap-2 ${
                  activeTab === 'valeurs'
                    ? 'text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:-translate-y-0.5'
                }`}
                style={activeTab === 'valeurs' ? { 
                  background: '#f59f24',
                  boxShadow: '0 4px 15px rgba(255, 107, 0, 0.3)'
                } : {}}
              >
                <Heart className={`w-5 h-5 ${activeTab === 'valeurs' ? 'text-white' : 'text-orange-400'}`} />
                Valeurs
              </button>
            </div>

            <div>
              {activeTab === 'mission' && (
                <div>
                  <h2 className="text-4xl font-bold text-center mb-6" style={{ color: '#172d45' }}>
                    Notre Mission
                  </h2>
                  <div className="text-gray-700 leading-relaxed text-lg font-semibold">
                    {aboutContent?.mission_paragraphs && aboutContent.mission_paragraphs.length > 0 ? (
                      aboutContent.mission_paragraphs.map((para, idx) => (
                        <p key={idx} className="mb-5 text-justify">{para}</p>
                      ))
                    ) : (
                      <p className="text-justify">
                        La CEEAM (Communauté des Étudiants Étrangers Arts & Métiers) a pour mission de créer 
                        un environnement inclusif et solidaire pour tous les étudiants internationaux de l'ENSAM. 
                        Nous nous engageons à faciliter l'intégration académique et sociale de nos membres tout 
                        en valorisant la richesse de nos cultures diverses.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'vision' && (
                <div>
                  <h2 className="text-4xl font-bold text-center mb-6" style={{ color: '#172d45' }}>
                    Notre Vision
                  </h2>
                  <div className="text-gray-700 leading-relaxed text-lg font-semibold">
                    {aboutContent?.vision_paragraphs && aboutContent.vision_paragraphs.length > 0 ? (
                      aboutContent.vision_paragraphs.map((para, idx) => (
                        <p key={idx} className="mb-5 text-justify">{para}</p>
                      ))
                    ) : (
                      <p className="text-justify">
                        Nous aspirons à faire de la CEEAM une référence en matière d'excellence académique et 
                        d'intégration culturelle au sein de l'ENSAM. Notre vision est de construire un pont entre 
                        les cultures, favorisant ainsi l'échange et l'enrichissement mutuel.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'valeurs' && (
                <div>
                  <h2 className="text-4xl font-bold text-center mb-6" style={{ color: '#172d45' }}>
                    Nos Valeurs
                  </h2>
                  <ul className="space-y-4">
                    {(aboutContent?.valeurs_list && aboutContent.valeurs_list.length > 0 ? aboutContent.valeurs_list : [
                      { title: 'Solidarité', desc: 'Nous créons un réseau d\'entraide fort entre tous nos membres' },
                      { title: 'Excellence', desc: 'Nous visons l\'excellence dans toutes nos actions et initiatives' },
                      { title: 'Diversité', desc: 'Nous célébrons et valorisons la richesse de nos différences culturelles' },
                      { title: 'Inclusion', desc: 'Nous garantissons un environnement accueillant pour tous' },
                      { title: 'Innovation', desc: 'Nous encourageons la créativité et les nouvelles idées' }
                    ]).map((valeur, index) => (
                      <li key={index} className="pl-8 relative text-lg">
                        <span className="absolute left-0 top-1 text-xl" style={{ color: '#f59f24' }}>★</span>
                        <strong style={{ color: '#172d45' }}>{valeur.title}:</strong>{' '}
                        <span className="text-gray-700 font-semibold">{valeur.desc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Leaders Section */}
        {leaders.length > 0 && (
          <div className="max-w-6xl mx-auto px-6 py-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-extrabold mb-4 relative inline-block" style={{ color: '#172d45' }}>
                Notre Leadership
                <span 
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-1 rounded"
                  style={{ background: 'linear-gradient(to right, #f59f24, #fbbf24)' }}
                />
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto mt-6 leading-relaxed">
                Découvrez les personnes qui donnent vie à notre vision et guident notre communauté
              </p>
            </div>

            <div className="flex justify-center px-5">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl flex flex-col md:flex-row border border-gray-200 min-h-[400px]">
                <div className="w-full md:w-[450px] bg-gray-100 rounded-t-xl md:rounded-l-xl md:rounded-tr-none flex-shrink-0">
                  {currentLeader.image ? (
                    <img 
                      src={currentLeader.image} 
                      alt={`${currentLeader.prenom} ${currentLeader.nom}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, #172d45 0%, #2a4f73 100%)' }}
                    >
                      <span className="text-7xl font-bold text-white">
                        {currentLeader.prenom[0]}{currentLeader.nom[0]}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex-1 p-8 flex flex-col justify-between">
                  <div className="mb-6">
                    <div className="mb-4">
                      <h3 className="text-4xl font-bold mb-1" style={{ color: '#172d45' }}>
                        {currentLeader.nom}
                      </h3>
                      <p className="text-3xl font-semibold" style={{ color: '#2a4f73' }}>
                        {currentLeader.prenom}
                      </p>
                    </div>
                    
                    <p className="text-2xl font-semibold mb-2" style={{ color: '#f59f24' }}>
                      {currentLeader.position}
                    </p>
                    
                    <div className="inline-block px-4 py-2 rounded-lg mb-4" style={{ background: '#fef3e2' }}>
                      <span className="font-bold" style={{ color: '#172d45' }}>
                        Mandat:
                      </span>{' '}
                      <span className="text-gray-600">{currentLeader.executive}</span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-4 p-3 rounded-lg" style={{ background: '#fef3e2' }}>
                      <Mail className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#172d45' }} />
                      <div className="flex flex-wrap items-baseline gap-2 flex-1">
                        <strong className="font-bold min-w-[110px]" style={{ color: '#172d45' }}>Email:</strong>
                        <a 
                          href={`mailto:${currentLeader.email}`}
                          className="font-medium hover:underline"
                          style={{ color: '#f59f24' }}
                        >
                          {currentLeader.email}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-3 rounded-lg" style={{ background: '#fef3e2' }}>
                      <Globe className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#172d45' }} />
                      <div className="flex items-center gap-2">
                        <strong className="font-bold" style={{ color: '#172d45' }}>Nationalité:</strong>
                        <span className="font-medium text-gray-700">{currentLeader.nationality}</span>
                        <span className="text-xl">{currentLeader.flag}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-3 rounded-lg" style={{ background: '#fef3e2' }}>
                      <GraduationCap className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#172d45' }} />
                      <div className="flex items-center gap-2">
                        <strong className="font-bold" style={{ color: '#172d45' }}>Filière:</strong>
                        <span className="font-medium text-gray-700">{currentLeader.filiere}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-3 rounded-lg" style={{ background: '#fef3e2' }}>
                      <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#172d45' }} />
                      <div className="flex items-center gap-2">
                        <strong className="font-bold" style={{ color: '#172d45' }}>Campus:</strong>
                        <span className="font-medium text-gray-700">{currentLeader.campus}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-3 rounded-lg" style={{ background: '#fef3e2' }}>
                      <Calendar className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#172d45' }} />
                      <div className="flex items-center gap-2">
                        <strong className="font-bold" style={{ color: '#172d45' }}>Mandat:</strong>
                        <span className="font-medium text-gray-700">{currentLeader.mandat}</span>
                      </div>
                    </div>
                  </div>

                  <div 
                    className="p-5 rounded-xl text-white mb-5"
                    style={{ background: 'linear-gradient(135deg, #172d45 0%, #2a4f73 100%)' }}
                  >
                    <strong className="font-bold text-lg block mb-1">Mission:</strong>
                    <p className="leading-relaxed">{currentLeader.mission}</p>
                  </div>

                  {currentLeader.linkedin && (
                    <div className="flex gap-4 pt-4 border-t border-gray-200">
                      <a
                        href={currentLeader.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 hover:-translate-y-0.5"
                        style={{ background: '#fef3e2', color: '#172d45' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#0077b5';
                          e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#fef3e2';
                          e.currentTarget.style.color = '#172d45';
                        }}
                      >
                        <Linkedin className="w-5 h-5" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 mt-10">
              <button
                onClick={handlePrevLeader}
                disabled={leaders.length <= 1}
                className="w-10 h-10 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center transition-all duration-200 hover:border-orange-500 hover:bg-orange-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ color: '#172d45' }}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex gap-2">
                {leaders.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentLeaderIndex(index)}
                    className={`w-2.5 h-2.5 rounded-full border-none transition-all duration-200 ${
                      index === currentLeaderIndex ? 'scale-120' : ''
                    }`}
                    style={{ 
                      background: index === currentLeaderIndex ? '#f59f24' : '#e5e7eb'
                    }}
                  />
                ))}
              </div>

              <button
                onClick={handleNextLeader}
                disabled={leaders.length <= 1}
                className="w-10 h-10 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center transition-all duration-200 hover:border-orange-500 hover:bg-orange-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ color: '#172d45' }}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
};

export default APropos;