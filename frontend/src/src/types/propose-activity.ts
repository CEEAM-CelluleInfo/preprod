// ====== TYPES POUR LA PROPOSITION D'ACTIVITÉ ======

export interface ActivityProposal {
  id: number;
  title: string;
  description: string;
  category: 'integration' | 'formation' | 'culture' | 'networking' | 'sport';
  proposedDate: string; // Date ISO: "2024-12-25"
  proposedTime?: string; // "14:00:00"
  location: string;
  estimatedParticipants?: number;
  contactEmail: string;
  additionalInfo?: string;
  imageUrl?: string;
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  submittedAt: string;
  reviewedAt?: string;
  reviewerComment?: string;
  createdBy?: number; // ID de l'utilisateur
  userName?: string; // Nom de l'utilisateur
}

// Type pour le formulaire (ce que l'utilisateur envoie)
export interface ActivityProposalFormData {
  title: string;
  description: string;
  category: 'integration' | 'formation' | 'culture' | 'networking' | 'sport';
  date: string; // Format: "YYYY-MM-DD"
  time: string; // Format: "HH:MM"
  location: string;
  participants: string; // String car venant d'un input
  contactEmail: string;
  additionalInfo: string;
  image?: File; // Optionnel
}

// Type pour la réponse de l'API après soumission
export interface ProposalSubmitResponse {
  id: number;
  title: string;
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  message: string;
  submittedAt: string;
  proposalId: number;
}

// Type pour les erreurs de validation du formulaire
export interface ProposalValidationErrors {
  title?: string;
  description?: string;
  category?: string;
  date?: string;
  time?: string;
  location?: string;
  participants?: string;
  contactEmail?: string;
  additionalInfo?: string;
  image?: string;
  non_field_errors?: string[];
}

// Type pour la réponse paginée des propositions (pour l'admin)
export interface ProposalListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ActivityProposal[];
}

// Type pour mettre à jour le statut (admin)
export interface UpdateProposalStatus {
  status: 'approved' | 'rejected' | 'under_review';
  reviewerComment?: string;
}

// Type pour les filtres de recherche (admin)
export interface ProposalFilterParams {
  status?: 'pending' | 'approved' | 'rejected' | 'under_review';
  category?: 'integration' | 'formation' | 'culture' | 'networking' | 'sport';
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

// Type pour les catégories (pour les selects)
export interface CategoryOption {
  value: 'integration' | 'formation' | 'culture' | 'networking' | 'sport';
  label: string;
}