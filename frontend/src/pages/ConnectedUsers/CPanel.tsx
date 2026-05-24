import { useEffect, useState } from 'react';
import { Play, Plus, Search, Square, Trash2, Vote as VoteIcon } from 'lucide-react';
import Header from '@/components/layout/HeaderConnected';
import Footer from '@/components/layout/Footer';
import {
  LaureatsService,
  LaureatJoinRequestItem,
} from '@/services/laureatsService';
import { AuthService } from '@/services/authService';
import { ActivityProposalService } from '@/services/activityProposalService';
import { ActivityProposal } from '@/types/activity';
import { AdminUserService, RoleOption } from '@/services/adminUserService';
import { ClassroomService, ClassroomItem, SubjectItem } from '@/services/classroomService';
import LeadersAdmin from '@/components/admin/LeadersAdmin';
import { User } from '@/types/auth';
import { VoteService } from '@/services/voteService';
import { AdminVotePositionItem, AdminVoteSessionConfigItem, AdminVoteSessionItem } from '@/types/vote';

const statusClasses: Record<'pending' | 'approved' | 'rejected', string> = {
  pending: 'bg-amber-50 text-amber-800 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  rejected: 'bg-red-50 text-red-800 border-red-200',
};

const statusLabels: Record<'pending' | 'approved' | 'rejected', string> = {
  pending: 'En attente',
  approved: 'Approuvée',
  rejected: 'Rejetée',
};

const detailItemClass =
  'rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600 sm:px-4';

const roleBadgeClasses: Record<User['role'], string> = {
  student: 'bg-slate-100 text-slate-700 border-slate-200',
  bureau: 'bg-blue-50 text-blue-800 border-blue-200',
  admin: 'bg-purple-50 text-purple-800 border-purple-200',
  laureat: 'bg-amber-50 text-amber-800 border-amber-200',
};

const votePhaseClasses: Record<AdminVoteSessionItem['phase'], string> = {
  candidacy: 'bg-sky-50 text-sky-800 border-sky-200',
  voting: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  scheduled: 'bg-slate-100 text-slate-700 border-slate-200',
  closed: 'bg-amber-50 text-amber-800 border-amber-200',
};

const votePhaseLabels: Record<AdminVoteSessionItem['phase'], string> = {
  candidacy: 'Candidatures ouvertes',
  voting: 'Vote ouvert',
  scheduled: 'En attente',
  closed: 'Clôturée',
};

