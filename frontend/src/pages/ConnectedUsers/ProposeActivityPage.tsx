import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertCircle,
  ArrowLeft, 
  Calendar, 
  CheckCircle,
  MapPin, 
  Users, 
  FileText,
  Image as ImageIcon,
  Send,
  Info,
  Check,
  X
} from 'lucide-react';
import Header from '@/components/layout/HeaderConnected';
import Footer from '@/components/layout/Footer';
import { ActivityProposalService } from '@/services/activityProposalService';
import { ActivityCategory, ActivityProposalCreateData } from '@/types/activity';

export const ProposeActivityPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [feedbackCard, setFeedbackCard] = useState<{
    type: 'success' | 'error';
    title: string;
    message: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    activityName: '',
    category: '',
    description: '',
    date: '',
    time: '',
    location: '',
    duration: '',
    participants: '',
    budget: '',
    additionalNotes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const categoryToBackend: Record<string, ActivityCategory> = {
    Sport: 'sport',
    Culture: 'culture',
    Social: 'networking',
    Académique: 'formation',
    Bénévolat: 'integration',
    Autre: 'integration',
  };

  const categories = [
    'Sport',
    'Culture',
    'Social',
    'Académique',
    'Bénévolat',
    'Autre'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setSelectedImageFile(null);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.activityName.trim()) {
      newErrors.activityName = 'Le nom de l\'activité est requis';
    }
    if (!formData.category) {
      newErrors.category = 'Veuillez sélectionner une catégorie';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'La description est requise';
    }
    if (!formData.date) {
      newErrors.date = 'La date est requise';
    }
    if (!formData.location.trim()) {
      newErrors.location = 'Le lieu est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setFeedbackCard(null);
    try {
      const mappedCategory = categoryToBackend[formData.category] || 'integration';

      const details: string[] = [];
      if (formData.duration.trim()) {
        details.push(`Duree estimee: ${formData.duration.trim()}`);
      }
      if (formData.budget.trim()) {
        details.push(`Budget estime (MAD): ${formData.budget.trim()}`);
      }
      if (formData.additionalNotes.trim()) {
        details.push(`Notes: ${formData.additionalNotes.trim()}`);
      }

      const payload: ActivityProposalCreateData = {
        title: formData.activityName.trim(),
        description: formData.description.trim(),
        category: mappedCategory,
        proposed_date: formData.date || undefined,
        proposed_time: formData.time || undefined,
        location: formData.location.trim(),
        estimated_participants: formData.participants ? Number(formData.participants) : undefined,
        additional_info: details.join(' | ') || undefined,
      };

      await ActivityProposalService.submitProposal(payload, selectedImageFile);
      setFeedbackCard({
        type: 'success',
        title: 'Proposition envoyée',
        message: 'Votre proposition a été soumise avec succès. Elle sera examinée par l\'équipe CEEAM.',
      });
      setFormData({
        activityName: '',
        category: '',
        description: '',
        date: '',
        time: '',
        location: '',
        duration: '',
        participants: '',
        budget: '',
        additionalNotes: '',
      });
      setErrors({});
      setImagePreview(null);
      setSelectedImageFile(null);
    } catch (error: any) {
      console.error('Erreur lors de la soumission:', error);
      setFeedbackCard({
        type: 'error',
        title: 'Échec de la soumission',
        message: error?.detail || 'Erreur lors de la soumission. Veuillez réessayer.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Êtes-vous sûr de vouloir annuler ? Toutes les données seront perdues.')) {
      navigate('/activities');
    }
  };

  return (
    <>
      <Header />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header avec gradient orange */}
        <header 
          className="text-white px-6 py-16 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)' }}
        >
          {/* Background pattern */}
          <div 
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'><path fill='%23ffffff' fill-opacity='0.1' d='M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,197.3C672,192,768,160,864,154.7C960,149,1056,171,1152,170.7C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'></path></svg>")`,
              backgroundSize: 'cover',
              backgroundPosition: 'bottom'
            }}
          />

          <div className="max-w-7xl mx-auto relative z-10">
            {/* Back Button */}
            <button
              onClick={() => navigate('/activities')}
              className="flex items-center gap-2 px-6 py-3 bg-white/20 text-white border-2 border-white/30 rounded-lg font-semibold transition-all duration-300 hover:bg-white/30 hover:-translate-x-1 mb-8 cursor-pointer relative z-50"
            >
              <ArrowLeft className="w-5 h-5" />
              Retour aux activités
            </button>

            {/* Title Section */}
            <div className="text-center max-w-3xl mx-auto">
              <h1 
                className="text-6xl font-extrabold mb-4"
                style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)' }}
              >
                Proposer une Activité
              </h1>
              <p className="text-xl opacity-95 leading-relaxed">
                Vous avez une idée brillante ? Partagez-la avec la communauté CEEAM et 
                contribuez à enrichir notre vie étudiante !
              </p>
            </div>
          </div>
        </header>

        {/* Form Container */}
        <div className="max-w-5xl mx-auto px-6 py-12 -mt-8 relative z-20">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <form onSubmit={handleSubmit} className="p-5 sm:p-10">
              {feedbackCard && (
                <div
                  className={`mb-8 rounded-2xl border p-4 shadow-sm ${
                    feedbackCard.type === 'success'
                      ? 'border-emerald-200 bg-emerald-50'
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0">
                      {feedbackCard.type === 'success' ? (
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold ${feedbackCard.type === 'success' ? 'text-emerald-900' : 'text-red-900'}`}>
                        {feedbackCard.title}
                      </p>
                      <p className={`mt-1 text-sm ${feedbackCard.type === 'success' ? 'text-emerald-800' : 'text-red-800'}`}>
                        {feedbackCard.message}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFeedbackCard(null)}
                      className="rounded-full p-1 text-gray-500 transition-colors hover:bg-white/60 hover:text-gray-700"
                      aria-label="Fermer la notification"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
              
              {/* Section 1: Informations générales */}
              <div className="mb-12 pb-8 border-b-2 border-slate-100">
                <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-800 mb-6">
                  <FileText className="w-7 h-7 text-orange-500" />
                  Informations Générales
                </h2>

                <div className="grid grid-cols-2 gap-6 mb-6 items-end">
                  <div className="flex flex-col gap-2">
                    <label className="font-semibold text-slate-700 text-sm relative">
                      Nom de l'activité
                      <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full ml-1 align-super"></span>
                    </label>
                    <input
                      type="text"
                      name="activityName"
                      value={formData.activityName}
                      onChange={handleInputChange}
                      placeholder="Ex: Tournoi de football inter-promotions"
                      className={`px-4 py-3 border-2 rounded-lg text-base transition-all focus:outline-none focus:border-orange-500 focus:shadow-[0_0_0_3px_rgba(249,115,22,0.1)] ${
                        errors.activityName ? 'border-red-500' : 'border-slate-200'
                      }`}
                      required
                    />
                    {errors.activityName && (
                      <span className="text-red-500 text-sm mt-1">{errors.activityName}</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="font-semibold text-slate-700 text-sm relative">
                      Catégorie
                      <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full ml-1 align-super"></span>
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className={`px-4 py-3 border-2 rounded-lg text-base transition-all focus:outline-none focus:border-orange-500 focus:shadow-[0_0_0_3px_rgba(249,115,22,0.1)] bg-white ${
                        errors.category ? 'border-red-500' : 'border-slate-200'
                      }`}
                      required
                    >
                      <option value="">Sélectionner une catégorie</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    {errors.category && (
                      <span className="text-red-500 text-sm mt-1">{errors.category}</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-semibold text-slate-700 text-sm relative">
                    Description de l'activité
                    <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full ml-1 align-super"></span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Décrivez votre activité en détail..."
                    className={`px-4 py-3 border-2 rounded-lg text-base transition-all focus:outline-none focus:border-orange-500 focus:shadow-[0_0_0_3px_rgba(249,115,22,0.1)] resize-y min-h-[120px] ${
                      errors.description ? 'border-red-500' : 'border-slate-200'
                    }`}
                    required
                  />
                  {errors.description && (
                    <span className="text-red-500 text-sm mt-1">{errors.description}</span>
                  )}
                </div>
              </div>

              {/* Section 2: Date et lieu */}
              <div className="mb-12 pb-8 border-b-2 border-slate-100">
                <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-800 mb-6">
                  <Calendar className="w-7 h-7 text-orange-500" />
                  Date et Lieu
                </h2>

                <div className="grid grid-cols-3 gap-6 mb-6 items-end">
                  <div className="flex flex-col gap-2">
                    <label className="font-semibold text-slate-700 text-sm relative">
                      Date
                      <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full ml-1 align-super"></span>
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className={`px-4 py-3 border-2 rounded-lg text-base transition-all focus:outline-none focus:border-orange-500 focus:shadow-[0_0_0_3px_rgba(249,115,22,0.1)] ${
                        errors.date ? 'border-red-500' : 'border-slate-200'
                      }`}
                      required
                    />
                    {errors.date && (
                      <span className="text-red-500 text-sm mt-1">{errors.date}</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="font-semibold text-slate-700 text-sm">
                      Heure
                    </label>
                    <input
                      type="time"
                      name="time"
                      value={formData.time}
                      onChange={handleInputChange}
                      className="px-4 py-3 border-2 border-slate-200 rounded-lg text-base transition-all focus:outline-none focus:border-orange-500 focus:shadow-[0_0_0_3px_rgba(249,115,22,0.1)]"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="font-semibold text-slate-700 text-sm">
                      Durée estimée
                    </label>
                    <input
                      type="text"
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      placeholder="Ex: 2h30"
                      className="px-4 py-3 border-2 border-slate-200 rounded-lg text-base transition-all focus:outline-none focus:border-orange-500 focus:shadow-[0_0_0_3px_rgba(249,115,22,0.1)]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-semibold text-slate-700 text-sm relative">
                    Lieu
                    <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full ml-1 align-super"></span>
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="Ex: Stade universitaire, Amphithéâtre A..."
                    className={`px-4 py-3 border-2 rounded-lg text-base transition-all focus:outline-none focus:border-orange-500 focus:shadow-[0_0_0_3px_rgba(249,115,22,0.1)] ${
                      errors.location ? 'border-red-500' : 'border-slate-200'
                    }`}
                    required
                  />
                  {errors.location && (
                    <span className="text-red-500 text-sm mt-1">{errors.location}</span>
                  )}
                </div>
              </div>

              {/* Section 3: Participants et budget */}
              <div className="mb-12 pb-8 border-b-2 border-slate-100">
                <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-800 mb-6">
                  <Users className="w-7 h-7 text-orange-500" />
                  Participants et Budget
                </h2>

                <div className="grid grid-cols-2 gap-6 items-end">
                  <div className="flex flex-col gap-2">
                    <label className="font-semibold text-slate-700 text-sm">
                      Nombre de participants attendus
                    </label>
                    <input
                      type="number"
                      name="participants"
                      value={formData.participants}
                      onChange={handleInputChange}
                      placeholder="Ex: 50"
                      min="1"
                      className="px-4 py-3 border-2 border-slate-200 rounded-lg text-base transition-all focus:outline-none focus:border-orange-500 focus:shadow-[0_0_0_3px_rgba(249,115,22,0.1)]"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="font-semibold text-slate-700 text-sm">
                      Budget estimé (MAD)
                    </label>
                    <input
                      type="number"
                      name="budget"
                      value={formData.budget}
                      onChange={handleInputChange}
                      placeholder="Ex: 5000"
                      min="0"
                      className="px-4 py-3 border-2 border-slate-200 rounded-lg text-base transition-all focus:outline-none focus:border-orange-500 focus:shadow-[0_0_0_3px_rgba(249,115,22,0.1)]"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Notes et image */}
              <div className="mb-12 pb-8 border-b-2 border-slate-100">
                <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-800 mb-6">
                  <ImageIcon className="w-7 h-7 text-orange-500" />
                  Notes et Média
                </h2>

                <div className="mb-6">
                  <div className="flex flex-col gap-2 max-w-xl">
                    <label className="font-semibold text-slate-700 text-sm">
                      Notes supplémentaires
                    </label>
                    <input
                      type="text"
                      name="additionalNotes"
                      value={formData.additionalNotes}
                      onChange={handleInputChange}
                      placeholder="Informations complémentaires..."
                      className="px-4 py-3 border-2 border-slate-200 rounded-lg text-base transition-all focus:outline-none focus:border-orange-500 focus:shadow-[0_0_0_3px_rgba(249,115,22,0.1)]"
                    />
                  </div>
                </div>

                {/* Image Upload */}
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 bg-slate-50 transition-all hover:border-slate-400 hover:bg-slate-100">
                  {!imagePreview ? (
                    <div className="text-center py-8">
                      <ImageIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-600 mb-4">
                        Ajoutez une image pour illustrer votre activité (optionnel)
                      </p>
                      <label className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold cursor-pointer transition-all hover:bg-orange-600 hover:-translate-y-0.5">
                        Choisir une image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                      <p className="text-slate-400 text-sm mt-4">
                        Format accepté: JPG, PNG, GIF (Max 5MB)
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <img
                        src={imagePreview}
                        alt="Aperçu"
                        className="max-w-full max-h-[300px] rounded-lg mx-auto mb-4"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold transition-colors hover:bg-red-600"
                      >
                        Supprimer l'image
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-center gap-4 mt-12 pt-8 border-t-2 border-slate-100">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-full sm:w-auto px-8 py-4 bg-white text-slate-600 border-2 border-slate-300 rounded-lg font-semibold transition-all hover:bg-slate-100 hover:border-slate-400 sm:min-w-[150px]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 py-4 text-white rounded-lg font-semibold transition-all hover:-translate-y-0.5 flex items-center justify-center gap-3 sm:min-w-[250px] disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ 
                    background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
                    boxShadow: isSubmitting ? 'none' : '0 8px 20px rgba(249, 115, 22, 0.3)'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Soumettre ma proposition
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Info Note */}
            <div
              className="mx-4 sm:mx-10 mb-6 sm:mb-10 p-5 sm:p-8 rounded-xl flex gap-4 items-start relative overflow-hidden text-white"
              style={{ background: 'linear-gradient(135deg, #172d45 0%, #2a4f73 100%)' }}
            >
              <Info className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-bold mb-4">
                  Ce qui se passe ensuite
                </h3>
                <ul className="space-y-3">
                  <li className="pl-6 relative leading-relaxed">
                    <Check className="w-5 h-5 text-yellow-400 absolute left-0 top-0.5" />
                    Votre proposition sera examinée par l'équipe CEEAM
                  </li>
                  <li className="pl-6 relative leading-relaxed">
                    <Check className="w-5 h-5 text-yellow-400 absolute left-0 top-0.5" />
                    Vous recevrez une réponse sous 48 à 72 heures
                  </li>
                  <li className="pl-6 relative leading-relaxed">
                    <Check className="w-5 h-5 text-yellow-400 absolute left-0 top-0.5" />
                    Si approuvée, nous vous aiderons à organiser l'événement
                  </li>
                  <li className="pl-6 relative leading-relaxed">
                    <Check className="w-5 h-5 text-yellow-400 absolute left-0 top-0.5" />
                    L'activité sera ajoutée au calendrier officiel de la CEEAM
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
};

export default ProposeActivityPage;