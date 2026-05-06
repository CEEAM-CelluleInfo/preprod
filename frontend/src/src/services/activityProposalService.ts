/**
 * Service des propositions d'activites
 */

import { apiPostFormData } from './api.config';
import { ActivityProposal, ActivityProposalCreateData } from '@/types/activity';

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
}
