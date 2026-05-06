import { apiGet, apiPost } from './api.config';
import {
  ActiveVoteSessionResponse,
  CandidatureSubmitPayload,
  CandidatureSubmitResponse,
  VoteSubmitResponse,
} from '@/types/vote';

export class VoteService {
  static async getActiveSession(): Promise<ActiveVoteSessionResponse> {
    return apiGet<ActiveVoteSessionResponse>('/votes/session-active/', true);
  }

  static async submitVote(sessionId: number, candidateId: number): Promise<VoteSubmitResponse> {
    return apiPost<VoteSubmitResponse>(`/votes/${sessionId}/voter/`, { candidat_id: candidateId }, true);
  }

  static async submitCandidature(
    sessionId: number,
    payload: CandidatureSubmitPayload
  ): Promise<CandidatureSubmitResponse> {
    return apiPost<CandidatureSubmitResponse>(`/votes/${sessionId}/candidatures/`, payload, true);
  }
}
