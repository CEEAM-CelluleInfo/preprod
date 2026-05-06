export interface VoteCandidate {
  id: number;
  position_id: number;
  position_title: string;
  name: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
  motivation?: string;
  program?: string;
  votes_count?: number | null;
}

export interface VotePosition {
  id: number;
  title: string;
  description: string;
  display_order: number;
  candidates: VoteCandidate[];
}

export interface VoteSessionSummary {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'active' | 'closed';
  results_published: boolean;
  positions_count: number;
  created_at: string;
}

export type VotePeriodStatus = 'active' | 'upcoming' | 'closed' | 'none';
export type VotePhase = 'candidacy' | 'voting' | 'none';

export interface ActiveVoteSessionResponse {
  active: boolean;
  period_status: VotePeriodStatus | 'candidacy_open';
  phase?: VotePhase;
  can_apply?: boolean;
  can_vote?: boolean;
  message?: string;
  session?: VoteSessionSummary;
  positions?: VotePosition[];
  user_has_voted?: boolean;
  voted_position_ids?: number[];
  voted_candidate_ids?: number[];
  user_candidature_position_ids?: number[];
  next_session?: VoteSessionSummary;
  last_session?: VoteSessionSummary;
}

export interface VoteSubmitResponse {
  success: boolean;
  message: string;
}

export interface CandidatureSubmitPayload {
  position_id: number;
  motivation?: string;
  program?: string;
  photo_url?: string;
}

export interface CandidatureSubmitResponse {
  success: boolean;
  message: string;
  candidate_id: number;
  approved: boolean;
}
