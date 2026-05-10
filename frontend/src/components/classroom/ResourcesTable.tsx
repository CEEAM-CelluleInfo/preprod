import React, { useState } from 'react';
import { ResourceItem } from '@/services/classroomService';
import { ExternalLink } from 'lucide-react';

interface Props {
  resources: ResourceItem[];
  onPreview: (url: string) => void;
  onDelete?: (resourceId: number) => void;
  onEditSave?: (resourceId: number, payload: Partial<ResourceItem>) => Promise<void> | void;
}

const ResourcesTable: React.FC<Props> = ({ resources, onPreview, onDelete, onEditSave }) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Partial<ResourceItem>>({});

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Titre</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Type</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {resources.map((r) => (
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
              <td className="px-4 py-2 text-sm text-gray-500">
                {editingId === r.id ? (
                  <input
                    className="w-full rounded border p-1"
                    value={draft.resource_type || ''}
                    onChange={(e) => setDraft((d) => ({ ...d, resource_type: e.target.value }))}
                  />
                ) : (
                  r.resource_type
                )}
              </td>
              <td className="px-4 py-2 text-sm text-gray-700 flex gap-2">
                {r.allow_preview && (
                  <button
                    onClick={() => onPreview(r.url)}
                    className="inline-flex items-center gap-2 rounded bg-blue-600 text-white px-3 py-1 text-sm"
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
                            });
                            setEditingId(null);
                            setDraft({});
                          } catch (err) {
                            console.error('Erreur sauvegarde ressource', err);
                          }
                        }
                      }}
                      className="inline-flex items-center gap-2 rounded bg-green-600 text-white px-3 py-1 text-sm"
                    >
                      Sauvegarder
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setDraft({});
                      }}
                      className="inline-flex items-center gap-2 rounded border px-3 py-1 text-sm"
                    >
                      Annuler
                    </button>
                  </>
                ) : (
                  <>
                    <a href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded border px-3 py-1 text-sm">
                      Ouvrir <ExternalLink className="w-4 h-4" />
                    </a>
                    {onEditSave && (
                      <button
                        onClick={() => {
                          setEditingId(r.id);
                          setDraft({ title: r.title, url: r.url, description: r.description, resource_type: r.resource_type });
                        }}
                        className="inline-flex items-center gap-2 rounded border border-slate-200 px-3 py-1 text-sm"
                      >
                        Éditer
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(r.id)}
                        className="inline-flex items-center gap-2 rounded border border-red-200 text-red-700 px-3 py-1 text-sm"
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
  );
};

export default ResourcesTable;
