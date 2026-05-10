import React from 'react';
import { ResourceItem } from '@/services/classroomService';
import { ExternalLink } from 'lucide-react';

interface Props {
  resources: ResourceItem[];
  onPreview: (url: string) => void;
}

const ResourcesTable: React.FC<Props> = ({ resources, onPreview }) => {
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
              <td className="px-4 py-2 text-sm text-gray-700">{r.title}</td>
              <td className="px-4 py-2 text-sm text-gray-500">{r.resource_type}</td>
              <td className="px-4 py-2 text-sm text-gray-700 flex gap-2">
                {r.allow_preview && (
                  <button
                    onClick={() => onPreview(r.url)}
                    className="inline-flex items-center gap-2 rounded bg-blue-600 text-white px-3 py-1 text-sm"
                  >
                    Aperçu
                  </button>
                )}
                <a href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded border px-3 py-1 text-sm">
                  Ouvrir <ExternalLink className="w-4 h-4" />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ResourcesTable;
