import React, { useState, useEffect } from 'react';
import { DateItem, getDefaultDates } from '@/types/dates';

export const DatesSection: React.FC = () => {
  const [dates, setDates] = useState<DateItem[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [academicYear, setAcademicYear] = useState('');
  const [feedbackCard, setFeedbackCard] = useState<{
    type: 'success' | 'error';
    title: string;
    message: string;
  } | null>(null);

  // Vérifier l'authentification et charger les dates
  useEffect(() => {
    loadDates();
    checkAdminStatus();
  }, []);

  // Vérifier si l'utilisateur est admin via le backend
  const checkAdminStatus = async () => {
    try {
      // Récupérer le token d'authentification
      const token = localStorage.getItem('admin_token');
      const userEmail = localStorage.getItem('admin_email');
      
      if (!token || !userEmail) {
        setIsAdmin(false);
        return;
      }
      
      // Vérifier avec le backend
      const response = await fetch('/api/admin/verify', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsAdmin(data.isAdmin === true);
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Erreur vérification admin:', error);
      setIsAdmin(false);
    }
  };

  // Charger les dates depuis le backend
  const loadDates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/dates');
      
      if (response.ok) {
        const data = await response.json();
        setDates(data.dates);
        setAcademicYear(data.academicYear);
      } else {
        // Fallback aux dates par défaut
        const defaultDates = getDefaultDates();
        setDates(defaultDates);
        
        // Déterminer l'année académique
        const currentYear = new Date().getFullYear();
        const nextYear = currentYear + 1;
        setAcademicYear(`${currentYear}-${nextYear}`);
      }
    } catch (error) {
      console.error('Erreur chargement dates:', error);
      // Fallback aux dates par défaut
      const defaultDates = getDefaultDates();
      setDates(defaultDates);
      
      const currentYear = new Date().getFullYear();
      const nextYear = currentYear + 1;
      setAcademicYear(`${currentYear}-${nextYear}`);
    } finally {
      setLoading(false);
    }
  };

  // Sauvegarder les dates (admin seulement)
  const saveDates = async (updatedDates: DateItem[]) => {
    if (!isAdmin) {
      console.warn('Tentative de sauvegarde non autorisée');
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      
      const response = await fetch('/api/dates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          dates: updatedDates,
          academicYear 
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setDates(data.dates);
        setFeedbackCard({
          type: 'success',
          title: 'Calendrier mis à jour',
          message: 'Les dates académiques ont été mises à jour avec succès.',
        });
      } else {
        throw new Error('Échec de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      setFeedbackCard({
        type: 'error',
        title: 'Échec de la sauvegarde',
        message: 'Erreur lors de la sauvegarde des dates.',
      });
    }
  };

  // Exporter en iCal (accessible à tous)
  const exportToICal = () => {
    const icalContent = generateICalContent(dates);
    const blob = new Blob([icalContent], { type: 'text/calendar' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `calendrier-ensam-${academicYear}.ics`;
    link.click();
  };

  const generateICalContent = (dates: DateItem[]) => {
    let ical = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//ENSAM Meknès//Calendrier Académique//FR
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Calendrier ENSAM ${academicYear}
X-WR-CALDESC:Calendrier académique ENSAM Meknès\n`;

    dates.forEach((date, index) => {
      if (date.value && date.value !== '──') {
        const eventId = `${date.id}_${index}`;
        
        ical += `BEGIN:VEVENT
UID:${eventId}@ensam.ma
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:${date.label.replace(':', '')}
DESCRIPTION:Semestre ${date.semester} - Année ${academicYear}
LOCATION:ENSAM Meknès
STATUS:CONFIRMED
END:VEVENT\n`;
      }
    });

    ical += 'END:VCALENDAR';
    return ical;
  };

  // Gestion de l'édition (admin seulement)
  const handleEdit = (id: string, currentValue: string) => {
    if (!isAdmin) return;
    setEditingId(id);
    setEditValue(currentValue);
  };

  const handleSave = (id: string) => {
    if (!isAdmin) return;
    const updatedDates = dates.map(date =>
      date.id === id ? { ...date, value: editValue } : date
    );
    saveDates(updatedDates);
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const datesA = dates.filter(date => date.semester === 'A');
  const datesB = dates.filter(date => date.semester === 'B');

  if (loading) {
    return (
      <section className="dates-section" aria-label="Dates utiles">
        <h2 className="section-title">Les dates Utiles</h2>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="loading-spinner"></div>
          <p style={{ marginTop: '10px', opacity: 0.7 }}>Chargement du calendrier...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="dates-section" aria-label="Dates utiles">
      <h2 className="section-title">Les dates Utiles</h2>

      {feedbackCard && (
        <div
          style={{
            marginBottom: '16px',
            padding: '14px 16px',
            borderRadius: '14px',
            border: feedbackCard.type === 'success' ? '1px solid #a7f3d0' : '1px solid #fecaca',
            background: feedbackCard.type === 'success' ? '#ecfdf5' : '#fef2f2',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start',
          }}
        >
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 700, color: feedbackCard.type === 'success' ? '#065f46' : '#991b1b' }}>
              {feedbackCard.title}
            </p>
            <p style={{ margin: '4px 0 0', color: feedbackCard.type === 'success' ? '#047857' : '#b91c1c' }}>
              {feedbackCard.message}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackCard(null)}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: '#6b7280',
              fontSize: '18px',
              lineHeight: 1,
            }}
            aria-label="Fermer la notification"
          >
            ×
          </button>
        </div>
      )}

      {/* Header bar */}
      <div className="dates-header">
        <div>
          <span className="dates-header__title">Calendrier académique</span>
          <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '2px' }}>
            Année {academicYear}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="dates-header__btn" 
            type="button"
            onClick={exportToICal}
            title="Exporter vers votre calendrier"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            Exporter
          </button>
          
          {/* Bouton admin seulement si authentifié */}
          {isAdmin && (
            <button 
              className="dates-header__btn" 
              type="button"
              onClick={() => setIsAdminMode(!isAdminMode)}
              style={{ 
                backgroundColor: isAdminMode ? 'var(--color-green)' : 'var(--color-orange)',
                border: isAdminMode ? '2px solid white' : 'none'
              }}
              title={isAdminMode ? 'Quitter le mode édition' : 'Éditer les dates'}
            >
              {isAdminMode ? '🔒 Fermer' : '✏️ Éditer'}
            </button>
          )}
        </div>
      </div>

      {/* Two-column dates */}
      <div className="dates-grid">
        {/* Semestre A */}
        <div className="dates-col">
          <div className="dates-col__label">
            Semestre A
            <span style={{ fontSize: '0.75rem', opacity: 0.7, display: 'block' }}>
              Septembre - Janvier
            </span>
          </div>
          {datesA.map((date) => (
            <div key={date.id} className="dates-col__row">
              <span>{date.label}</span>
              {isAdminMode && editingId === date.id ? (
                <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    style={{ 
                      width: '120px', 
                      padding: '4px 8px',
                      border: '1px solid var(--color-grey-300)',
                      borderRadius: '4px',
                      color: 'var(--color-navy)',
                      fontSize: '0.9rem'
                    }}
                    placeholder="ex: 15 Septembre"
                    autoFocus
                  />
                  <button 
                    onClick={() => handleSave(date.id)}
                    style={{ 
                      background: 'var(--color-green)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px 10px',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    ✓
                  </button>
                  <button 
                    onClick={handleCancel}
                    style={{ 
                      background: 'var(--color-red)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px 10px',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    ✗
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span style={{ fontWeight: '600', color: 'white' }}>{date.value}</span>
                  {isAdminMode && (
                    <button 
                      onClick={() => handleEdit(date.id, date.value)}
                      style={{ 
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-orange)',
                        cursor: 'pointer',
                        fontSize: '14px',
                        padding: '2px'
                      }}
                      title="Modifier cette date"
                    >
                      ✏️
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Semestre B */}
        <div className="dates-col">
          <div className="dates-col__label">
            Semestre B
            <span style={{ fontSize: '0.75rem', opacity: 0.7, display: 'block' }}>
              Février - Juin
            </span>
          </div>
          {datesB.map((date) => (
            <div key={date.id} className="dates-col__row">
              <span>{date.label}</span>
              {isAdminMode && editingId === date.id ? (
                <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    style={{ 
                      width: '120px', 
                      padding: '4px 8px',
                      border: '1px solid var(--color-grey-300)',
                      borderRadius: '4px',
                      color: 'var(--color-navy)',
                      fontSize: '0.9rem'
                    }}
                    placeholder="ex: 15 Février"
                    autoFocus
                  />
                  <button 
                    onClick={() => handleSave(date.id)}
                    style={{ 
                      background: 'var(--color-green)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px 10px',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    ✓
                  </button>
                  <button 
                    onClick={handleCancel}
                    style={{ 
                      background: 'var(--color-red)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px 10px',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    ✗
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span style={{ fontWeight: '600', color: 'white' }}>{date.value}</span>
                  {isAdminMode && (
                    <button 
                      onClick={() => handleEdit(date.id, date.value)}
                      style={{ 
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-orange)',
                        cursor: 'pointer',
                        fontSize: '14px',
                        padding: '2px'
                      }}
                      title="Modifier cette date"
                    >
                      ✏️
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Indicateur mode admin */}
      {isAdminMode && (
        <div style={{ 
          marginTop: '25px', 
          padding: '12px 15px', 
          background: 'rgba(245, 159, 36, 0.15)', 
          borderRadius: '8px',
          fontSize: '0.85rem',
          border: '1px solid var(--color-orange)',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0, color: 'var(--color-orange)' }}>
            <strong>Mode édition activé</strong> - Cliquez sur ✏️ pour modifier une date
          </p>
        </div>
      )}

      {/* Note de bas de page */}
      <div style={{ 
        marginTop: '20px', 
        fontSize: '0.75rem', 
        opacity: 0.7,
        textAlign: 'center',
        fontStyle: 'italic'
      }}>
        Calendrier académique officiel - ENSAM Meknès
      </div>
    </section>
  );
};