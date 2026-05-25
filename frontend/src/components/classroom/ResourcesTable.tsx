import React, { useState } from 'react';
import { ResourceItem } from '@/services/classroomService';
import { ExternalLink } from 'lucide-react';

interface Props {
  resources: ResourceItem[];
  onPreview: (url: string) => void;
  onDelete?: (resourceId: number) => void;
  onEditSave?: (resourceId: number, payload: Partial<ResourceItem>) => Promise<void> | void;
}

const CATEGORIES = [
  { key: 'all', label: 'Tout' },
  { key: 'cours', label: 'Cours' },
  { key: 'td', label: 'TD' },
  { key: 'tp', label: 'TP' },
  { key: 'examen', label: 'Examen' },
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  cours: 'Cours',
  td: 'TD',
  tp: 'TP',
  examen: 'Examen',
};

const CATEGORY_COLORS: Record<string, string> = {
  cours: 'bg-blue-100 text-blue-700',
  td: 'bg-green-100 text-green-700',
  tp: 'bg-purple-100 text-purple-700',
  examen: 'bg-red-100 text-red-700',
};

const ResourcesTable: React.FC<Props> = ({ resources, onPreview, onDelete, onEditSave }) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Partial<ResourceItem>>({});
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filtered = activeCategory === 'all'
    ? resources
    : resources.filter((r) => r.category === activeCategory);

  return (
    <div>
      {/* Onglets catégorie */}
      <div className="flex gap-1 mb-3 flex-wrap">
        {CATEGORIES.map((cat) => {
          const count = cat.key === 'all'
            ? resources.length
            : resources.filter((r) => r.category === cat.key).length;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat.key
                  ? 'bg-[#172d45] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.label} {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">Aucune ressource dans cette catégorie.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Titre</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Catégorie</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {editingId === r.id ? (
                      <input
                        className="w-full rounded border p-1"
                        value={draft.title || ''}
                        onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                      />
                    ) : (
                      r.title
                    )}
                  </td>

                  <td className="px-4 py-2 text-sm">
                    {editingId === r.id ? (
                      <select
                        className="rounded border p-1 text-sm"
                        value={draft.category || 'cours'}
                        onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value as ResourceItem['category'] }))}
                      >
                        <option value="cours">Cours</option>
                        <option value="td">TD</option>
                        <option value="tp">TP</option>
                        <option value="examen">Examen</option>
                      </select>
                    ) : (
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[r.category] || 'bg-gray-100 text-gray-600'}`}>
                        {CATEGORY_LABELS[r.category] || r.category}
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-2 text-sm text-gray-700 flex gap-2 flex-wrap">
                    {r.allow_preview && (
                      <button
                        onClick={() => onPreview(r.url)}
                        className="inline-flex items-center gap-1 rounded bg-blue-600 text-white px-3 py-1 text-sm"
                      >
                        Aperçu
                      </button>
                    )}

                    {editingId === r.id ? (
                      <>
                        <button
                          onClick={async () => {
                            if (onEditSave) {
                              try {
                                await onEditSave(r.id, {
                                  title: draft.title,
                                  url: draft.url,
                                  description: draft.description,
                                  resource_type: draft.resource_type,
                                  category: draft.category,
                                });
                                setEditingId(null);
                                setDraft({});
                              } catch (err) {
                                console.error('Erreur sauvegarde ressource', err);
                              }
                            }
                          }}
                          className="inline-flex items-center gap-1 rounded bg-green-600 text-white px-3 py-1 text-sm"
                        >
                          Sauvegarder
                        </button>
                        <button
                          onClick={() => { setEditingId(null); setDraft({}); }}
                          className="inline-flex items-center gap-1 rounded border px-3 py-1 text-sm"
                        >
                          Annuler
                        </button>
                      </>
                    ) : (
                      <>
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded border px-3 py-1 text-sm"
                        >
                          Ouvrir <ExternalLink className="w-3 h-3" />
                        </a>
                        {onEditSave && (
                          <button
                            onClick={() => {
                              setEditingId(r.id);
                              setDraft({ title: r.title, url: r.url, description: r.description, resource_type: r.resource_type, category: r.category });
                            }}
                            className="inline-flex items-center gap-1 rounded border border-slate-200 px-3 py-1 text-sm"
                          >
                            Éditer
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(r.id)}
                            className="inline-flex items-center gap-1 rounded border border-red-200 text-red-700 px-3 py-1 text-sm"
                          >
                            Supprimer
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ResourcesTable;
