import React from 'react';
import { getEmbedUrlForResource } from '@/lib/utils';

interface Props {
  isOpen: boolean;
  url: string | null;
  onClose: () => void;
}

const ResourcePreviewModal: React.FC<Props> = ({ isOpen, url, onClose }) => {
  if (!isOpen) return null;

  const { embedUrl, canPreview } = getEmbedUrlForResource(url || null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg w-11/12 md:w-3/4 h-3/4 overflow-hidden">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold">Aperçu</h3>
          <div className="flex items-center gap-3">
            {url && (
              <a href={url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline">Ouvrir dans un nouvel onglet</a>
            )}
            <button onClick={onClose} className="text-sm text-gray-600">Fermer</button>
          </div>
        </div>
        <div className="h-full">
          {canPreview && embedUrl ? (
            <iframe src={embedUrl} title="preview" className="w-full h-full" sandbox="allow-scripts allow-same-origin allow-forms" referrerPolicy="no-referrer" />
          ) : (
            <div className="p-6">
              <p className="mb-4">Aperçu non disponible pour ce type de ressource.</p>
              {url ? (
                <a href={url} target="_blank" rel="noreferrer" className="text-blue-600 underline">Ouvrir la ressource</a>
              ) : (
                <div>Aucune ressource à afficher</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResourcePreviewModal;
