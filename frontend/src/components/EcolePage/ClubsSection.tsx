import React, { useState } from 'react';

interface ClubCardProps {
  name: string;
  interest: string;
  logo?: string;
}

const ClubCard: React.FC<ClubCardProps> = ({ 
  name, 
  interest, 
  logo = <img src="/log.jpeg" alt="Logo du club" className="h-full w-full object-contain" />
}) => {
  return (
    <div className="club-card">
      <div className="club-card__header">
        <div className="club-card__logo">{logo}</div>
        <span className="club-card__name">{name}</span>
      </div>
      <p className="club-card__interest">{interest}</p>
    </div>
  );
};

export const ClubsSection: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(0);

  // Toutes les données des clubs - vous pouvez en ajouter autant que vous voulez
  const allClubs = [
    // Page 1
    { name: 'Club Robotique', interest: 'Technologie et Innovation' },
    { name: 'Club Photo', interest: 'Photographie Artistique' },
    { name: 'Club Débat', interest: 'Éloquence et Argumentation' },
    { name: 'Club Théâtre', interest: 'Arts Dramatiques' },
    
    // Page 2
    { name: 'Club Sport', interest: 'Football et Basketball' },
    { name: 'Club Musique', interest: 'Orchestre et Instruments' },
    { name: 'Club Échecs', interest: 'Stratégie et Réflexion' },
    { name: 'Club Cuisine', interest: 'Gastronomie du Monde' },
    
    // Page 3
    { name: 'Club Environnement', interest: 'Développement Durable' },
    { name: 'Club Entrepreneuriat', interest: 'Startup et Business' },
    { name: 'Club Cinéma', interest: 'Septième Art' },
    { name: 'Club Lecture', interest: 'Littérature et Poésie' },
    
    // Page 4
    { name: 'Club Danse', interest: 'Hip-hop et Contemporain' },
    { name: 'Club Bénévolat', interest: 'Action Sociale' },
    { name: 'Club Gaming', interest: 'E-sports et Jeux Vidéo' },
    { name: 'Club Arts Martiaux', interest: 'Karaté et Taekwondo' },
    
    // Page 5
    { name: 'Club Codage', interest: 'Programmation et IA' },
    { name: 'Club Voyages', interest: 'Découverte du Monde' },
    { name: 'Club Sciences', interest: 'Expériences et Recherche' },
    { name: 'Club Langues', interest: 'Multilinguisme et Culture' },
  ];

  // Nombre de clubs par page
  const clubsPerPage = 4;
  
  // Calculer le nombre total de pages
  const totalPages = Math.ceil(allClubs.length / clubsPerPage);
  
  // Obtenir les clubs de la page actuelle
  const getCurrentPageClubs = () => {
    const startIndex = currentPage * clubsPerPage;
    const endIndex = startIndex + clubsPerPage;
    return allClubs.slice(startIndex, endIndex);
  };

  // Fonction pour changer de page
  const goToPage = (pageIndex: number) => {
    setCurrentPage(pageIndex);
  };

  // Navigation précédent/suivant
  const goToPrevious = () => {
    setCurrentPage((prev) => (prev > 0 ? prev - 1 : totalPages - 1));
  };

  const goToNext = () => {
    setCurrentPage((prev) => (prev < totalPages - 1 ? prev + 1 : 0));
  };

  return (
    <section className="clubs-section" aria-label="Clubs de l'école">
      <h2 className="section-title">Les Clubs de l'école</h2>

      {/* Clubs grid */}
      <div className="clubs-grid">
        {getCurrentPageClubs().map((club, index) => (
          <ClubCard key={`${currentPage}-${index}`} {...club} />
        ))}
      </div>

      {/* Pagination controls */}
      <div className="pagination-controls">
        {/* Bouton précédent */}
        <button 
          className="pagination-arrow pagination-arrow--prev" 
          onClick={goToPrevious}
          aria-label="Page précédente"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>

        {/* Pagination dots */}
        <div className="pagination-dots">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              className={`pagination-dot ${index === currentPage ? 'active' : ''}`}
              onClick={() => goToPage(index)}
              aria-label={`Page ${index + 1}`}
              aria-current={index === currentPage ? 'page' : undefined}
            />
          ))}
        </div>

        {/* Bouton suivant */}
        <button 
          className="pagination-arrow pagination-arrow--next" 
          onClick={goToNext}
          aria-label="Page suivante"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>

      {/* Indicateur de page */}
      <div className="page-indicator">
        Page {currentPage + 1} sur {totalPages}
      </div>
    </section>
  );
};