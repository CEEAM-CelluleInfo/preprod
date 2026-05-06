import { useEffect, useMemo, useState } from 'react';
import { Calendar, CheckCircle2, Clock3, ShieldAlert, Vote as VoteIcon } from 'lucide-react';
import { VoteService } from '@/services/voteService';
import { ActiveVoteSessionResponse, VoteCandidate, VotePosition } from '@/types/vote';
import { getAbsoluteMediaUrl } from '@/lib/utils';

const fmtDateTime = (value?: string) => {
  if (!value) return '-';
  const d = new Date(value);
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const VotePage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ActiveVoteSessionResponse | null>(null);
  const [activePositionIndex, setActivePositionIndex] = useState(0);
  const [pendingCandidate, setPendingCandidate] = useState<VoteCandidate | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingPositionId, setPendingPositionId] = useState<number | null>(null);
  const [motivation, setMotivation] = useState('');
  const [program, setProgram] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [feedbackCard, setFeedbackCard] = useState<{
    type: 'success' | 'error';
    title: string;
    message: string;
  } | null>(null);

  const fetchVoteState = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await VoteService.getActiveSession();
      setData(response);
      setActivePositionIndex(0);
    } catch (err: any) {
      console.error(err);
      setError(err?.detail || 'Impossible de charger la session de vote.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVoteState();
  }, []);

  const positions = useMemo<VotePosition[]>(() => {
    return data?.positions || [];
  }, [data]);

  const activePosition = positions[activePositionIndex];

  const isPositionAlreadyVoted = (positionId: number) => {
    return (data?.voted_position_ids || []).includes(positionId);
  };

  const isCandidateAlreadySelected = (candidateId: number) => {
    return (data?.voted_candidate_ids || []).includes(candidateId);
  };

  const confirmVote = async () => {
    if (!data?.session?.id || !pendingCandidate) return;

    try {
      setIsSubmitting(true);
      await VoteService.submitVote(data.session.id, pendingCandidate.id);
      setPendingCandidate(null);
      await fetchVoteState();
      setFeedbackCard({
        type: 'success',
        title: 'Vote enregistré',
        message: `Votre vote pour ${pendingCandidate.name} a été pris en compte.`,
      });
    } catch (err: any) {
      console.error(err);
      setFeedbackCard({
        type: 'error',
        title: 'Échec du vote',
        message: err?.detail || err?.message || 'Erreur lors de la soumission du vote.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitCandidature = async () => {
    if (!data?.session?.id || pendingPositionId === null) return;

    try {
      setIsSubmitting(true);
      await VoteService.submitCandidature(data.session.id, {
        position_id: pendingPositionId,
        motivation,
        program,
        photo_url: photoUrl,
      });
      setPendingPositionId(null);
      setMotivation('');
      setProgram('');
      setPhotoUrl('');
      await fetchVoteState();
      setFeedbackCard({
        type: 'success',
        title: 'Candidature envoyée',
        message: 'Votre candidature a été soumise avec succès.',
      });
    } catch (err: any) {
      console.error(err);
      setFeedbackCard({
        type: 'error',
        title: 'Échec de la candidature',
        message: err?.detail || err?.message || 'Erreur lors de la soumission de la candidature.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#172d45]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!data || (!data.active && data.phase !== 'candidacy')) {
    const status = data?.period_status || 'none';
    const next = data?.next_session;
    const last = data?.last_session;

    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8">
          <div className="flex items-start gap-3 mb-4">
            <ShieldAlert className="w-6 h-6 text-amber-700 mt-1" />
            <div>
              <h2 className="text-2xl font-bold text-amber-900">Vote indisponible</h2>
              <p className="text-amber-800 mt-1">{data?.message || 'Le vote annuel n\'est pas ouvert actuellement.'}</p>
            </div>
          </div>

          {status === 'upcoming' && next && (
            <div className="mt-6 rounded-xl bg-white border border-amber-200 p-5">
              <h3 className="font-semibold text-amber-900 mb-2">Prochaine session</h3>
              <p className="text-sm text-gray-700">{next.title}</p>
              <p className="text-sm text-gray-700 mt-1">Debut: {fmtDateTime(next.start_date)}</p>
              <p className="text-sm text-gray-700">Fin: {fmtDateTime(next.end_date)}</p>
            </div>
          )}

          {status === 'closed' && last && (
            <div className="mt-6 rounded-xl bg-white border border-amber-200 p-5">
              <h3 className="font-semibold text-amber-900 mb-2">Derniere session cloturee</h3>
              <p className="text-sm text-gray-700">{last.title}</p>
              <p className="text-sm text-gray-700 mt-1">Fin: {fmtDateTime(last.end_date)}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <header className="rounded-2xl bg-[#172d45] text-white p-6 mb-6">
        <h1 className="text-2xl font-bold mb-2">Vote annuel CEEAM</h1>
        <p className="text-white/85">{data.session?.title}</p>
        <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-white/85">
          <span className="inline-flex items-center gap-2"><Calendar className="w-4 h-4" /> Debut: {fmtDateTime(data.session?.start_date)}</span>
          <span className="inline-flex items-center gap-2"><Clock3 className="w-4 h-4" /> Fin: {fmtDateTime(data.session?.end_date)}</span>
        </div>
      </header>

      {feedbackCard && (
        <div
          className={`mb-6 rounded-2xl border p-4 shadow-sm ${
            feedbackCard.type === 'success'
              ? 'border-emerald-200 bg-emerald-50'
              : 'border-red-200 bg-red-50'
          }`}
        >
          <div className="flex items-start gap-3">
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
              ×
            </button>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-[300px,1fr] gap-6">
        <aside className="bg-white border border-gray-200 rounded-2xl p-4 h-fit">
          <h2 className="font-bold text-[#172d45] mb-3">Postes</h2>
          <div className="space-y-2">
            {positions.map((position, idx) => {
              const voted = isPositionAlreadyVoted(position.id);
              return (
                <button
                  key={position.id}
                  onClick={() => setActivePositionIndex(idx)}
                  className={`w-full text-left rounded-lg px-3 py-2 border transition-colors ${
                    idx === activePositionIndex
                      ? 'border-[#f59f24] bg-[#fff8ec]'
                      : 'border-gray-200 hover:border-[#f59f24]/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-[#172d45]">{position.title}</span>
                    {voted && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="bg-white border border-gray-200 rounded-2xl p-5">
          {!activePosition ? (
            <p className="text-gray-500">Aucun poste disponible.</p>
          ) : (
            <>
              <div className="mb-4">
                <h3 className="text-xl font-bold text-[#172d45]">{activePosition.title}</h3>
                {activePosition.description && (
                  <p className="text-gray-600 mt-1">{activePosition.description}</p>
                )}
              </div>

              {data.phase === 'candidacy' ? (
                <div className="space-y-3">
                  <div className="rounded-xl border border-dashed border-gray-300 p-5 text-sm text-gray-600">
                    La phase d'appel a candidatures est ouverte. Vous pouvez postuler sur un seul poste.
                  </div>

                  <button
                    onClick={() => setPendingPositionId(activePosition.id)}
                    disabled={(data.user_candidature_position_ids || []).length > 0}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                      (data.user_candidature_position_ids || []).length > 0
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-[#172d45] text-white hover:bg-[#203a56]'
                    }`}
                  >
                    {(data.user_candidature_position_ids || []).includes(activePosition.id)
                      ? 'Deja candidate sur ce poste'
                      : (data.user_candidature_position_ids || []).length > 0
                        ? 'Vous avez deja candidate'
                        : 'Postuler a ce poste'}
                  </button>
                </div>
              ) : activePosition.candidates.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
                  Aucun candidat approuve pour ce poste.
                </div>
              ) : (
                <div className="space-y-3">
                  {activePosition.candidates.map((candidate) => {
                    const candidateChecked = isCandidateAlreadySelected(candidate.id);
                    const positionLocked = isPositionAlreadyVoted(activePosition.id);
                    const disabled = positionLocked || candidateChecked;

                    return (
                      <div
                        key={candidate.id}
                        className="rounded-xl border border-gray-200 p-4 flex flex-col md:flex-row md:items-center gap-4"
                      >
                        <img
                          src={getAbsoluteMediaUrl(candidate.photo_url) || 'https://placehold.co/120x120'}
                          alt={candidate.name}
                          className="w-16 h-16 rounded-full object-cover border border-gray-200"
                        />

                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-[#172d45]">{candidate.name}</h4>
                          {candidate.motivation && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{candidate.motivation}</p>
                          )}
                          {candidate.program && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">Programme: {candidate.program}</p>
                          )}
                        </div>

                        <button
                          onClick={() => setPendingCandidate(candidate)}
                          disabled={disabled}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                            disabled
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : 'bg-[#172d45] text-white hover:bg-[#203a56]'
                          }`}
                        >
                          {candidateChecked ? 'Vote confirme' : positionLocked ? 'Poste deja vote' : 'Voter'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {pendingCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-[#172d45] mb-2">Confirmer votre vote</h2>
            <p className="text-sm text-gray-600">
              Vous allez voter pour <span className="font-semibold text-gray-900">{pendingCandidate.name}</span>.
              Cette action est definitive pour ce poste.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setPendingCandidate(null)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={confirmVote}
                disabled={isSubmitting}
                className="flex-1 rounded-lg bg-[#172d45] text-white px-4 py-2 text-sm font-semibold hover:bg-[#203a56] disabled:opacity-60"
              >
                {isSubmitting ? 'Envoi...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingPositionId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-[#172d45] mb-3">Soumettre une candidature</h2>
            <div className="space-y-3">
              <textarea
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
                placeholder="Votre motivation"
                className="w-full border border-gray-300 rounded-lg p-3 text-sm"
                rows={3}
              />
              <textarea
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                placeholder="Votre programme"
                className="w-full border border-gray-300 rounded-lg p-3 text-sm"
                rows={3}
              />
              <input
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="Lien de votre photo (optionnel)"
                className="w-full border border-gray-300 rounded-lg p-3 text-sm"
              />
            </div>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setPendingPositionId(null)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={submitCandidature}
                disabled={isSubmitting}
                className="flex-1 rounded-lg bg-[#172d45] text-white px-4 py-2 text-sm font-semibold hover:bg-[#203a56] disabled:opacity-60"
              >
                {isSubmitting ? 'Envoi...' : 'Soumettre'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center gap-2 text-sm text-gray-600">
        <VoteIcon className="w-4 h-4" />
        <span>Un seul vote par poste et par utilisateur pendant la session annuelle.</span>
      </div>
    </div>
  );
};

export default VotePage;
