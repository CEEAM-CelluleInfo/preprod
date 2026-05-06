import { ChevronLeft, ChevronRight, Mail, Globe, Calendar, Linkedin, User, Star, MapPin, GraduationCap } from "lucide-react";
import { useState } from "react";
import { useLeaders } from "@/hooks/useLeaders";
import { useContent } from "@/hooks/useContent";
import { StatsService } from "@/services/statsService";
import "../../styles/apropos.css"; // CHANGÉ le CSS

const AProposSection = () => { // CHANGÉ le nom du composant
  const [currentPage, setCurrentPage] = useState(0);
  const [activeTab, setActiveTab] = useState<'mission' | 'vision' | 'valeurs'>('mission');
  const { leaders, loading: leadersLoading, error, pagination, changePage } = useLeaders(currentPage, 1);
  
  const { allContent, loading: contentLoading } = useContent();

  const stats = StatsService.calculateStats(leaders);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    changePage(page);
  };

  const formatContent = (content: string, type: string) => {
    if (!content) return null;

    if (type === 'valeurs') {
      const lines = content.split('\n').filter(line => line.trim() !== '');
      return (
        <div className="values-content">
          <ul className="values-list">
            {lines.map((line, index) => {
              const [title, ...description] = line.split(': ');
              return (
                <li key={index}>
                  <strong>{title}:</strong> {description.join(': ')}
                </li>
              );
            })}
          </ul>
        </div>
      );
    }
    
    const paragraphs = content.split('\n\n').filter(p => p.trim() !== '');
    const ContentComponent = type === 'mission' ? 'div' : 'div';
    const className = type === 'mission' ? 'mission-content' : 'vision-content';
    
    return (
      <ContentComponent className={className}>
        {paragraphs.map((paragraph, index) => (
          <p key={index}>
            <strong>{paragraph}</strong>
          </p>
        ))}
      </ContentComponent>
    );
  };

  if (leadersLoading) {
    return (
      <div className="apropos-header"> {/* CHANGÉ la classe CSS */}
        <div className="container mx-auto text-center py-20">
          <div className="animate-pulse">
            <div className="h-12 bg-white/20 rounded w-3/4 mx-auto mb-6"></div>
            <div className="h-6 bg-white/20 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="apropos-header"> {/* CHANGÉ la classe CSS */}
        <div className="container mx-auto text-center py-20">
          <div className="text-white bg-red-500/20 border border-red-500 rounded-lg p-6 inline-block">
            <p className="text-xl">{error}</p>
            <button 
              onClick={() => changePage(currentPage)}
              className="mt-4 px-6 py-2 bg-white text-navy rounded-lg font-medium"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header en bleu CENTRÉ */}
      <section className="apropos-header"> {/* CHANGÉ la classe CSS */}
        <div className="container mx-auto">
          <h1 className="apropos-header-title">À Propos de la CEEAM</h1> {/* CHANGÉ la classe CSS */}
          <p className="apropos-header-subtitle"> {/* CHANGÉ la classe CSS */}
            <strong>Communauté des Étudiants Étrangers</strong>
            <br />
            Arts & Métiers - Une famille, une vision, un avenir commun
          </p>
        </div>
      </section>

      {/* Section principale */}
      <div className="container mx-auto px-4">
        {/* Statistiques */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.laureats}</div>
            <div className="stat-label">Lauréats</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value">{stats.satisfaction}</div>
            <div className="stat-label">Taux de satisfaction</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value">{stats.events}</div>
            <div className="stat-label">Évènements par an</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value">{stats.pays}</div>
            <div className="stat-label">Pays</div>
          </div>
        </div>

        {/* Section Mission/Vision/Valeurs */}
        <section className="mission-section">
          <div className="mission-tabs">
            <button 
              className={`mission-tab ${activeTab === 'mission' ? 'active' : ''}`}
              onClick={() => setActiveTab('mission')}
            >
              Notre Mission
            </button>
            <button 
              className={`mission-tab ${activeTab === 'vision' ? 'active' : ''}`}
              onClick={() => setActiveTab('vision')}
            >
              Notre Vision
            </button>
            <button 
              className={`mission-tab ${activeTab === 'valeurs' ? 'active' : ''}`}
              onClick={() => setActiveTab('valeurs')}
            >
              <Star size={16} className="star" /> Nos Valeurs
            </button>
          </div>

          {contentLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          ) : allContent && allContent[activeTab] ? (
            <>
              <h2 className="mission-title">{allContent[activeTab].title}</h2>
              {formatContent(allContent[activeTab].content, activeTab)}
            </>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <p>Contenu en cours de chargement...</p>
              <p className="text-sm mt-2">L'admin peut modifier ce texte via le backoffice Django.</p>
            </div>
          )}
        </section>

        {/* Section Leaders */}
        <section className="leaders-section">
          <div className="leaders-header">
            <h2 className="leaders-title">Historique des Top 6 récents SG</h2>
            <p className="leaders-subtitle">
              Les têtes qui, avec leurs différentes équipes dévouées, ont fait vivre la CEEAM ces dernières années !
            </p>
          </div>

          {/* SG avec TOUTES les infos à côté de l'image */}
          <div className="single-sg-container">
            {leaders.map((leader) => (
              <div key={leader.id} className="sg-full-card">
                {/* Image rectangulaire à gauche */}
                <div className="sg-image-side">
                  {leader.imageUrl ? (
                    <img 
                      src={leader.imageUrl} 
                      alt={`${leader.prenom} ${leader.nom}`}
                      className="sg-img"
                    />
                  ) : (
                    <div className="sg-img-placeholder">
                      <span className="sg-img-initials">
                        {leader.prenom.charAt(0)}{leader.nom.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* TOUTES les infos à droite - MÊME HAUTEUR */}
                <div className="sg-all-info-side">
                  {/* Nom et position */}
                  <div className="sg-top-info">
                    <div className="sg-nom">{leader.nom}</div>
                    <div className="sg-prenom">{leader.prenom}</div>
                    <div className="sg-position">{leader.bureau}</div>
                    <div className="sg-executive"><strong>Bureau Executif:</strong> {leader.annee}</div>
                  </div>
                  
                  {/* Contact et détails */}
                  <div className="sg-contact-info">
                    <div className="sg-info-line">
                      <Mail size={16} />
                      <div className="sg-label-value">
                        <strong>Email:</strong> 
                        <a href={`mailto:${leader.email}`} className="sg-email">
                          {leader.email}
                        </a>
                      </div>
                    </div>
                    
                    <div className="sg-info-line">
                      <Globe size={16} />
                      <div className="sg-label-value">
                        <strong>Nationalité:</strong>
                        <span className="sg-nationality">
                          {leader.nationalite} <span className="sg-flag">{leader.paysCode}</span>
                        </span>
                      </div>
                    </div>
                    
                    {leader.linkedin && leader.linkedin !== '#' && (
                      <div className="sg-info-line">
                        <Linkedin size={16} />
                        <div className="sg-label-value">
                          <strong>LinkedIn:</strong>
                          <a 
                            href={leader.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="sg-linkedin-btn"
                          >
                            Voir le profil
                          </a>
                        </div>
                      </div>
                    )}
                    
                    {leader.filiere && (
                      <div className="sg-info-line">
                        <GraduationCap size={16} />
                        <div className="sg-label-value">
                          <strong>Filière:</strong>
                          <span className="sg-detail">{leader.filiere}</span>
                        </div>
                      </div>
                    )}
                    
                    {leader.campus && (
                      <div className="sg-info-line">
                        <MapPin size={16} />
                        <div className="sg-label-value">
                          <strong>Campus:</strong>
                          <span className="sg-detail">{leader.campus}</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="sg-info-line">
                      <Calendar size={16} />
                      <div className="sg-label-value">
                        <strong>Mandat:</strong>
                        <span className="sg-detail">{leader.annee}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Mission */}
                  <div className="sg-mission-box">
                    <p><strong>Notre mission</strong> est de créer une famille loin de chez soi.</p>
                  </div>
                  
                  {/* Icônes sociales */}
                  <div className="sg-icons-row">
                    <a href={`mailto:${leader.email}`} className="sg-icon-link" title="Envoyer un email">
                      <Mail size={18} />
                    </a>
                    
                    {leader.linkedin && leader.linkedin !== '#' && (
                      <a href={leader.linkedin} target="_blank" rel="noopener noreferrer" className="sg-icon-link linkedin" title="Profil LinkedIn">
                        <Linkedin size={18} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
                className="pagination-btn"
                aria-label="Page précédente"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="pagination-dots">
                {Array.from({ length: pagination.totalPages }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handlePageChange(index)}
                    className={`pagination-dot ${index === currentPage ? 'active' : ''}`}
                    aria-label={`Aller à la page ${index + 1}`}
                  />
                ))}
              </div>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.totalPages - 1}
                className="pagination-btn"
                aria-label="Page suivante"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AProposSection