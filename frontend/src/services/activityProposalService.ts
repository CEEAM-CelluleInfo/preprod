/**
 * Service des propositions d'activites
 */

import { apiGet, apiPatch, apiPostFormData } from './api.config';
import { ActivityProposal, ActivityProposalCreateData } from '@/types/activity';

interface ProposalReviewResponse {
  id: number;
  status: 'approved' | 'rejected';
  message: string;
  activity_id?: number;
  proposal_type?: 'member' | 'guest';
}

export class ActivityProposalService {
  static async submitProposal(
    data: ActivityProposalCreateData,
    imageFile?: File | null
  ): Promise<ActivityProposal> {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('category', data.category);

    if (data.proposed_date) formData.append('proposed_date', data.proposed_date);
    if (data.proposed_time) formData.append('proposed_time', data.proposed_time);
    if (data.location) formData.append('location', data.location);
    if (typeof data.estimated_participants === 'number') {
      formData.append('estimated_participants', String(data.estimated_participants));
    }
    if (data.contact_email) {
      formData.append('contact_email', data.contact_email);
    }
    if (data.additional_info) formData.append('additional_info', data.additional_info);
    if (data.image_url) formData.append('image_url', data.image_url);

    if (imageFile) {
      formData.append('image_file', imageFile);
    }

    return apiPostFormData<ActivityProposal>('/proposals/', formData, false);
  }

  static async getPendingProposals(): Promise<ActivityProposal[]> {
    return apiGet<ActivityProposal[]>('/activities/propose/pending/', true);
  }

  static async reviewProposal(
    proposalId: number,
    status: 'approved' | 'rejected',
    proposalType: 'member' | 'guest' = 'member',
    comment?: string
  ): Promise<ProposalReviewResponse> {
    return apiPatch<ProposalReviewResponse>(
      `/activities/propose/${proposalId}/review/`,
      {
        status,
        proposal_type: proposalType,
        comment: comment || '',
      },
      true
    );
  }
}
