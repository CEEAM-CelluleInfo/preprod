import { apiDelete, apiGet, apiPatch, apiPost } from './api.config';
import {
  ActiveVoteSessionResponse,
  AdminVoteCandidateItem,
  AdminVoteSessionConfigResponse,
  AdminVoteSessionsResponse,
  AdminVotePositionItem,
  CandidatureSubmitPayload,
  CandidatureSubmitResponse,
  CreateVoteSessionResponse,
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

  static async getAdminSessions(): Promise<AdminVoteSessionsResponse> {
    return apiGet<AdminVoteSessionsResponse>('/admin/votes/sessions/', true);
  }

  static async createAdminSession(year: number): Promise<CreateVoteSessionResponse> {
    return apiPost<CreateVoteSessionResponse>('/admin/votes/sessions/', { year }, true);
  }

  static async getAdminSessionConfig(sessionId: number): Promise<AdminVoteSessionConfigResponse> {
    return apiGet<AdminVoteSessionConfigResponse>(`/admin/votes/sessions/${sessionId}/config/`, true);
  }

  static async createVotePosition(
    sessionId: number,
    payload: { title: string; description?: string }
  ): Promise<{ message: string; data: AdminVotePositionItem }> {
    return apiPost<{ message: string; data: AdminVotePositionItem }>(
      `/admin/votes/sessions/${sessionId}/positions/`,
      payload,
      true
    );
  }

  static async deleteVotePosition(positionId: number): Promise<void> {
    return apiDelete(`/admin/votes/positions/${positionId}/`, true);
  }

  static async addVoteCandidate(
    positionId: number,
    payload: { user_id: number; motivation?: string; program?: string; photo_url?: string }
  ): Promise<{ message: string; data: AdminVoteCandidateItem }> {
    return apiPost<{ message: string; data: AdminVoteCandidateItem }>(
      `/admin/votes/positions/${positionId}/candidates/`,
      payload,
      true
    );
  }

  static async updateVoteCandidateApproval(
    candidateId: number,
    isApproved: boolean
  ): Promise<{ message: string; data: AdminVoteCandidateItem }> {
    return apiPatch<{ message: string; data: AdminVoteCandidateItem }>(
      `/admin/votes/candidates/${candidateId}/approval/`,
      { is_approved: isApproved },
      true
    );
  }

  static async deleteVoteCandidate(candidateId: number): Promise<void> {
    return apiDelete(`/admin/votes/candidates/${candidateId}/`, true);
  }

  static async openVotingSession(sessionId: number): Promise<VoteSubmitResponse> {
    return apiPost<VoteSubmitResponse>(`/votes/${sessionId}/start-voting/`, {}, true);
  }

  static async closeVotingSession(sessionId: number): Promise<VoteSubmitResponse> {
    return apiPost<VoteSubmitResponse>(`/votes/${sessionId}/close/`, {}, true);
  }
}
