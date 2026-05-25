import { useState, useEffect, useRef } from 'react';
import { Pencil, Trash2, X, Check, Upload } from 'lucide-react';
import { apiGet, apiPostFormData, apiPutFormData, apiDelete } from '@/services/api.config';

interface HistoricalSG {
  id: number;
  nom: string;
  prenom: string;
  mandat: string;
  campus: string;
  filiere: string;
  image: string | null;
  linkedin: string;
  position: string;
  is_active: boolean;
}

const emptyForm = {
  nom: '',
  prenom: '',
  mandat: '',
  campus: '',
  filiere: '',
  linkedin: '',
};

const LeadersAdmin = () => {
  const [leaders, setLeaders] = useState<HistoricalSG[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchLeaders = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await apiGet<{ results: HistoricalSG[] } | HistoricalSG[]>('/historical-sg/');
      const list = Array.isArray(res) ? res : (res as { results: HistoricalSG[] }).results ?? [];
      setLeaders(list);
    } catch {
      setFetchError('Impossible de charger la liste des anciens SG.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeaders(); }, []);

  const notify = (msg: string, type: 'success' | 'error') => {
    setFeedback({ type, msg });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleEdit = (leader: HistoricalSG) => {
    setEditingId(leader.id);
    setForm({
      nom: leader.nom,
      prenom: leader.prenom,
      mandat: leader.mandat,
      campus: leader.campus,
      filiere: leader.filiere,
      linkedin: leader.linkedin,
    });
    setImageFile(null);
    setImagePreview(leader.image || null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom.trim() || !form.prenom.trim() || !form.mandat.trim()) {
      notify('Nom, prénom et mandat sont requis.', 'error');
      return;
    }
    setSaving(true);
    const fd = new FormData();
    fd.append('nom', form.nom);
    fd.append('prenom', form.prenom);
    fd.append('mandat', form.mandat);
    fd.append('campus', form.campus);
    fd.append('filiere', form.filiere);
    fd.append('linkedin', form.linkedin);
    fd.append('position', 'Secrétaire Général');
    fd.append('executive', `Bureau ${form.mandat}`);
    fd.append('email', '');
    fd.append('nationality', '');
    fd.append('flag', '');
    fd.append('mission', '');
    fd.append('is_active', 'true');
    fd.append('order', '0');
    if (imageFile) {
      fd.append('image', imageFile);
    }
    try {
      if (editingId !== null) {
        await apiPutFormData(`/historical-sg/${editingId}/`, fd, true);
        notify('Ancien SG mis à jour.', 'success');
      } else {
        await apiPostFormData('/historical-sg/', fd, true);
        notify('Ancien SG ajouté.', 'success');
      }
      setEditingId(null);
      setForm(emptyForm);
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchLeaders();
    } catch (err: any) {
      const detail = err?.data ? JSON.stringify(err.data) : (err?.detail || err?.message || 'Erreur lors de la sauvegarde.');
      notify(detail, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Supprimer ${name} ? Cette action est irréversible.`)) return;
    try {
      await apiDelete(`/historical-sg/${id}/`, true);
      notify('Ancien SG supprimé.', 'success');
      await fetchLeaders();
    } catch {
      notify('Erreur lors de la suppression.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {feedback && (
        <div className={`flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-medium ${
          feedback.type === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : 'border-red-200 bg-red-50 text-red-800'
        }`}>
          <span>{feedback.msg}</span>
          <button type="button" onClick={() => setFeedback(null)} className="shrink-0 opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {fetchError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {fetchError}
        </div>
      )}

      <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-base font-bold text-slate-900">
          {editingId !== null ? 'Modifier un ancien SG' : 'Ajouter un ancien Secrétaire Général'}
        </h3>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Prénom *</label>
            <input
              type="text"
              value={form.prenom}
              onChange={(e) => setForm({ ...form, prenom: e.target.value })}
              placeholder="Ex: Amadou"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#f59f24] focus:ring-2 focus:ring-[#f59f24]/20"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Nom *</label>
            <input
              type="text"
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              placeholder="Ex: Traoré"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#f59f24] focus:ring-2 focus:ring-[#f59f24]/20"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Année de mandat *</label>
            <input
              type="text"
              value={form.mandat}
              onChange={(e) => setForm({ ...form, mandat: e.target.value })}
              placeholder="Ex: 2022-2023"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#f59f24] focus:ring-2 focus:ring-[#f59f24]/20"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Campus</label>
            <input
              type="text"
              value={form.campus}
              onChange={(e) => setForm({ ...form, campus: e.target.value })}
              placeholder="Ex: Arts et Métiers Meknes"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#f59f24] focus:ring-2 focus:ring-[#f59f24]/20"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Filière</label>
            <input
              type="text"
              value={form.filiere}
              onChange={(e) => setForm({ ...form, filiere: e.target.value })}
              placeholder="Ex: Génie Mécanique"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#f59f24] focus:ring-2 focus:ring-[#f59f24]/20"
            />
          </div>

          {/* Photo upload */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Photo</label>
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Aperçu"
                className="mb-1 h-14 w-14 rounded-full object-cover ring-2 ring-slate-200"
              />
            )}
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500 transition hover:border-[#f59f24] hover:text-slate-700">
              <Upload className="h-4 w-4 shrink-0" />
              <span className="truncate">{imageFile ? imageFile.name : 'Choisir une photo...'}</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="text-xs font-semibold text-slate-600">LinkedIn</label>
            <input
              type="url"
              value={form.linkedin}
              onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
              placeholder="https://linkedin.com/in/..."
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#f59f24] focus:ring-2 focus:ring-[#f59f24]/20"
            />
          </div>
          <div className="flex gap-3 sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-[#172d45] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0f2236] disabled:opacity-60"
            >
              <Check className="h-4 w-4" />
              {saving ? 'Enregistrement...' : editingId !== null ? 'Mettre à jour' : 'Ajouter'}
            </button>
            {editingId !== null && (
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
                Annuler
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-base font-bold text-slate-900">
            Anciens SG enregistrés ({leaders.length})
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Ces entrées complètent automatiquement le Top 5 affiché sur la page À propos.
          </p>
        </div>

        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-slate-500">Chargement...</div>
        ) : leaders.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-400">
            Aucun ancien SG enregistré. Ajoutez-en un via le formulaire ci-dessus.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {leaders.map((leader) => (
              <div key={leader.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="flex items-center gap-4 min-w-0">
                  {leader.image ? (
                    <img
                      src={leader.image}
                      alt={`${leader.prenom} ${leader.nom}`}
                      className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#172d45] text-sm font-bold text-white">
                      {leader.prenom[0]}{leader.nom[0]}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {leader.prenom} {leader.nom}
                    </p>
                    <p className="text-xs text-slate-500">
                      Mandat {leader.mandat}{leader.campus ? ` · ${leader.campus}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleEdit(leader)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:border-[#f59f24] hover:text-[#f59f24]"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(leader.id, `${leader.prenom} ${leader.nom}`)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:border-red-400 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadersAdmin;