const CPanel = () => {
  const [activeSection, setActiveSection] = useState<'laureats' | 'activities' | 'users' | 'votes' | 'classroom' | 'leaders'>('laureats');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [requests, setRequests] = useState<LaureatJoinRequestItem[]>([]);
  const [proposals, setProposals] = useState<ActivityProposal[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [voteSessions, setVoteSessions] = useState<AdminVoteSessionItem[]>([]);
  const [voteSessionConfigs, setVoteSessionConfigs] = useState<Record<number, AdminVoteSessionConfigItem>>({});
  const [expandedVoteSessionId, setExpandedVoteSessionId] = useState<number | null>(null);
  const [assignableUsers, setAssignableUsers] = useState<User[]>([]);
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);
  const [roleDrafts, setRoleDrafts] = useState<Record<number, User['role']>>({});
  const [newVotePositionDrafts, setNewVotePositionDrafts] = useState<Record<number, { title: string; description: string }>>({});
  const [candidateUserDrafts, setCandidateUserDrafts] = useState<Record<number, number | ''>>({});
  const [userSearch, setUserSearch] = useState('');
  const [voteYearDraft, setVoteYearDraft] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [feedbackCard, setFeedbackCard] = useState<{
    type: 'success' | 'error';
    title: string;
    message: string;
  } | null>(null);
  const [classrooms, setClassrooms] = useState<ClassroomItem[]>([]);
  const [expandedClassroomId, setExpandedClassroomId] = useState<number | null>(null);
  const [classroomSubjects, setClassroomSubjects] = useState<Record<number, SubjectItem[]>>({});
  const [subjectDrafts, setSubjectDrafts] = useState<Record<number, { title: string; description: string }>>({});
  const [newClassroomName, setNewClassroomName] = useState('');
  const [newClassroomCode, setNewClassroomCode] = useState('');
  const [newClassroomDescription, setNewClassroomDescription] = useState('');

  const fetchRequests = async (filter: 'pending' | 'approved' | 'rejected' | 'all') => {
    setIsLoading(true);
    try {
      const response = await LaureatsService.getJoinRequests(filter === 'all' ? undefined : filter);
      setRequests(response.data);
    } catch (error) {
      console.error('Erreur chargement demandes lauréat:', error);
      setFeedbackCard({
        type: 'error',
        title: 'Chargement impossible',
        message: 'Les demandes lauréat n’ont pas pu être chargées.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProposals = async () => {
    setIsLoading(true);
    try {
      const response = await ActivityProposalService.getPendingProposals();
      setProposals(response);
    } catch (error) {
      console.error('Erreur chargement propositions d\'activités:', error);
      setFeedbackCard({
        type: 'error',
        title: 'Chargement impossible',
        message: 'Les propositions d’activités n’ont pas pu être chargées.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClassrooms = async () => {
    setIsLoading(true);
    try {
      const data = await ClassroomService.getClassrooms();
      setClassrooms(data || []);
    } catch (error) {
      console.error('Erreur chargement classrooms:', error);
      setFeedbackCard({ type: 'error', title: 'Chargement impossible', message: 'Les classrooms n’ont pas pu être chargées.' });
    } finally {
      setIsLoading(false);
    }
  };

  const currentUser = AuthService.getCurrentUser();
  const canCreateClassroom = !!(currentUser && (currentUser.is_staff || currentUser.is_superuser || ['admin', 'bureau'].includes((currentUser.role || '').toLowerCase())));
  const canManageSubjects = !!(currentUser && (currentUser.is_staff || currentUser.is_superuser || ['admin', 'bureau', 'adminpromo', 'admin_promo'].includes((currentUser.role || '').toLowerCase())));

  const handleCreateClassroom = async () => {
    if (!newClassroomName.trim()) {
      setFeedbackCard({ type: 'error', title: 'Nom requis', message: 'Le nom de la classroom est requis.' });
      return;
    }
    setProcessingId(-1);
    try {
      await ClassroomService.createClassroom({ name: newClassroomName, code: newClassroomCode || undefined, description: newClassroomDescription || undefined, is_active: true });
      setNewClassroomName('');
      setNewClassroomCode('');
      setNewClassroomDescription('');
      await fetchClassrooms();
      setFeedbackCard({ type: 'success', title: 'Créée', message: 'La classroom a été créée.' });
    } catch (error) {
      console.error('Erreur création classroom:', error);
      setFeedbackCard({ type: 'error', title: 'Création impossible', message: 'La classroom n’a pas pu être créée.' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteClassroom = async (id: number) => {
    if (!confirm('Supprimer cette classroom ? Cette action est irréversible.')) return;
    setProcessingId(id);
    try {
      await ClassroomService.deleteClassroom(id);
      await fetchClassrooms();
      setFeedbackCard({ type: 'success', title: 'Supprimée', message: 'La classroom a été supprimée.' });
    } catch (error) {
      console.error('Erreur suppression classroom:', error);
      setFeedbackCard({ type: 'error', title: 'Suppression impossible', message: 'La classroom n’a pas pu être supprimée.' });
    } finally {
      setProcessingId(null);
    }
  };

  const fetchSubjectsForClassroom = async (classroomId: number) => {
    try {
      const s = await ClassroomService.getSubjects(classroomId);
      setClassroomSubjects((cur) => ({ ...cur, [classroomId]: s }));
    } catch (err) {
      console.error('Erreur chargement matières:', err);
      setFeedbackCard({ type: 'error', title: 'Chargement impossible', message: 'Les matières n’ont pas pu être chargées.' });
    }
  };

  const handleToggleManageSubjects = async (classroomId: number) => {
    if (expandedClassroomId === classroomId) {
      setExpandedClassroomId(null);
      return;
    }
    setExpandedClassroomId(classroomId);
    // load subjects for this classroom
    await fetchSubjectsForClassroom(classroomId);
  };

  const handleCreateSubjectInCPanel = async (classroomId: number) => {
    const draft = subjectDrafts[classroomId] || { title: '', description: '' };
    if (!draft.title.trim()) {
      setFeedbackCard({ type: 'error', title: 'Nom requis', message: 'Le nom de la matière est requis.' });
      return;
    }
    try {
      await ClassroomService.createSubject(classroomId, { title: draft.title, description: draft.description });
      await fetchSubjectsForClassroom(classroomId);
      setSubjectDrafts((cur) => ({ ...cur, [classroomId]: { title: '', description: '' } }));
      setFeedbackCard({ type: 'success', title: 'Matière créée', message: 'La matière a été ajoutée.' });
    } catch (err) {
      console.error('Erreur création matière:', err);
      setFeedbackCard({ type: 'error', title: 'Création impossible', message: 'La matière n’a pas pu être créée.' });
    }
  };

  const fetchUsers = async (search?: string) => {
    setIsLoading(true);
    try {
      const response = await AdminUserService.getUsers(search);
      setUsers(response.data);
      setRoleOptions(response.roles);
      setRoleDrafts(
        response.data.reduce<Record<number, User['role']>>((acc, user) => {
          acc[user.id] = user.role;
          return acc;
        }, {})
      );
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
      setFeedbackCard({
        type: 'error',
        title: 'Chargement impossible',
        message: 'Les utilisateurs n’ont pas pu être chargés.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVoteSessions = async () => {
    setIsLoading(true);
    try {
      const [response, usersResponse] = await Promise.all([
        VoteService.getAdminSessions(),
        assignableUsers.length === 0 ? AdminUserService.getUsers() : Promise.resolve(null),
      ]);
      setVoteSessions(response.data);
      if (usersResponse) {
        setAssignableUsers(usersResponse.data);
      }
    } catch (error) {
      console.error('Erreur chargement sessions de vote:', error);
      setFeedbackCard({
        type: 'error',
        title: 'Chargement impossible',
        message: 'Les sessions de vote n’ont pas pu être chargées.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVoteSessionConfig = async (sessionId: number) => {
    const response = await VoteService.getAdminSessionConfig(sessionId);
    setVoteSessionConfigs((current) => ({
      ...current,
      [sessionId]: response.data,
    }));
  };

  useEffect(() => {
    if (activeSection === 'laureats') {
      fetchRequests(statusFilter);
      return;
    }
    if (activeSection === 'classroom') {
      fetchClassrooms();
      return;
    }

    if (activeSection === 'users') {
      fetchUsers(userSearch);
      return;
    }

    if (activeSection === 'votes') {
      fetchVoteSessions();
      return;
    }

    fetchProposals();
  }, [activeSection, statusFilter, userSearch]);

  const handleStatusUpdate = async (requestId: number, status: 'approved' | 'rejected') => {
    setProcessingId(requestId);
    setFeedbackCard(null);

    try {
      const response = await LaureatsService.updateJoinRequestStatus(requestId, status);
      setRequests((current) => current.map((item) => (item.id === requestId ? response.data : item)));
      setFeedbackCard({
        type: 'success',
        title: status === 'approved' ? 'Demande approuvée' : 'Demande rejetée',
        message:
          status === 'approved'
            ? 'Le rôle lauréat a été activé et un email de reconnexion a été envoyé.'
            : 'La demande a été rejetée.',
      });
    } catch (error) {
      console.error('Erreur mise à jour demande lauréat:', error);
      setFeedbackCard({
        type: 'error',
        title: 'Mise à jour impossible',
        message: 'Le statut de la demande n’a pas pu être modifié.',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleProposalReview = async (proposalId: number, status: 'approved' | 'rejected') => {
    setProcessingId(proposalId);
    setFeedbackCard(null);

    const proposal = proposals.find((item) => item.id === proposalId);

    try {
      const response = await ActivityProposalService.reviewProposal(
        proposalId,
        status,
        proposal?.proposal_type || 'member'
      );
      setProposals((current) => current.filter((item) => item.id !== proposalId));
      setFeedbackCard({
        type: 'success',
        title: status === 'approved' ? 'Proposition approuvée' : 'Proposition rejetée',
        message:
          status === 'approved'
            ? response.activity_id
              ? 'La proposition a été validée et une activité a été créée.'
              : 'La proposition a été validée avec succès.'
            : 'La proposition a été rejetée.',
      });
    } catch (error) {
      console.error('Erreur modération proposition activité:', error);
      setFeedbackCard({
        type: 'error',
        title: 'Traitement impossible',
        message: 'Le statut de la proposition n’a pas pu être modifié.',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRoleUpdate = async (userId: number) => {
    const targetRole = roleDrafts[userId];
    if (!targetRole) {
      return;
    }

    setProcessingId(userId);
    setFeedbackCard(null);

    try {
      const response = await AdminUserService.updateUserRole(userId, targetRole);
      setUsers((current) => current.map((item) => (item.id === userId ? response.data : item)));
      setRoleDrafts((current) => ({
        ...current,
        [userId]: response.data.role,
      }));
      setFeedbackCard({
        type: 'success',
        title: 'Rôle mis à jour',
        message: response.message,
      });
    } catch (error: any) {
      console.error('Erreur mise à jour rôle utilisateur:', error);
      setFeedbackCard({
        type: 'error',
        title: 'Mise à jour impossible',
        message: error?.data?.error || error?.detail || 'Le rôle de cet utilisateur n’a pas pu être modifié.',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleVoteSessionAction = async (sessionId: number, action: 'open' | 'close') => {
    setProcessingId(sessionId);
    setFeedbackCard(null);

    try {
      const response =
        action === 'open'
          ? await VoteService.openVotingSession(sessionId)
          : await VoteService.closeVotingSession(sessionId);

      await fetchVoteSessions();
      setFeedbackCard({
        type: 'success',
        title: action === 'open' ? 'Session de vote ouverte' : 'Session de vote fermée',
        message: response.message,
      });
    } catch (error: any) {
      console.error('Erreur gestion session de vote:', error);
      setFeedbackCard({
        type: 'error',
        title: 'Action impossible',
        message: error?.data?.error || error?.detail || 'La session de vote n’a pas pu être mise à jour.',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleCreateVoteSession = async () => {
    setProcessingId(-1);
    setFeedbackCard(null);

    try {
      const response = await VoteService.createAdminSession(voteYearDraft);
      await fetchVoteSessions();
      setFeedbackCard({
        type: 'success',
        title: 'Session créée',
        message: `${response.message} ${response.data.positions_count} poste(s) officiel(s) ont été préparé(s).`,
      });
    } catch (error: any) {
      console.error('Erreur création session de vote:', error);
      setFeedbackCard({
        type: 'error',
        title: 'Création impossible',
        message: error?.data?.error || error?.detail || 'La session de vote n’a pas pu être créée.',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleVoteSessionConfig = async (sessionId: number) => {
    if (expandedVoteSessionId === sessionId) {
      setExpandedVoteSessionId(null);
      return;
    }

    setProcessingId(sessionId);
    try {
      await fetchVoteSessionConfig(sessionId);
      setExpandedVoteSessionId(sessionId);
    } catch (error: any) {
      console.error('Erreur chargement configuration session:', error);
      setFeedbackCard({
        type: 'error',
        title: 'Chargement impossible',
        message: error?.data?.error || error?.detail || 'La configuration de cette session n’a pas pu être chargée.',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleCreateVotePosition = async (sessionId: number) => {
    const draft = newVotePositionDrafts[sessionId];
    if (!draft?.title.trim()) {
      setFeedbackCard({
        type: 'error',
        title: 'Poste incomplet',
        message: 'Le titre du poste est requis.',
      });
      return;
    }

    setProcessingId(sessionId);
    setFeedbackCard(null);

    try {
      await VoteService.createVotePosition(sessionId, draft);
      await fetchVoteSessionConfig(sessionId);
      await fetchVoteSessions();
      setNewVotePositionDrafts((current) => ({
        ...current,
        [sessionId]: { title: '', description: '' },
      }));
      setFeedbackCard({
        type: 'success',
        title: 'Poste ajouté',
        message: 'Le nouveau poste a été ajouté à la session.',
      });
    } catch (error: any) {
      console.error('Erreur création poste vote:', error);
      setFeedbackCard({
        type: 'error',
        title: 'Création impossible',
        message: error?.data?.error || error?.detail || 'Le poste n’a pas pu être ajouté.',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteVotePosition = async (sessionId: number, positionId: number) => {
    setProcessingId(positionId);
    setFeedbackCard(null);

    try {
      await VoteService.deleteVotePosition(positionId);
      await fetchVoteSessionConfig(sessionId);
      await fetchVoteSessions();
      setFeedbackCard({
        type: 'success',
        title: 'Poste supprimé',
        message: 'Le poste a été retiré de la session.',
      });
    } catch (error: any) {
      console.error('Erreur suppression poste vote:', error);
      setFeedbackCard({
        type: 'error',
        title: 'Suppression impossible',
        message: error?.data?.error || error?.detail || 'Le poste n’a pas pu être supprimé.',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleAddVoteCandidate = async (sessionId: number, positionId: number) => {
    const userId = candidateUserDrafts[positionId];
    if (!userId) {
      setFeedbackCard({
        type: 'error',
        title: 'Candidat manquant',
        message: 'Sélectionne un utilisateur à affecter à ce poste.',
      });
      return;
    }

    setProcessingId(positionId);
    setFeedbackCard(null);

    try {
      await VoteService.addVoteCandidate(positionId, { user_id: Number(userId) });
      await fetchVoteSessionConfig(sessionId);
      await fetchVoteSessions();
      setCandidateUserDrafts((current) => ({
        ...current,
        [positionId]: '',
      }));
      setFeedbackCard({
        type: 'success',
        title: 'Candidat ajouté',
        message: 'Le candidat a bien été affecté à ce poste.',
      });
    } catch (error: any) {
      console.error('Erreur affectation candidat vote:', error);
      setFeedbackCard({
        type: 'error',
        title: 'Affectation impossible',
        message: error?.data?.error || error?.detail || 'Le candidat n’a pas pu être ajouté à ce poste.',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleVoteCandidateApproval = async (sessionId: number, candidateId: number, isApproved: boolean) => {
    setProcessingId(candidateId);
    setFeedbackCard(null);

    try {
      await VoteService.updateVoteCandidateApproval(candidateId, isApproved);
      await fetchVoteSessionConfig(sessionId);
      await fetchVoteSessions();
      setFeedbackCard({
        type: 'success',
        title: isApproved ? 'Candidat approuvé' : 'Approbation retirée',
        message: 'Le statut du candidat a été mis à jour.',
      });
    } catch (error: any) {
      console.error('Erreur mise à jour candidat vote:', error);
      setFeedbackCard({
        type: 'error',
        title: 'Mise à jour impossible',
        message: error?.data?.error || error?.detail || 'Le statut du candidat n’a pas pu être modifié.',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteVoteCandidate = async (sessionId: number, candidateId: number) => {
    setProcessingId(candidateId);
    setFeedbackCard(null);

    try {
      await VoteService.deleteVoteCandidate(candidateId);
      await fetchVoteSessionConfig(sessionId);
      await fetchVoteSessions();
      setFeedbackCard({
        type: 'success',
        title: 'Candidat supprimé',
        message: 'Le candidat a été retiré de ce poste.',
      });
    } catch (error: any) {
      console.error('Erreur suppression candidat vote:', error);
      setFeedbackCard({
        type: 'error',
        title: 'Suppression impossible',
        message: error?.data?.error || error?.detail || 'Le candidat n’a pas pu être supprimé.',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const renderVotePositionConfig = (sessionId: number, position: AdminVotePositionItem, configurationLocked: boolean) => {
    const rankedCandidates = [...position.candidates].sort((left, right) => right.votes_count - left.votes_count);
    const totalVotesForPosition = rankedCandidates.reduce((sum, candidate) => sum + candidate.votes_count, 0);
    const maxVotesForPosition = rankedCandidates.reduce((max, candidate) => Math.max(max, candidate.votes_count), 0);

    return (
      <article key={position.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <h3 className="text-base font-bold text-slate-900 sm:text-lg">{position.title}</h3>
              <span className="inline-flex w-fit rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                {position.approved_candidates_count}/{position.candidates_count} approuvé(s)
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{position.description || 'Aucune description pour ce poste.'}</p>
          </div>

          <button
            type="button"
            disabled={processingId === position.id || configurationLocked}
            onClick={() => handleDeleteVotePosition(sessionId, position.id)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
          >
            <Trash2 className="h-4 w-4" />
            Supprimer le poste
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Candidats pour ce poste</p>
              <p className="mt-1 text-sm text-slate-500">Choisis un utilisateur puis affecte-le au poste.</p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <select
                value={candidateUserDrafts[position.id] || ''}
                disabled={configurationLocked}
                onChange={(event) =>
                  setCandidateUserDrafts((current) => ({
                    ...current,
                    [position.id]: event.target.value ? Number(event.target.value) : '',
                  }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition-colors focus:border-[#172d45] sm:min-w-[260px]"
              >
                <option value="">Sélectionner un utilisateur</option>
                {assignableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {(user.full_name || `${user.first_name} ${user.last_name}`.trim() || user.email)} - {user.email}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={processingId === position.id || configurationLocked}
                onClick={() => handleAddVoteCandidate(sessionId, position.id)}
                className="rounded-xl bg-[#172d45] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0f2235] disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {processingId === position.id ? 'Ajout...' : 'Ajouter ce candidat'}
              </button>
            </div>
          </div>

          {position.candidates.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              Aucun candidat défini pour ce poste.
            </div>
          ) : (
            <>
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Tendance actuelle</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Diagramme agrégé des votes pour ce poste. Aucun votant individuel n’est affiché.
                    </p>
                  </div>
                  <span className="inline-flex w-fit rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                    {totalVotesForPosition} vote(s) comptabilisé(s)
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {rankedCandidates.map((candidate) => {
                    const share = totalVotesForPosition > 0 ? (candidate.votes_count / totalVotesForPosition) * 100 : 0;
                    const barWidth = maxVotesForPosition > 0 ? (candidate.votes_count / maxVotesForPosition) * 100 : 0;

                    return (
                      <div key={`trend-${candidate.id}`} className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {candidate.user.full_name || `${candidate.user.first_name || ''} ${candidate.user.last_name || ''}`.trim() || candidate.user.email}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {candidate.is_approved ? 'Candidat approuvé' : 'Candidat non encore approuvé'}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                            <span>{candidate.votes_count} vote(s)</span>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                              {share.toFixed(1)}%
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${candidate.is_approved ? 'bg-[#172d45]' : 'bg-slate-300'}`}
                            style={{ width: `${Math.max(barWidth, candidate.votes_count > 0 ? 8 : 0)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {position.candidates.map((candidate) => (
                  <div key={candidate.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                          <p className="text-sm font-semibold text-slate-900">
                            {candidate.user.full_name || `${candidate.user.first_name || ''} ${candidate.user.last_name || ''}`.trim() || candidate.user.email}
                          </p>
                          <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${candidate.is_approved ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
                            {candidate.is_approved ? 'Approuvé' : 'En attente'}
                          </span>
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          <div className={detailItemClass}>
                            <p className="font-semibold text-slate-900">Email</p>
                            <p className="mt-1 break-all">{candidate.user.email}</p>
                          </div>
                          <div className={detailItemClass}>
                            <p className="font-semibold text-slate-900">Promotion</p>
                            <p className="mt-1 break-words">{candidate.user.promotion || '-'}</p>
                          </div>
                          <div className={detailItemClass}>
                            <p className="font-semibold text-slate-900">Campus</p>
                            <p className="mt-1 break-words">{candidate.user.campus || '-'}</p>
                          </div>
                          <div className={detailItemClass}>
                            <p className="font-semibold text-slate-900">Votes</p>
                            <p className="mt-1 break-words">{candidate.votes_count}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:w-56 lg:flex-col">
                        <button
                          type="button"
                          disabled={processingId === candidate.id || configurationLocked}
                          onClick={() => handleVoteCandidateApproval(sessionId, candidate.id, !candidate.is_approved)}
                          className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          {processingId === candidate.id ? 'Traitement...' : candidate.is_approved ? 'Retirer l’approbation' : 'Approuver'}
                        </button>
                        <button
                          type="button"
                          disabled={processingId === candidate.id || configurationLocked}
                          onClick={() => handleDeleteVoteCandidate(sessionId, candidate.id)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                        >
                          <Trash2 className="h-4 w-4" />
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </article>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="flex-1">
        <section className="bg-[#172d45] text-white">
          <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 sm:py-10">
            <p className="text-xs uppercase tracking-[0.22em] text-[#f59f24] sm:text-sm">CPanel</p>
            <h1 className="mt-2 max-w-3xl text-2xl font-bold leading-tight sm:text-3xl">
              Validation des demandes et propositions
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200 sm:text-[15px]">
              Les membres du bureau et les administrateurs peuvent examiner ici les demandes
              lauréat ainsi que les propositions d’activités en attente, puis les valider ou les rejeter.
            </p>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-8">
          <div className="mb-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setActiveSection('laureats')}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                activeSection === 'laureats'
                  ? 'bg-[#172d45] text-white'
                  : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-400'
              }`}
            >
              Demandes lauréat
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('activities')}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                activeSection === 'activities'
                  ? 'bg-[#172d45] text-white'
                  : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-400'
              }`}
            >
              Propositions d’activités
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('users')}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                activeSection === 'users'
                  ? 'bg-[#172d45] text-white'
                  : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-400'
              }`}
            >
              Utilisateurs et rôles
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('classroom')}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                activeSection === 'classroom'
                  ? 'bg-[#172d45] text-white'
                  : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-400'
              }`}
            >
              Classroom
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('votes')}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                activeSection === 'votes'
                  ? 'bg-[#172d45] text-white'
                  : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-400'
              }`}
            >
              Sessions de vote
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('leaders')}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                activeSection === 'leaders'
                  ? 'bg-[#172d45] text-white'
                  : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-400'
              }`}
            >
              Anciens SG
            </button>
          </div>

          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {activeSection === 'laureats' ? (
              <>
                <div className="-mx-1 overflow-x-auto pb-2">
                  <div className="flex min-w-max gap-2 px-1 sm:flex-wrap sm:min-w-0">
                    {(['pending', 'approved', 'rejected', 'all'] as const).map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setStatusFilter(filter)}
                        className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                          statusFilter === filter
                            ? 'bg-[#172d45] text-white'
                            : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        {filter === 'pending'
                          ? 'En attente'
                          : filter === 'approved'
                            ? 'Approuvées'
                            : filter === 'rejected'
                              ? 'Rejetées'
                              : 'Toutes'}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-slate-500 lg:text-right">{requests.length} demande(s) affichée(s)</p>
              </>
            ) : activeSection === 'activities' ? (
              <p className="text-sm text-slate-500 lg:text-right">{proposals.length} proposition(s) en attente</p>
            ) : activeSection === 'users' ? (
              <>
                <label className="relative block w-full max-w-md">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={userSearch}
                    onChange={(event) => setUserSearch(event.target.value)}
                    placeholder="Rechercher par nom, email, promotion ou campus"
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition-colors focus:border-[#172d45]"
                  />
                </label>
                <p className="text-sm text-slate-500 lg:text-right">{users.length} utilisateur(s) affiché(s)</p>
              </>
            ) : activeSection === 'classroom' ? (
              <>
                {canCreateClassroom ? (
                  <>
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={newClassroomName}
                        onChange={(e) => setNewClassroomName(e.target.value)}
                        placeholder="Nom de la classroom"
                        className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition-colors focus:border-[#172d45]"
                      />
                      <input
                        type="text"
                        value={newClassroomCode}
                        onChange={(e) => setNewClassroomCode(e.target.value)}
                        placeholder="Code (facultatif)"
                        className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition-colors focus:border-[#172d45]"
                      />
                      <button
                        type="button"
                        disabled={processingId === -1}
                        onClick={handleCreateClassroom}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#172d45] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0f2235] disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        <Plus className="h-4 w-4" />
                        {processingId === -1 ? 'Création...' : 'Créer'}
                      </button>
                    </div>
                    <p className="text-sm text-slate-500 lg:text-right">{classrooms.length} classroom(s)</p>
                  </>
                ) : (
                  <p className="text-sm text-slate-500 lg:text-right">{classrooms.length} classroom(s)</p>
                )}
              </>
            ) : activeSection === ‘leaders’ ? null : (
              <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <p className="max-w-2xl text-sm leading-6 text-slate-500">
                  Aujourd’hui les postes officiels sont préremplis à la création d’une session. Tu peux maintenant compléter ou ajuster la configuration en définissant toi-même les postes et les candidats par poste, sans jamais exposer qui a voté pour qui.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
                  <input
                    type="number"
                    min={2020}
                    max={2100}
                    value={voteYearDraft}
                    onChange={(event) => setVoteYearDraft(Number(event.target.value) || new Date().getFullYear())}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition-colors focus:border-[#172d45] sm:w-36"
                    aria-label="Année de la session de vote"
                  />
                  <button
                    type="button"
                    disabled={processingId === -1}
                    onClick={handleCreateVoteSession}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#172d45] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0f2235] disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <Plus className="h-4 w-4" />
                    {processingId === -1 ? 'Création...' : 'Créer une session'}
                  </button>
                </div>
              </div>
            )}
          </div>

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
                  className="rounded-full p-1 text-slate-500 transition-colors hover:bg-white/70 hover:text-slate-700"
                  aria-label="Fermer la notification"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm sm:p-10">
              {activeSection === 'laureats'
                ? 'Chargement des demandes...'
                : activeSection === 'activities'
                  ? 'Chargement des propositions...'
                  : activeSection === 'users'
                    ? 'Chargement des utilisateurs...'
                    : 'Chargement des sessions de vote...'}
            </div>
          ) : activeSection === 'laureats' ? (
            requests.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm sm:p-10">
              Aucune demande ne correspond au filtre sélectionné.
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <article key={request.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                        <h2 className="min-w-0 break-words text-lg font-bold leading-tight text-slate-900 sm:text-xl">
                          {request.nom || 'Demande sans nom'}
                        </h2>
                        <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses[request.status]}`}>
                          {statusLabels[request.status]}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        <div className={detailItemClass}>
                          <p className="font-semibold text-slate-900">Email</p>
                          <p className="mt-1 break-all">{request.contact || request.user_email || '-'}</p>
                        </div>
                        <div className={detailItemClass}>
                          <p className="font-semibold text-slate-900">Promotion</p>
                          <p className="mt-1 break-words">{request.promotion || '-'}</p>
                        </div>
                        <div className={detailItemClass}>
                          <p className="font-semibold text-slate-900">Spécialité</p>
                          <p className="mt-1 break-words">{request.specialite || '-'}</p>
                        </div>
                        <div className={detailItemClass}>
                          <p className="font-semibold text-slate-900">Poste</p>
                          <p className="mt-1 break-words">{request.poste || '-'}</p>
                        </div>
                        <div className={detailItemClass}>
                          <p className="font-semibold text-slate-900">Entreprise</p>
                          <p className="mt-1 break-words">{request.entreprise || '-'}</p>
                        </div>
                        <div className={detailItemClass}>
                          <p className="font-semibold text-slate-900">Ville / Pays</p>
                          <p className="mt-1 break-words">{[request.ville, request.pays].filter(Boolean).join(', ') || '-'}</p>
                        </div>
                        <div className={detailItemClass}>
                          <p className="font-semibold text-slate-900">Utilisateur lié</p>
                          <p className="mt-1 break-all">{request.user_email || 'Aucun compte lié'}</p>
                        </div>
                        <div className={detailItemClass}>
                          <p className="font-semibold text-slate-900">Soumise le</p>
                          <p className="mt-1 break-words">{new Date(request.submitted_at).toLocaleString('fr-FR')}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:w-44 lg:flex-col">
                      <button
                        type="button"
                        disabled={processingId === request.id || request.status === 'approved'}
                        onClick={() => handleStatusUpdate(request.id, 'approved')}
                        className="w-full rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                      >
                        {processingId === request.id ? 'Traitement...' : 'Accepter'}
                      </button>
                      <button
                        type="button"
                        disabled={processingId === request.id || request.status === 'rejected'}
                        onClick={() => handleStatusUpdate(request.id, 'rejected')}
                        className="w-full rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                      >
                        {processingId === request.id ? 'Traitement...' : 'Rejeter'}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            )
          ) : activeSection === 'activities' ? proposals.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm sm:p-10">
              Aucune proposition d’activité n’est en attente.
            </div>
          ) : (
            <div className="space-y-4">
              {proposals.map((proposal) => (
                <article key={proposal.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                        <h2 className="min-w-0 break-words text-lg font-bold leading-tight text-slate-900 sm:text-xl">
                          {proposal.title}
                        </h2>
                        <span className="inline-flex w-fit rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                          En attente
                        </span>
                      </div>

                      <p className="mt-4 text-sm leading-7 text-slate-600">{proposal.description}</p>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        <div className={detailItemClass}>
                          <p className="font-semibold text-slate-900">Catégorie</p>
                          <p className="mt-1 break-words">{proposal.category || '-'}</p>
                        </div>
                        <div className={detailItemClass}>
                          <p className="font-semibold text-slate-900">Date proposée</p>
                          <p className="mt-1 break-words">{proposal.proposed_date ? new Date(proposal.proposed_date).toLocaleDateString('fr-FR') : '-'}</p>
                        </div>
                        <div className={detailItemClass}>
                          <p className="font-semibold text-slate-900">Heure proposée</p>
                          <p className="mt-1 break-words">{proposal.proposed_time || '-'}</p>
                        </div>
                        <div className={detailItemClass}>
                          <p className="font-semibold text-slate-900">Lieu</p>
                          <p className="mt-1 break-words">{proposal.location || '-'}</p>
                        </div>
                        <div className={detailItemClass}>
                          <p className="font-semibold text-slate-900">Participants estimés</p>
                          <p className="mt-1 break-words">{proposal.estimated_participants || '-'}</p>
                        </div>
                        <div className={detailItemClass}>
                          <p className="font-semibold text-slate-900">Contact</p>
                          <p className="mt-1 break-all">{proposal.contact_email || '-'}</p>
                        </div>
                        <div className={detailItemClass}>
                          <p className="font-semibold text-slate-900">Créée par</p>
                          <p className="mt-1 break-words">{proposal.created_by_name || 'Soumission externe'}</p>
                        </div>
                        <div className={detailItemClass}>
                          <p className="font-semibold text-slate-900">Source</p>
                          <p className="mt-1 break-words">
                            {proposal.proposal_type === 'guest' ? 'Proposition visiteur' : 'Proposition membre connecté'}
                          </p>
                        </div>
                        <div className={detailItemClass}>
                          <p className="font-semibold text-slate-900">Soumise le</p>
                          <p className="mt-1 break-words">{new Date(proposal.submitted_at).toLocaleString('fr-FR')}</p>
                        </div>
                      </div>

                      {proposal.additional_info && (
                        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                          <p className="font-semibold text-slate-900">Informations complémentaires</p>
                          <p className="mt-2 whitespace-pre-line leading-6">{proposal.additional_info}</p>
                        </div>
                      )}

                      {(proposal.image_file_url || proposal.image_url) && (
                        <div className="mt-4">
                          <img
                            src={proposal.image_file_url || proposal.image_url}
                            alt={proposal.title}
                            className="max-h-64 w-full rounded-2xl border border-slate-200 object-cover sm:max-w-md"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:w-44 lg:flex-col">
                      <button
                        type="button"
                        disabled={processingId === proposal.id}
                        onClick={() => handleProposalReview(proposal.id, 'approved')}
                        className="w-full rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                      >
                        {processingId === proposal.id ? 'Traitement...' : 'Approuver'}
                      </button>
                      <button
                        type="button"
                        disabled={processingId === proposal.id}
                        onClick={() => handleProposalReview(proposal.id, 'rejected')}
                        className="w-full rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                      >
                        {processingId === proposal.id ? 'Traitement...' : 'Rejeter'}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : activeSection === 'classroom' ? (
            classrooms.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm sm:p-10">
                Aucune classroom définie.
              </div>
            ) : (
              <div className="space-y-4">
                {classrooms.map((room) => (
                  <article key={room.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">{room.name}</h2>
                        <p className="mt-2 text-sm text-slate-600">{room.description || 'Aucune description'}</p>
                        <p className="mt-2 text-xs text-slate-500">Code: {room.code || '-'}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        {canCreateClassroom && (
                          <button
                            type="button"
                            disabled={processingId === room.id}
                            onClick={() => handleDeleteClassroom(room.id)}
                            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                          >
                            <Trash2 className="h-4 w-4" /> Supprimer
                          </button>
                        )}
                        {canManageSubjects && (
                          <button
                            type="button"
                            disabled={processingId === room.id}
                            onClick={() => handleToggleManageSubjects(room.id)}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 mt-2"
                          >
                            Gérer matières
                          </button>
                        )}
                      </div>
                    </div>
                    {expandedClassroomId === room.id && (
                      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <h3 className="font-semibold mb-3">Matières pour {room.name}</h3>
                        <div className="space-y-3">
                          {(classroomSubjects[room.id] || []).map((sub) => (
                            <div key={sub.id} className="rounded-lg bg-white p-3 border border-slate-200">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-semibold text-slate-900">{sub.title}</p>
                                  <p className="text-sm text-slate-500">{sub.description || '—'}</p>
                                </div>
                                {canManageSubjects && (
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        // enter edit mode for this subject
                                        setSubjectDrafts((cur) => ({ ...cur, [room.id]: { title: sub.title, description: sub.description || '' } }));
                                        setExpandedClassroomId(room.id);
                                        // mark editing using a temporary negative id key
                                        setSubjectDrafts((cur) => ({ ...cur, [`edit_${sub.id}` as any]: { title: sub.title, description: sub.description || '' } }));
                                      }}
                                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                    >
                                      Éditer
                                    </button>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        if (!confirm('Supprimer cette matière ?')) return;
                                        try {
                                          await ClassroomService.deleteSubject(room.id, sub.id);
                                          await fetchSubjectsForClassroom(room.id);
                                          setFeedbackCard({ type: 'success', title: 'Supprimée', message: 'La matière a été supprimée.' });
                                        } catch (err) {
                                          console.error('Erreur suppression matière', err);
                                          setFeedbackCard({ type: 'error', title: 'Suppression impossible', message: 'La matière n’a pas pu être supprimée.' });
                                        }
                                      }}
                                      className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-1 text-sm font-semibold text-red-700 hover:bg-red-50"
                                    >
                                      Supprimer
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Edit form for this subject (shown when draft exists for key edit_<id>) */}
                              {((subjectDrafts as any)[`edit_${sub.id}`]) && (
                                <div className="mt-3 space-y-2">
                                  <input
                                    type="text"
                                    value={(subjectDrafts as any)[`edit_${sub.id}`].title}
                                    onChange={(e) => setSubjectDrafts((cur) => ({ ...cur, [`edit_${sub.id}`]: { ...(cur[`edit_${sub.id}`] || {}), title: e.target.value } }))}
                                    className="w-full rounded-md border p-2"
                                  />
                                  <input
                                    type="text"
                                    value={(subjectDrafts as any)[`edit_${sub.id}`].description}
                                    onChange={(e) => setSubjectDrafts((cur) => ({ ...cur, [`edit_${sub.id}`]: { ...(cur[`edit_${sub.id}`] || {}), description: e.target.value } }))}
                                    className="w-full rounded-md border p-2"
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={async () => {
                                        const draft = (subjectDrafts as any)[`edit_${sub.id}`];
                                        try {
                                          await ClassroomService.updateSubject(room.id, sub.id, { title: draft.title, description: draft.description });
                                          await fetchSubjectsForClassroom(room.id);
                                          const updated = { ...subjectDrafts };
                                          delete (updated as any)[`edit_${sub.id}`];
                                          setSubjectDrafts(updated);
                                          setFeedbackCard({ type: 'success', title: 'Mise à jour', message: 'La matière a été mise à jour.' });
                                        } catch (err) {
                                          console.error('Erreur mise à jour matière', err);
                                          setFeedbackCard({ type: 'error', title: 'Mise à jour impossible', message: 'La matière n’a pas pu être mise à jour.' });
                                        }
                                      }}
                                      className="px-3 py-1 rounded bg-green-600 text-white"
                                    >
                                      Sauvegarder
                                    </button>
                                    <button
                                      onClick={() => {
                                        const updated = { ...subjectDrafts };
                                        delete (updated as any)[`edit_${sub.id}`];
                                        setSubjectDrafts(updated);
                                      }}
                                      className="px-3 py-1 rounded border"
                                    >
                                      Annuler
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}

                          {canManageSubjects && (
                            <div className="mt-2 bg-white p-3 rounded-lg border border-dashed border-slate-200">
                              <p className="font-medium mb-2">Ajouter une matière</p>
                              <input
                                type="text"
                                value={(subjectDrafts[room.id]?.title) || ''}
                                onChange={(e) => setSubjectDrafts((cur) => ({ ...cur, [room.id]: { ...(cur[room.id] || { title: '', description: '' }), title: e.target.value } }))}
                                placeholder="Nom de la matière"
                                className="w-full rounded-md border border-slate-200 p-2"
                              />
                              <input
                                type="text"
                                value={(subjectDrafts[room.id]?.description) || ''}
                                onChange={(e) => setSubjectDrafts((cur) => ({ ...cur, [room.id]: { ...(cur[room.id] || { title: '', description: '' }), description: e.target.value } }))}
                                placeholder="Description (optionnelle)"
                                className="w-full rounded-md border border-slate-200 p-2 mt-2"
                              />
                              <div className="mt-2">
                                <button type="button" onClick={() => handleCreateSubjectInCPanel(room.id)} className="px-4 py-2 rounded bg-blue-600 text-white">Créer la matière</button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )
          ) : activeSection === 'users' ? users.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm sm:p-10">
              Aucun utilisateur ne correspond à la recherche.
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => {
                const draftRole = roleDrafts[user.id] || user.role;
                const hasChanged = draftRole !== user.role;

                return (
                  <article key={user.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                          <h2 className="min-w-0 break-words text-lg font-bold leading-tight text-slate-900 sm:text-xl">
                            {user.full_name || `${user.first_name} ${user.last_name}`.trim() || user.email}
                          </h2>
                          <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${roleBadgeClasses[user.role]}`}>
                            {roleOptions.find((role) => role.value === user.role)?.label || user.role}
                          </span>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          <div className={detailItemClass}>
                            <p className="font-semibold text-slate-900">Email</p>
                            <p className="mt-1 break-all">{user.email}</p>
                          </div>
                          <div className={detailItemClass}>
                            <p className="font-semibold text-slate-900">Promotion</p>
                            <p className="mt-1 break-words">{user.promotion || '-'}</p>
                          </div>
                          <div className={detailItemClass}>
                            <p className="font-semibold text-slate-900">Campus</p>
                            <p className="mt-1 break-words">{user.campus || '-'}</p>
                          </div>
                          <div className={detailItemClass}>
                            <p className="font-semibold text-slate-900">Nationalité</p>
                            <p className="mt-1 break-words">{user.country_name || '-'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col gap-3 lg:w-64">
                        <select
                          value={draftRole}
                          onChange={(event) =>
                            setRoleDrafts((current) => ({
                              ...current,
                              [user.id]: event.target.value as User['role'],
                            }))
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition-colors focus:border-[#172d45]"
                        >
                          {roleOptions.map((role) => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={processingId === user.id || !hasChanged}
                          onClick={() => handleRoleUpdate(user.id)}
                          className="w-full rounded-xl bg-[#172d45] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0f2235] disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          {processingId === user.id ? 'Mise à jour...' : 'Changer le rôle'}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : voteSessions.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm sm:p-10">
              <p>Aucune session de vote n’est disponible pour le moment.</p>
              <p className="mt-3 text-sm text-slate-400">
                Crée d’abord une session annuelle avec le bouton ci-dessus. Les postes officiels seront générés automatiquement.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {voteSessions.map((session) => (
                <article key={session.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                        <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#172d45]/8 text-[#172d45]">
                          <VoteIcon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <h2 className="min-w-0 break-words text-lg font-bold leading-tight text-slate-900 sm:text-xl">
                            {session.title}
                          </h2>
                          <p className="mt-1 text-sm text-slate-500">
                            {session.description || 'Aucune description fournie pour cette session.'}
                          </p>
                        </div>
                        <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${votePhaseClasses[session.phase]}`}>
                          {votePhaseLabels[session.phase]}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div className={detailItemClass}>
                          <p className="font-semibold text-slate-900">Début du vote</p>
                          <p className="mt-1 break-words">{new Date(session.start_date).toLocaleString('fr-FR')}</p>
                        </div>
                        <div className={detailItemClass}>
                          <p className="font-semibold text-slate-900">Fin du vote</p>
                          <p className="mt-1 break-words">{new Date(session.end_date).toLocaleString('fr-FR')}</p>
                        </div>
                        <div className={detailItemClass}>
                          <p className="font-semibold text-slate-900">Postes</p>
                          <p className="mt-1 break-words">{session.positions_count}</p>
                        </div>
                        <div className={detailItemClass}>
                          <p className="font-semibold text-slate-900">Candidats approuvés</p>
                          <p className="mt-1 break-words">{session.approved_candidates_count}</p>
                        </div>
                        <div className={detailItemClass}>
                          <p className="font-semibold text-slate-900">Votes enregistrés</p>
                          <p className="mt-1 break-words">{session.total_votes}</p>
                        </div>
                        <div className={detailItemClass}>
                          <p className="font-semibold text-slate-900">Résultats publiés</p>
                          <p className="mt-1 break-words">{session.results_published ? 'Oui' : 'Non'}</p>
                        </div>
                        <div className={detailItemClass}>
                          <p className="font-semibold text-slate-900">Créée par</p>
                          <p className="mt-1 break-words">{session.created_by_name || '-'}</p>
                        </div>
                        <div className={detailItemClass}>
                          <p className="font-semibold text-slate-900">Appel à candidatures</p>
                          <p className="mt-1 break-words">
                            {session.candidacy_start_date && session.candidacy_end_date
                              ? `${new Date(session.candidacy_start_date).toLocaleString('fr-FR')} - ${new Date(session.candidacy_end_date).toLocaleString('fr-FR')}`
                              : 'Non configuré'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:w-52 lg:flex-col">
                      <button
                        type="button"
                        disabled={processingId === session.id}
                        onClick={() => handleToggleVoteSessionConfig(session.id)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100"
                      >
                        {processingId === session.id ? 'Chargement...' : expandedVoteSessionId === session.id ? 'Fermer la configuration' : 'Configurer postes et candidats'}
                      </button>
                      <button
                        type="button"
                        disabled={processingId === session.id || !session.can_open}
                        onClick={() => handleVoteSessionAction(session.id, 'open')}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                      >
                        <Play className="h-4 w-4" />
                        {processingId === session.id ? 'Traitement...' : 'Ouvrir le vote'}
                      </button>
                      <button
                        type="button"
                        disabled={processingId === session.id || !session.can_close}
                        onClick={() => handleVoteSessionAction(session.id, 'close')}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        <Square className="h-4 w-4" />
                        {processingId === session.id ? 'Traitement...' : 'Fermer le vote'}
                      </button>
                    </div>
                  </div>

                  {expandedVoteSessionId === session.id && voteSessionConfigs[session.id] && (
                    <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-6">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">Configuration de la session</h3>
                          <p className="mt-1 text-sm text-slate-500">
                            Définis ici les postes en compétition et les candidats associés à chaque poste.
                          </p>
                        </div>
                        <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${voteSessionConfigs[session.id].configuration_locked ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
                          {voteSessionConfigs[session.id].configuration_locked ? 'Configuration verrouillée' : 'Configuration modifiable'}
                        </span>
                      </div>

                      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-sm font-semibold text-slate-900">Ajouter un poste</p>
                        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                          <input
                            type="text"
                            value={newVotePositionDrafts[session.id]?.title || ''}
                            disabled={voteSessionConfigs[session.id].configuration_locked}
                            onChange={(event) =>
                              setNewVotePositionDrafts((current) => ({
                                ...current,
                                [session.id]: {
                                  title: event.target.value,
                                  description: current[session.id]?.description || '',
                                },
                              }))
                            }
                            placeholder="Titre du poste"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition-colors focus:border-[#172d45]"
                          />
                          <input
                            type="text"
                            value={newVotePositionDrafts[session.id]?.description || ''}
                            disabled={voteSessionConfigs[session.id].configuration_locked}
                            onChange={(event) =>
                              setNewVotePositionDrafts((current) => ({
                                ...current,
                                [session.id]: {
                                  title: current[session.id]?.title || '',
                                  description: event.target.value,
                                },
                              }))
                            }
                            placeholder="Description du poste"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition-colors focus:border-[#172d45]"
                          />
                          <button
                            type="button"
                            disabled={processingId === session.id || voteSessionConfigs[session.id].configuration_locked}
                            onClick={() => handleCreateVotePosition(session.id)}
                            className="rounded-xl bg-[#172d45] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0f2235] disabled:cursor-not-allowed disabled:bg-slate-300"
                          >
                            Ajouter le poste
                          </button>
                        </div>
                      </div>

                      <div className="mt-5 space-y-4">
                        {voteSessionConfigs[session.id].positions.length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
                            Aucun poste n’est encore défini pour cette session.
                          </div>
                        ) : (
                          voteSessionConfigs[session.id].positions.map((position) =>
                            renderVotePositionConfig(session.id, position, voteSessionConfigs[session.id].configuration_locked)
                          )
                        )}
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}

          {activeSection === 'leaders' && (
            <LeadersAdmin />
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CPanel;