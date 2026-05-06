import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/layout/HeaderConnected';
import Footer from '../../components/layout/Footer';
import { useUserProfile } from '../../hooks/useUserProfile';
import { AuthService } from '../../services/authService';

const ViewProfilUser: React.FC = () => {
  const { profile, isLoading, error } = useUserProfile();
  const currentUser = AuthService.getCurrentUser();

  const getEditProfilePath = () => {
    if (currentUser?.role === 'laureat') return '/laureats/edit-profile';
    return '/edit-profile';
  };

  const [activeTab, setActiveTab] = useState<'apropos' | 'historique' | 'competences'>('apropos');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            <span className="ml-3 text-gray-600">Chargement du profil...</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
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
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Titre */}
        <div className="bg-[#172d45] rounded-xl p-6 mb-8 shadow-lg">
          <h1 className="text-3xl font-bold text-white mb-2">Votre Profil</h1>
          <p className="text-white/80">Votre profil que vous pouvez modifier</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          {/* Avatar + nom */}
          <div className="mb-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    className="w-16 h-16 rounded-full object-cover shadow-md"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold shadow-md">
                    {profile.initials}
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
                <div className="flex items-center gap-4 mt-2">
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                    {profile.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Rectangle principal */}
          <div className="bg-gradient-to-r from-blue-50 to-gray-50 border border-blue-100 rounded-xl p-8 mb-8 shadow-md">
            {/* 4 infos */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="flex flex-col">
                  <div className="text-lg font-semibold text-gray-700 mb-1">Promotion</div>
                  <div className="text-2xl font-bold text-gray-900">{profile.promotion || '—'}</div>
                </div>
                <div className="flex flex-col">
                  <div className="text-lg font-semibold text-gray-700 mb-1">Filière</div>
                  <div className="text-lg font-medium text-gray-900">{profile.filiere || '—'}</div>
                </div>
                <div className="flex flex-col">
                  <div className="text-lg font-semibold text-gray-700 mb-1">Pays</div>
                  <div className="text-lg font-medium text-gray-900">
                    {profile.countryFlag} {profile.country || '—'}
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="text-lg font-semibold text-gray-700 mb-1">Membre depuis</div>
                  <div className="text-lg font-medium text-gray-900">{profile.memberSince || '—'}</div>
                </div>
              </div>
            </div>

            {/* Bouton modifier */}
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to={getEditProfilePath()}>
                <button className="px-6 py-3 font-medium rounded-lg transition bg-white text-gray-800 border border-gray-300 hover:bg-gray-50 hover:shadow-sm">
                  Modifier le profil
                </button>
              </Link>
            </div>
          </div>

          {/* Onglets */}
          <div className="mb-8">
            <div className="flex space-x-4 mb-6 justify-center">
              {(['apropos', 'historique', 'competences'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2.5 font-medium rounded-lg transition ${
                    activeTab === tab
                      ? 'bg-orange-500 text-white hover:bg-orange-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tab === 'apropos' ? 'À propos' : tab === 'historique' ? 'Historique' : 'Compétences'}
                </button>
              ))}
            </div>

            {/* Onglet À propos */}
            {activeTab === 'apropos' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Informations personnelles */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Informations personnelles</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-sm font-medium text-gray-500">Email</span>
                      <span className="font-medium text-gray-900">{profile.email || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-sm font-medium text-gray-500">Téléphone</span>
                      <span className="font-medium text-gray-900">{profile.phone || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-sm font-medium text-gray-500">Nationalité</span>
                      <span className="font-medium text-gray-900">
                        {profile.countryFlag} {profile.nationality || '—'}
                      </span>
                    </div>
                    {/* ✅ WhatsApp remplace langue préférée */}
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-500">WhatsApp</span>
                      {profile.whatsapp ? (
                          <a
                            href={`https://wa.me/${profile.whatsapp.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-green-600 hover:underline"
                          >
                            {profile.whatsapp}
                          </a>
                        ) : (
                        <span className="text-gray-400">Non renseigné</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Informations académiques */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Informations académiques</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-sm font-medium text-gray-500">Promotion</span>
                      <span className="font-medium text-gray-900">{profile.academicInfo.promotion || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-sm font-medium text-gray-500">Filière</span>
                      <span className="font-medium text-gray-900">{profile.academicInfo.filiere || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-500">LinkedIn</span>
                      {profile.academicInfo.linkedin ? (
                        <a
                          href={
                            profile.academicInfo.linkedin.startsWith('http')
                              ? profile.academicInfo.linkedin
                              : `https://${profile.academicInfo.linkedin}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {profile.academicInfo.linkedin}
                        </a>
                      ) : (
                        <span className="text-gray-400">Non renseigné</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ✅ Onglet Historique — données réelles, plus de mock */}
            {activeTab === 'historique' && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-6">
                  Historique académique et professionnel
                </h3>
                {profile.historique.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">Aucun historique renseigné.</p>
                ) : (
                  <div className="space-y-6">
                    {profile.historique.map((item, index) => (
                      <div
                        key={item.id ?? index}
                        className="flex items-start border-l-4 border-orange-500 pl-4 py-2"
                      >
                        <div className="w-24 flex-shrink-0">
                          <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm font-medium rounded-full">
                            {item.startDate?.slice(0, 4)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <p className="font-medium text-gray-900">{item.title}</p>
                          {item.organization && (
                            <p className="text-sm text-gray-600 mt-0.5">{item.organization}</p>
                          )}
                          {item.description && (
                            <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ✅ Onglet Compétences — données réelles, plus de mock */}
            {activeTab === 'competences' && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Mes compétences</h3>
                {profile.competences.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">Aucune compétence renseignée.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {profile.competences.map((group) => (
                      <div key={group.categoryId} className="bg-white rounded-lg p-4 shadow-sm">
                        <h4 className="font-bold text-gray-800 mb-3">{group.categorie}</h4>
                        <ul className="space-y-2">
                          {group.competences.map((comp, idx) => (
                            <li key={comp.id ?? idx} className="flex items-center">
                              <span className="w-2 h-2 bg-orange-500 rounded-full mr-3" />
                              <span className="text-gray-700">{comp.name}</span>
                              {comp.levelDisplay && (
                                <span className="ml-auto text-xs text-gray-400">
                                  {comp.levelDisplay}
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

export default ViewProfilUser;