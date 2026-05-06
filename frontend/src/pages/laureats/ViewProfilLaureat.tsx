// frontend/src/pages/laureats/ViewProfilLaureat.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import HeaderConnected from '../../components/layout/HeaderConnected';
import Footer from '../../components/layout/Footer';
import { useLaureatProfile } from '../../hooks/useLaureatProfile';
import { HISTORIQUE_TYPE_LABELS, COMPETENCE_LEVEL_LABELS, HistoriqueEntryType, CompetenceLevel } from '../../types/laureats-connected';

const ViewProfilLaureat: React.FC = () => {
  // Hook pour charger le profil depuis l'API
  const { profile, isLoading, error, toggleMentoring } = useLaureatProfile();
  
  // États pour les boutons actifs
  const [activeButton, setActiveButton] = useState<'modifier' | null>(null);
  const [activeTab, setActiveTab] = useState<'apropos' | 'historique' | 'competences'>('apropos');

  // Données pour l'historique (depuis le profil API - nouveau format relationnel)
  const historiqueData = profile?.historique || [];

  // Données pour les compétences (depuis le profil API - nouveau format relationnel)
  const competencesData = profile?.competences || [];

  // Handler pour toggle mentorat
  const handleToggleMentoring = async () => {
    if (profile) {
      await toggleMentoring(!profile.mentorship.isAvailable);
    }
  };

  // Affichage du chargement
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderConnected />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Chargement du profil...</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Affichage de l'erreur
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderConnected />
        <main className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600">{error || 'Impossible de charger le profil'}</p>
            <Link to="/connexion" className="mt-4 inline-block text-blue-600 hover:underline">
              Se connecter
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderConnected />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Titre principal dans un rectangle bleu foncé */}
        <div className="bg-[#172d45] rounded-xl p-6 mb-8 shadow-lg">
          <h1 className="text-3xl font-bold text-white mb-2">
            Votre Profil
          </h1>
          <p className="text-white/80">
            Votre profil que vous pouvez modifier
          </p>
        </div>

        {/* Section profil principal */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          
          {/* ===== UN SEUL RECTANGLE BLEU CLAIR ===== */}
          <div className="bg-blue-100/70 rounded-xl p-8 mb-6 shadow-md border-2 border-blue-300">
            
            {/* 1. Identité avec photo de profil */}
            <div className="flex items-start gap-4 mb-6">
              {/* Photo de profil avec initiales */}
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-blue-800 flex items-center justify-center text-white text-xl font-bold shadow-md border-2 border-white overflow-hidden">
                  {profile.avatarUrl ? (
                    <img 
                      src={profile.avatarUrl} 
                      alt={profile.fullName} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    profile.initials
                  )}
                </div>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{profile.fullName}</h2>
                <div className="flex items-center gap-4 mt-2">
                  <span className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-full">
                    {profile.role}
                  </span>
                  <span className="px-3 py-1 bg-green-600 text-white text-sm font-medium rounded-full">
                    {profile.status}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Rectangle intérieur blanc pour les infos (sans campus) */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Promotion */}
                <div className="flex flex-col">
                  <div className="text-lg font-semibold text-gray-700 mb-1">Promotion</div>
                  <div className="text-2xl font-bold text-gray-900">{profile.promotion}</div>
                </div>
                
                {/* Filière */}
                <div className="flex flex-col">
                  <div className="text-lg font-semibold text-gray-700 mb-1">Filière</div>
                  <div className="text-lg font-medium text-gray-900">{profile.field}</div>
                </div>
                
                {/* Campus - SUPPRIMÉ */}
                
                {/* Membre depuis */}
                <div className="flex flex-col">
                  <div className="text-lg font-semibold text-gray-700 mb-1">Membre depuis</div>
                  <div className="text-lg font-medium text-gray-900">{profile.memberSince}</div>
                </div>
              </div>
            </div>

            {/* 3. Bio */}
            <div className="mb-2">
              <p className="text-gray-700 italic border-l-4 border-blue-600 pl-4 py-2 text-base">
                "{profile.quote || profile.bio}"
              </p>
            </div>
          </div>
          {/* ===== FIN DU RECTANGLE BLEU CLAIR ===== */}

          {/* ===== SECTION STATISTIQUES COMMENTÉE =====
          <div className="mb-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 text-center hover:shadow-md transition-shadow">
                <p className="text-3xl font-bold text-yellow-700">{profile.stats.activities}</p>
                <p className="text-gray-600">Activités</p>
              </div>
              
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 text-center hover:shadow-md transition-shadow">
                <p className="text-3xl font-bold text-yellow-700">{profile.stats.votes}</p>
                <p className="text-gray-600">Votes</p>
              </div>
              
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 text-center hover:shadow-md transition-shadow">
                <p className="text-3xl font-bold text-yellow-700">{profile.stats.connections}</p>
                <p className="text-gray-600">Connexions</p>
              </div>
              
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 text-center hover:shadow-md transition-shadow">
                <p className="text-3xl font-bold text-yellow-700">{profile.stats.contributions}</p>
                <p className="text-gray-600">Contributions</p>
              </div>
            </div>
          </div>
          ===== FIN SECTION STATISTIQUES COMMENTÉE ===== */}

          {/* ===== RECTANGLE JAUNE-ORANGE FONCÉ POUR LES BOUTONS ===== */}
          <div className="bg-gradient-to-r from-amber-100 to-orange-100 border-2 border-amber-400 rounded-xl p-6 mb-8 shadow-lg">
            <div className="flex flex-wrap gap-4 justify-center">
              {/* MODIFIER LE PROFIL - LIEN VERS EditProfileLaureat.tsx */}
              <Link to="/laureats/edit-profile">
                <button 
                  onClick={() => setActiveButton('modifier')}
                  className={`px-6 py-3 font-medium rounded-lg transition ${
                    activeButton === 'modifier' 
                      ? 'bg-orange-600 text-white hover:bg-orange-700 shadow-md' 
                      : 'bg-white text-gray-800 border-2 border-gray-300 hover:bg-gray-100 hover:shadow-md'
                  }`}
                >
                  Modifier le profil
                </button>
              </Link>
              
            </div>
          </div>
          {/* ===== FIN DU RECTANGLE JAUNE-ORANGE ===== */}

          {/* 5. Mentorat */}
          <div className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Mentorat</h3>
              
              {/* Toggle Switch */}
              <button
                type="button"
                onClick={handleToggleMentoring}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  profile.mentorship.isAvailable ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md flex items-center justify-center transition-transform ${
                    profile.mentorship.isAvailable ? 'translate-x-7' : 'translate-x-1'
                  }`}
                >
                  <i className={`fas fa-bell text-xs ${
                    profile.mentorship.isAvailable ? 'text-green-600' : 'text-gray-500'
                  }`}></i>
                </span>
              </button>
            </div>
            
            <p className="text-gray-700 mb-4 pl-2 text-lg font-medium">
              {profile.mentorship.message}
            </p>
            
            {profile.mentorship.isAvailable && (
              <div className="flex items-center gap-2 pl-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <span className="text-sm font-medium text-green-700">Disponible pour mentorat</span>
              </div>
            )}
            
            {!profile.mentorship.isAvailable && (
              <div className="flex items-center gap-2 pl-2">
                <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
                <span className="text-sm font-medium text-gray-600">Non disponible pour mentorat</span>
              </div>
            )}
          </div>

          {/* 6. Expérience professionnelle */}
          <div className="mb-8 bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-300 rounded-xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-4">{profile.experience.title}</h3>
            <p className="text-orange-600 font-medium mb-6">{profile.experience.company} • {profile.experience.location}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Entreprise */}
              <div className="bg-white rounded-lg p-4 border border-orange-200 shadow-sm">
                <p className="text-sm font-semibold text-gray-500 mb-1">Entreprise</p>
                <p className="text-gray-900 font-medium">{profile.experience.company}</p>
              </div>
              
              {/* Localisation */}
              <div className="bg-white rounded-lg p-4 border border-orange-200 shadow-sm">
                <p className="text-sm font-semibold text-gray-500 mb-1">Localisation</p>
                <p className="text-gray-900 font-medium">{profile.experience.location}</p>
              </div>
              
              {/* Email Professionnel */}
              <div className="bg-white rounded-lg p-4 border border-orange-200 shadow-sm">
                <p className="text-sm font-semibold text-gray-500 mb-1">Email Professionnel</p>
                <p className="text-gray-900 font-medium">{profile.experience.professionalEmail}</p>
              </div>
              
              {/* Domaine d'expérience */}
              <div className="bg-white rounded-lg p-4 border border-orange-200 shadow-sm">
                <p className="text-sm font-semibold text-gray-500 mb-1">Domaine d'expérience</p>
                <p className="text-gray-900 font-medium">{profile.experience.domain}</p>
              </div>
            </div>
          </div>

          {/* 7. Onglets À propos/Historique/Compétences */}
          <div className="mb-8">
            <div className="flex space-x-4 mb-6 justify-center">
              <button 
                onClick={() => setActiveTab('apropos')}
                className={`px-5 py-2.5 font-medium rounded-lg transition ${
                  activeTab === 'apropos' 
                    ? 'bg-orange-600 text-white hover:bg-orange-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                À propos
              </button>
              
              <button 
                onClick={() => setActiveTab('historique')}
                className={`px-5 py-2.5 font-medium rounded-lg transition ${
                  activeTab === 'historique' 
                    ? 'bg-orange-600 text-white hover:bg-orange-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Historique
              </button>
              
              <button 
                onClick={() => setActiveTab('competences')}
                className={`px-5 py-2.5 font-medium rounded-lg transition ${
                  activeTab === 'competences' 
                    ? 'bg-orange-600 text-white hover:bg-orange-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Compétences
              </button>
            </div>

            {/* Contenu des onglets */}
            {activeTab === 'apropos' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Informations personnelles - RECTANGLE ORANGE */}
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-300 rounded-xl p-6 shadow-md">
                  <h3 className="text-xl font-bold text-orange-800 mb-4">Informations personnelles</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-orange-200 pb-2">
                      <span className="text-sm font-semibold text-gray-600">Email</span>
                      <span className="font-medium text-gray-900">{profile.personalInfo.email}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-orange-200 pb-2">
                      <span className="text-sm font-semibold text-gray-600">Téléphone</span>
                      <span className="font-medium text-gray-900">{profile.personalInfo.phone}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-orange-200 pb-2">
                      <span className="text-sm font-semibold text-gray-600">WhatsApp</span>
                      <span className="font-medium text-gray-900 flex items-center gap-2">{profile.personalInfo.whatsapp}</span>
                    </div>
                    <div className="flex justify-between items-center ">
                      <span className="text-sm font-semibold text-gray-600">Nationalité</span>
                      <span className="font-medium text-gray-900 flex items-center gap-2">
                        {profile.personalInfo.nationality}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Informations académiques - RECTANGLE ORANGE (sans campus) */}
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-300 rounded-xl p-6 shadow-md">
                  <h3 className="text-xl font-bold text-orange-800 mb-4">Informations académiques</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-orange-200 pb-2">
                      <span className="text-sm font-semibold text-gray-600">Promotion</span>
                      <span className="font-medium text-gray-900">{profile.academicInfo.promotion}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-orange-200 pb-2">
                      <span className="text-sm font-semibold text-gray-600">Filière</span>
                      <span className="font-medium text-gray-900">{profile.academicInfo.field}</span>
                    </div>
                    {/* Campus - SUPPRIMÉ */}
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-600">LinkedIn</span>
                      <a 
                        href={`https://${profile.academicInfo.linkedin}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {profile.academicInfo.linkedin}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'historique' && (
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-400 rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-orange-700 mb-6">Historique académique et professionnel</h3>
                {historiqueData.length === 0 ? (
                  <p className="text-gray-500 text-center py-8 italic">Aucun historique enregistré</p>
                ) : (
                  <div className="space-y-6">
                    {historiqueData.map((item, index) => (
                      <div key={item.id || index} className="flex items-start border-l-4 border-orange-500 pl-4 py-2">
                        <div className="flex-shrink-0 flex flex-col items-center gap-1">
                          <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full border border-orange-300">
                            {HISTORIQUE_TYPE_LABELS[item.entryType as HistoriqueEntryType] || item.entryType}
                          </span>
                          <span className="text-xs text-gray-500">
                            {item.startDate}{item.isCurrent ? ' - Présent' : item.endDate ? ` - ${item.endDate}` : ''}
                          </span>
                        </div>
                        <div className="ml-4">
                          <p className="font-bold text-gray-800">{item.title}</p>
                          {item.organization && (
                            <p className="text-sm text-gray-600">{item.organization}{item.location ? `, ${item.location}` : ''}</p>
                          )}
                          {item.description && (
                            <p className="text-sm text-gray-500 mt-1 italic">{item.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'competences' && (
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-400 rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-orange-700 mb-6">Mes compétences</h3>
                {competencesData.length === 0 ? (
                  <p className="text-gray-500 text-center py-8 italic">Aucune compétence enregistrée</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {competencesData.map((categorie) => (
                      <div key={categorie.categoryId} className="bg-white rounded-lg p-5 shadow-md border-2 border-orange-300 hover:shadow-lg transition-shadow">
                        <h4 className="font-bold text-orange-700 mb-3 text-lg border-b border-orange-200 pb-2 flex items-center gap-2">
                          {categorie.icon && <i className={`fas ${categorie.icon}`}></i>}
                          {categorie.categorie}
                        </h4>
                        <ul className="space-y-2">
                          {categorie.competences.map((competence) => (
                            <li key={competence.id} className="flex items-center justify-between">
                              <div className="flex items-center">
                                <span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>
                                <span className="text-gray-700 font-medium">{competence.name}</span>
                              </div>
                              {competence.level && (
                                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                                  {COMPETENCE_LEVEL_LABELS[competence.level as CompetenceLevel] || competence.level}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ViewProfilLaureat;