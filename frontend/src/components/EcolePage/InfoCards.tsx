import React from 'react';

interface InfoCardProps {
  title: string;
  description: string;
  pdfFileName: string; // Nom du fichier PDF à télécharger
  pdfDisplayName: string; // Nom affiché pour le téléchargement
}

const InfoCard: React.FC<InfoCardProps> = ({ 
  title, 
  description, 
  pdfFileName,
  pdfDisplayName
}) => {

  const handleLearnMoreClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Chemin vers le PDF dans le dossier public
    const pdfPath = `/pdf/${pdfFileName}`;
    
    // Créer un lien invisible pour le téléchargement
    const link = document.createElement('a');
    link.href = pdfPath;
    link.download = pdfDisplayName; // Nom du fichier téléchargé
    link.target = '_blank'; // Ouvrir dans un nouvel onglet
    
    // Simuler un clic sur le lien
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Optionnel : Ajouter un feedback visuel
    console.log(`Téléchargement du PDF : ${pdfDisplayName}`);
  };

  return (
    <div className="info-card info-card--navy">
      <h3 className="info-card__title">{title}</h3>
      <p className="info-card__desc">{description}</p>
      <button 
        onClick={handleLearnMoreClick}
        className="info-card__link"
        type="button"
      >
        Télécharger le PDF
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
      </button>
    </div>
  );
};

export const InfoCards: React.FC = () => {

  const cards = [
    {
      title: 'Inscription',
      description: 'Procédures administratives et pédagogiques pour les nouveaux étudiants.',
      pdfFileName: 'TD1-Systèmes de production-2023-2024 (1).pdf',
      pdfDisplayName: 'Guide_Inscription_ENSAM.pdf',
    },
    {
      title: 'Logement',
      description: 'Résidences universitaires et alternatives de logement à proximité.',
      pdfFileName: 'TD1-Systèmes de production-2023-2024.pdf',
      pdfDisplayName: 'Guide_Logement_ENSAM.pdf',
    },
    {
      title: 'Transport',
      description: 'Accès et déplacements autour du campus.',
      pdfFileName: 'TD2 POO EN JAVA.pdf',
      pdfDisplayName: 'Guide_Transport_ENSAM.pdf',
    },
    {
      title: 'Bibliothèque',
      description: 'Ressources documentaires et horaires d\'ouverture.',
      pdfFileName: 'TD3  BIBLIOTHEQUE EN LIGNE.pdf',
      pdfDisplayName: 'Guide_Bibliotheque_ENSAM.pdf',
    },
    {
      title: 'Restauration',
      description: 'Options de restauration sur le campus et aux alentours.',
      pdfFileName: 'TD8.pdf',
      pdfDisplayName: 'Guide_Restauration_ENSAM.pdf',
    },
    {
      title: 'Santé',
      description: 'Services médicaux et infrastructures sanitaires.',
      pdfFileName: 'TDM-HTML-CSS-1.pdf',
      pdfDisplayName: 'Guide_Sante_ENSAM.pdf',
    },
  ];

  // Fonction pour télécharger le Guide du CEEAMien
  const handleGuideButtonClick = () => {
    // Chemin vers le PDF dans le dossier public
    const pdfPath = '/pdf/questions_machine_learning.pdf';
    
    // Créer un lien invisible pour le téléchargement
    const link = document.createElement('a');
    link.href = pdfPath;
    link.download = 'Guide_du_CEEAMien.pdf';
    link.target = '_blank';
    
    // Simuler un clic sur le lien
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className="info-pratiques" aria-label="Informations pratiques">
      <h2 className="section-title">Informations Pratiques</h2>
      <p className="section-title__sub">Cliquez sur une carte pour télécharger le PDF correspondant</p>

      <div className="info-cards">
        {cards.map((card, index) => (
          <InfoCard 
            key={index} 
            {...card}
          />
        ))}
      </div>

      {/* Guide button - Télécharge le Guide du CEEAMien */}
      <div className="guide-btn-wrapper">
        <button 
          className="guide-btn" 
          type="button"
          onClick={handleGuideButtonClick}
        >
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Télécharger le Guide du CEEAMien
        </button>
        
        {/* Optionnel : Petit texte informatif */}
        <p style={{ 
          marginTop: '10px', 
          fontSize: '0.8rem', 
          color: 'var(--color-grey-500)',
          textAlign: 'center'
        }}>
          Tous les documents sont au format PDF - ENSAM Meknès
        </p>
      </div>
    </section>
  );
};